using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SiesaAgents.Infrastructure.Data;
using Testcontainers.PostgreSql;

namespace SiesaAgents.IntegrationTests.Data;

/// <summary>
/// Integration tests for AC #1 (database created + __ef_migrations_history snake_case)
/// — TC-E1-P1-05. Uses Testcontainers.PostgreSql to spin up a real Postgres 18 instance.
/// RED phase: these tests fail until AppDbContext + InitialCreate migration exist
/// AND ApplySnakeCaseNaming is wired (so __ef_migrations_history columns are snake_case).
/// </summary>
public class MigrationsIntegrationTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:18")
        .WithDatabase("siesa_agents_db")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public Task InitializeAsync() => _postgres.StartAsync();

    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();

    [Fact]
    public async Task MigrateAsync_CreatesEfMigrationsHistoryTable_WithSnakeCaseColumns()
    {
        // GIVEN: a clean Postgres 18 instance and an AppDbContext pointing at it.
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        // WHEN: EF Core applies the migrations.
        await using (var context = new AppDbContext(options))
        {
            await context.Database.MigrateAsync();
        }

        // THEN: __ef_migrations_history exists with snake_case columns migration_id and product_version.
        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "SELECT column_name FROM information_schema.columns WHERE table_name = '__ef_migrations_history' ORDER BY ordinal_position;",
            connection);

        var columns = new List<string>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            columns.Add(reader.GetString(0));
        }

        columns.Should().NotBeEmpty("the __ef_migrations_history table must exist after MigrateAsync");
        columns.Should().Contain("migration_id");
        columns.Should().Contain("product_version");
        columns.Should().NotContain("MigrationId");
        columns.Should().NotContain("ProductVersion");
    }

    [Fact]
    public async Task MigrateAsync_DoesNotCreateClientesOrContactosTables()
    {
        // GIVEN: a clean Postgres 18 instance.
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        // WHEN: the initial migration is applied.
        await using (var context = new AppDbContext(options))
        {
            await context.Database.MigrateAsync();
        }

        // THEN: no domain tables (clientes/contactos) exist — scope note enforced.
        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';",
            connection);

        var tables = new List<string>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            tables.Add(reader.GetString(0));
        }

        tables.Should().NotContain("clientes", "domain tables arrive in Story 2.1, not 1.3");
        tables.Should().NotContain("contactos", "domain tables arrive in Story 3.1, not 1.3");
    }

    [Fact]
    public async Task MigrateAsync_ProducesAtLeastOneAppliedMigration()
    {
        // GIVEN: a clean Postgres 18 instance.
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        await using var context = new AppDbContext(options);

        // WHEN: migrations are applied.
        await context.Database.MigrateAsync();

        // THEN: at least one migration was recorded as applied.
        var applied = await context.Database.GetAppliedMigrationsAsync();
        applied.Should().NotBeEmpty("InitialCreate migration must be applied");
    }
}
