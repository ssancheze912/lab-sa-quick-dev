using Microsoft.EntityFrameworkCore;
using Npgsql;
using SiesaAgents.Infrastructure.Data;
using Testcontainers.PostgreSql;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Story 2.1 — TC-E2-P2-01 (RED phase).
///
/// Verifies that the <c>AddClientes</c> migration creates the <c>clientes</c>
/// table with exclusively snake_case columns and the mandated unique index
/// <c>uk_clientes_nit_ruc</c>. Reuses the Testcontainers Postgres pattern
/// established in Story 1.3 (<see cref="EfCoreMigrationTests"/>).
///
/// RED-phase expectation: fails to compile / run until
///   • <see cref="SiesaAgents.Domain.Clientes.Entities.ClienteEntity"/> exists (Task 1)
///   • <see cref="AppDbContext"/> declares <c>DbSet&lt;ClienteEntity&gt; Clientes</c> (Task 2)
///   • the <c>ClienteConfiguration</c> is applied via
///     <c>ApplyConfigurationsFromAssembly</c> (Task 2)
///   • <c>dotnet ef migrations add AddClientes</c> is run (Task 3)
///
/// Column expectations (per Story 2.1 AC #6):
///   id, nombre, nit_ruc, telefono, ciudad, created_at, updated_at
///
/// Index expectations:
///   pk_clientes (primary key on id)
///   uk_clientes_nit_ruc (unique index on nit_ruc)
///
/// When Docker is unavailable in the sandbox, the test self-skips.
/// </summary>
public class ClientesMigrationTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer? _postgres;
    private readonly bool _dockerAvailable;

    public ClientesMigrationTests()
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
    public async Task AddClientes_migration_creates_snake_case_columns_only()
    {
        Skip.IfNot(
            _dockerAvailable,
            "Docker daemon unavailable — TC-E2-P2-01 requires Testcontainers Postgres. Verify manually with `dotnet ef database update` + `\\d clientes`.");

        // GIVEN: A throwaway Postgres container and an AppDbContext bound to it.
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres!.GetConnectionString())
            .Options;
        await using var dbContext = new AppDbContext(options);

        // WHEN: EF Core migrations are applied against the fresh database.
        await dbContext.Database.MigrateAsync();

        // THEN: The `clientes` table has exactly the mandated snake_case columns.
        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync();

        var columns = new List<string>();
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = @"
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'clientes'
                ORDER BY ordinal_position;";
            await using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                columns.Add(reader.GetString(0));
            }
        }

        Assert.Contains("id", columns);
        Assert.Contains("nombre", columns);
        Assert.Contains("nit_ruc", columns);
        Assert.Contains("telefono", columns);
        Assert.Contains("ciudad", columns);
        Assert.Contains("created_at", columns);
        Assert.Contains("updated_at", columns);

        // Reject PascalCase leakage — proves ApplySnakeCaseNaming is applied last.
        Assert.DoesNotContain("Id", columns);
        Assert.DoesNotContain("Nombre", columns);
        Assert.DoesNotContain("NitRuc", columns);
        Assert.DoesNotContain("CreatedAt", columns);
        Assert.DoesNotContain("UpdatedAt", columns);
    }

    [SkippableFact]
    public async Task AddClientes_migration_creates_unique_index_on_nit_ruc()
    {
        Skip.IfNot(
            _dockerAvailable,
            "Docker daemon unavailable — TC-E2-P2-01 requires Testcontainers Postgres.");

        // GIVEN: A throwaway Postgres container with migrations applied
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres!.GetConnectionString())
            .Options;
        await using var dbContext = new AppDbContext(options);
        await dbContext.Database.MigrateAsync();

        // WHEN: Indexes on `clientes` are inspected
        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync();

        var indexes = new List<string>();
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = @"
                SELECT indexname
                FROM pg_indexes
                WHERE tablename = 'clientes'
                ORDER BY indexname;";
            await using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                indexes.Add(reader.GetString(0));
            }
        }

        // THEN: Both the primary key and the unique NIT/RUC index exist
        Assert.Contains("pk_clientes", indexes);
        Assert.Contains("uk_clientes_nit_ruc", indexes);
    }

    [SkippableFact]
    public async Task AddClientes_migration_does_not_create_contactos_table()
    {
        Skip.IfNot(
            _dockerAvailable,
            "Docker daemon unavailable — scope guard also enforced by inspecting the migration file.");

        // GIVEN: Fresh Postgres with migrations applied
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres!.GetConnectionString())
            .Options;
        await using var dbContext = new AppDbContext(options);
        await dbContext.Database.MigrateAsync();

        // WHEN: The public schema is enumerated
        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync();

        var tables = new List<string>();
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = @"
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name;";
            await using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                tables.Add(reader.GetString(0));
            }
        }

        // THEN: `clientes` exists but `contactos` does NOT (Epic 3 scope)
        Assert.Contains("clientes", tables);
        Assert.DoesNotContain("contactos", tables);
    }

    private static bool IsDockerAvailable()
    {
        var socket = Environment.GetEnvironmentVariable("DOCKER_HOST");
        if (!string.IsNullOrWhiteSpace(socket))
        {
            return true;
        }
        return File.Exists("/var/run/docker.sock");
    }
}
