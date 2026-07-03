using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using SiesaAgents.Infrastructure.Data;
using Testcontainers.PostgreSql;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// TC-E1-P1-05 + TC-E1-P2-04 — Applying EF Core migrations to a real PostgreSQL
/// instance MUST create <c>__ef_migrations_history</c> with snake_case columns
/// (<c>migration_id</c>, <c>product_version</c>). This proves both the migration
/// pipeline and the <c>ApplySnakeCaseNaming</c> extension are wired correctly.
///
/// Environments without Docker (sandbox / CI without daemon) cannot spin the
/// Testcontainers Postgres image. Those tests self-skip via
/// <see cref="SkippableFactAttribute"/> — TC-E1-P2-04 remains covered by the
/// unit-level <c>AppDbContextConventionTests</c>. The developer MUST run
/// <c>dotnet ef database update</c> manually when Docker is unavailable and
/// record the outcome in the Story 1.3 Dev Agent Record.
/// </summary>
public class EfCoreMigrationTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer? _postgres;
    private readonly bool _dockerAvailable;

    public EfCoreMigrationTests()
    {
        _dockerAvailable = IsDockerAvailable();

        _postgres = _dockerAvailable
            ? new PostgreSqlBuilder()
                .WithImage("postgres:18-alpine")
                .WithDatabase("siesa_agents_db_test")
                .WithUsername("postgres")
                .WithPassword("postgres")
                .Build()
            : null;
    }

    public async Task InitializeAsync()
    {
        if (_postgres is not null)
        {
            await _postgres.StartAsync();
        }
    }

    public async Task DisposeAsync()
    {
        if (_postgres is not null)
        {
            await _postgres.DisposeAsync();
        }
    }

    [SkippableFact]
    public async Task ApplyMigrations_creates_ef_migrations_history_table_with_snake_case_columns()
    {
        Skip.IfNot(
            _dockerAvailable,
            "Docker daemon unavailable — TC-E1-P2-04 covered by AppDbContextConventionTests; verify Postgres path manually via `dotnet ef database update`.");

        // GIVEN: a throwaway Postgres container and an AppDbContext bound to it.
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres!.GetConnectionString())
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

    [SkippableFact]
    public async Task ApplyMigrations_does_not_create_domain_tables_in_initial_migration()
    {
        Skip.IfNot(
            _dockerAvailable,
            "Docker daemon unavailable — scope guard also enforced statically by inspecting the generated `*_InitialCreate.cs` (no CreateTable calls).");

        // GIVEN: a throwaway Postgres container with the AppDbContext applied
        //        ONLY up to the InitialCreate migration (Story 1.3 baseline).
        //        Later migrations (AddClientes from Story 2.1) legitimately add
        //        domain tables, so this test scopes the assertion to the initial
        //        migration alone via IMigrator.MigrateAsync(targetMigration).
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres!.GetConnectionString())
            .Options;

        await using var dbContext = new AppDbContext(options);

        // WHEN: only the initial migration is applied.
        var migrator = dbContext.GetInfrastructure().GetRequiredService<IMigrator>();
        await migrator.MigrateAsync("InitialCreate");

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

    /// <summary>
    /// Detects a reachable Docker daemon. Returns <c>false</c> in sandboxes /
    /// CI runners without Docker so Testcontainers tests can self-skip instead
    /// of crashing at container-builder validation time.
    /// </summary>
    private static bool IsDockerAvailable()
    {
        var socket = Environment.GetEnvironmentVariable("DOCKER_HOST");
        if (!string.IsNullOrWhiteSpace(socket))
        {
            return true;
        }

        // Default Linux socket path.
        return File.Exists("/var/run/docker.sock");
    }
}
