using Microsoft.EntityFrameworkCore;
using Npgsql;
using SiesaAgents.Infrastructure.Data;
using Testcontainers.PostgreSql;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// TC-E1-P1-05 + TC-E1-P2-04 — Applying EF Core migrations to a real PostgreSQL
/// instance MUST create `__ef_migrations_history` with snake_case columns
/// (`migration_id`, `product_version`). This proves both the migration pipeline
/// and the `ApplySnakeCaseNaming` extension are wired correctly.
///
/// RED-phase expectation for Story 1.3:
///   Fails to compile until `AppDbContext` (Task 3) and the initial migration
///   (Task 5) exist. If TestContainers cannot pull the Postgres image due to
///   sandbox proxy limits, the AppDbContextConventionTests unit-level fallback
///   (TC-E1-P2-04) still exercises the snake_case rule end-to-end without a
///   live database.
/// </summary>
public class EfCoreMigrationTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:18-alpine")
        .WithDatabase("siesa_agents_db_test")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
    }

    public async Task DisposeAsync()
    {
        await _postgres.DisposeAsync();
    }

    [Fact]
    public async Task ApplyMigrations_creates_ef_migrations_history_table_with_snake_case_columns()
    {
        // GIVEN: a throwaway Postgres container and an AppDbContext bound to it.
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        await using var dbContext = new AppDbContext(options);

        // WHEN: EF Core migrations are applied against the fresh database.
        await dbContext.Database.MigrateAsync();

        // THEN: the `__ef_migrations_history` table exists with snake_case
        //       columns proving `ApplySnakeCaseNaming` is active.
        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = @"
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = '__ef_migrations_history'
            ORDER BY column_name;";

        var columns = new List<string>();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            columns.Add(reader.GetString(0));
        }

        Assert.Contains("migration_id", columns);
        Assert.Contains("product_version", columns);

        // Reject PascalCase leakage — proves snake_case is applied not skipped.
        Assert.DoesNotContain("MigrationId", columns);
        Assert.DoesNotContain("ProductVersion", columns);
    }

    [Fact]
    public async Task ApplyMigrations_does_not_create_domain_tables_in_initial_migration()
    {
        // GIVEN: a throwaway Postgres container with the AppDbContext applied.
        //        Story 1.3 explicitly bans `clientes` and `contactos` — those
        //        tables belong to Story 2.1 and Story 3.1 respectively.
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        await using var dbContext = new AppDbContext(options);

        // WHEN: the initial migration is applied.
        await dbContext.Database.MigrateAsync();

        // THEN: no domain tables exist yet — only the EF metadata table.
        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = @"
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;";

        var tables = new List<string>();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            tables.Add(reader.GetString(0));
        }

        Assert.Contains("__ef_migrations_history", tables);
        Assert.DoesNotContain("clientes", tables);
        Assert.DoesNotContain("contactos", tables);
    }
}
