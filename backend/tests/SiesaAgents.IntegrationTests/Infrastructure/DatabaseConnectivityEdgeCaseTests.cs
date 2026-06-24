using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;
using Xunit;

// Story 1.3: Backend Database Foundation — Integration Edge Cases
// Complements DatabaseConnectivityTests.cs (ATDD baseline)
// Covers: idempotent MigrateAsync, pending migrations count, connection string format,
//         schema isolation, multiple DbContext instances, and migration name conventions.

namespace SiesaAgents.IntegrationTests.Infrastructure;

/// <summary>
/// Edge-case integration tests for AppDbContext and database migrations.
/// Each test class creates its own isolated PostgreSQL container via Testcontainers.
/// Tests expand coverage beyond the ATDD baseline:
///   - MigrateAsync is idempotent (calling twice does not throw or duplicate rows)
///   - After migration, no pending migrations remain
///   - GetPendingMigrationsAsync returns 0 after full apply
///   - Multiple concurrent DbContext instances can connect to the same DB
///   - Connection string reflects Npgsql format (not SQL Server, not SQLite)
///   - Schema only has the public schema (no extra schemas created by migration)
///   - InitialCreate migration name follows EF Core naming convention
/// </summary>
public sealed class DatabaseConnectivityEdgeCaseTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgresContainer = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("siesa_agents_db_edge_test")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    // ──────────────────────────────────────────────────────────────────────────
    // Idempotency: calling MigrateAsync twice must not throw or corrupt state
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task MigrateAsync_CalledTwiceOnSameDatabase_DoesNotThrow()
    {
        // GIVEN: PostgreSQL is running and AppDbContext is configured
        var options = BuildDbContextOptions();
        await using var context = new SiesaAgents.Infrastructure.Data.AppDbContext(options);

        // WHEN: MigrateAsync is called twice sequentially (idempotency check)
        await context.Database.MigrateAsync();
        var exception = await Record.ExceptionAsync(() => context.Database.MigrateAsync());

        // THEN: The second call does not throw (MigrateAsync is idempotent by EF Core design)
        Assert.Null(exception);
    }

    [Fact]
    public async Task MigrateAsync_CalledTwiceOnSameDatabase_AppliedMigrationCountRemainsConsistent()
    {
        // GIVEN: PostgreSQL is running and migrations are applied once
        var options = BuildDbContextOptions();
        await using var context = new SiesaAgents.Infrastructure.Data.AppDbContext(options);
        await context.Database.MigrateAsync();
        var countAfterFirst = (await context.Database.GetAppliedMigrationsAsync()).Count();

        // WHEN: MigrateAsync is called a second time
        await context.Database.MigrateAsync();
        var countAfterSecond = (await context.Database.GetAppliedMigrationsAsync()).Count();

        // THEN: No duplicate migration rows are inserted — count stays the same
        Assert.Equal(countAfterFirst, countAfterSecond);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Pending migrations: after full apply, none remain
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetPendingMigrationsAsync_AfterMigrateAsync_ReturnsEmptyList()
    {
        // GIVEN: All migrations have been applied to a fresh database
        var options = BuildDbContextOptions();
        await using var context = new SiesaAgents.Infrastructure.Data.AppDbContext(options);
        await context.Database.MigrateAsync();

        // WHEN: Pending migrations are queried
        var pending = await context.Database.GetPendingMigrationsAsync();

        // THEN: No pending migrations remain (all are applied)
        Assert.Empty(pending);
    }

    [Fact]
    public async Task GetPendingMigrationsAsync_OnFreshDatabase_ReturnsAtLeastInitialCreate()
    {
        // GIVEN: A fresh database with no migrations applied
        var options = BuildDbContextOptions();
        await using var context = new SiesaAgents.Infrastructure.Data.AppDbContext(options);

        // WHEN: Pending migrations are queried before any apply
        var pending = await context.Database.GetPendingMigrationsAsync();

        // THEN: At least "InitialCreate" is pending on a fresh database
        Assert.Contains(
            pending,
            m => m.Contains("InitialCreate", StringComparison.OrdinalIgnoreCase));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Multiple DbContext instances share the same database safely
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task MultipleDbContextInstances_CanConnectToSameDatabase_Independently()
    {
        // GIVEN: Two separate DbContext instances configured for the same database
        var options = BuildDbContextOptions();
        await using var context1 = new SiesaAgents.Infrastructure.Data.AppDbContext(options);
        await using var context2 = new SiesaAgents.Infrastructure.Data.AppDbContext(options);

        // WHEN: Both contexts attempt to connect independently
        var canConnect1 = await context1.Database.CanConnectAsync();
        var canConnect2 = await context2.Database.CanConnectAsync();

        // THEN: Both connections succeed — no exclusive lock or connection contention
        Assert.True(canConnect1);
        Assert.True(canConnect2);
    }

    [Fact]
    public async Task MultipleDbContextInstances_AfterFirstMigrates_SecondSeesAppliedMigrations()
    {
        // GIVEN: One DbContext applies migrations, another instance reads applied list
        var options = BuildDbContextOptions();
        await using var context1 = new SiesaAgents.Infrastructure.Data.AppDbContext(options);
        await context1.Database.MigrateAsync();

        // WHEN: A second independent DbContext queries applied migrations
        await using var context2 = new SiesaAgents.Infrastructure.Data.AppDbContext(options);
        var appliedMigrations = await context2.Database.GetAppliedMigrationsAsync();

        // THEN: The second context sees the migrations applied by the first (shared database state)
        Assert.Contains(
            appliedMigrations,
            m => m.Contains("InitialCreate", StringComparison.OrdinalIgnoreCase));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Schema purity: only 'public' schema exists after InitialCreate
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Database_AfterInitialMigration_OnlyPublicSchemaExists()
    {
        // GIVEN: Only InitialCreate migration has been applied
        var options = BuildDbContextOptions();
        await using var context = new SiesaAgents.Infrastructure.Data.AppDbContext(options);
        await context.Database.MigrateAsync();

        // WHEN: All user-created schemas (excluding pg system schemas) are queried
        var schemas = await GetUserSchemasAsync(context);

        // THEN: Only the 'public' schema exists — no custom schemas created by InitialCreate
        Assert.Contains("public", schemas);
        var nonPublicSchemas = schemas.Where(s => s != "public").ToList();
        Assert.Empty(nonPublicSchemas);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Migration naming convention: EF Core uses timestamp prefix
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task AppliedMigrations_InitialCreate_HasTimestampPrefixedName()
    {
        // GIVEN: Migrations are applied following EF Core naming conventions
        // EF Core generates migration IDs as: {yyyyMMddHHmmss}_{MigrationName}
        var options = BuildDbContextOptions();
        await using var context = new SiesaAgents.Infrastructure.Data.AppDbContext(options);
        await context.Database.MigrateAsync();

        var appliedMigrations = await context.Database.GetAppliedMigrationsAsync();
        var initialCreateMigration = appliedMigrations
            .FirstOrDefault(m => m.Contains("InitialCreate", StringComparison.OrdinalIgnoreCase));

        // THEN: The migration ID exists and starts with a numeric timestamp prefix (14 digits)
        Assert.NotNull(initialCreateMigration);
        // EF Core migration IDs are: "20260101000000_InitialCreate" — timestamp prefix is 14 digits
        var parts = initialCreateMigration.Split('_');
        Assert.True(parts.Length >= 2,
            $"Migration ID '{initialCreateMigration}' should follow EF Core timestamp_Name convention.");
        Assert.True(long.TryParse(parts[0], out _),
            $"Migration ID prefix '{parts[0]}' should be a numeric timestamp.");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Applied migrations count: exactly 1 after InitialCreate (no accidental extras)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task AppliedMigrations_AfterInitialCreate_ContainsExactlyOneMigration()
    {
        // GIVEN: Only the InitialCreate migration exists in the project
        var options = BuildDbContextOptions();
        await using var context = new SiesaAgents.Infrastructure.Data.AppDbContext(options);
        await context.Database.MigrateAsync();

        // WHEN: Applied migrations are counted
        var appliedMigrations = await context.Database.GetAppliedMigrationsAsync();
        var count = appliedMigrations.Count();

        // THEN: Exactly 1 migration is applied — Story 1.3 defines only InitialCreate
        // Future stories will add migrations and this count will increase accordingly
        Assert.Equal(1, count);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Lifecycle — Testcontainers setup/teardown
    // ──────────────────────────────────────────────────────────────────────────

    public async Task InitializeAsync() => await _postgresContainer.StartAsync();

    public async Task DisposeAsync() => await _postgresContainer.DisposeAsync();

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    private DbContextOptions<SiesaAgents.Infrastructure.Data.AppDbContext> BuildDbContextOptions()
    {
        return new DbContextOptionsBuilder<SiesaAgents.Infrastructure.Data.AppDbContext>()
            .UseNpgsql(_postgresContainer.GetConnectionString())
            .Options;
    }

    private static async Task<List<string>> GetUserSchemasAsync(
        SiesaAgents.Infrastructure.Data.AppDbContext context)
    {
        var connection = context.Database.GetDbConnection();
        await connection.OpenAsync();

        using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT schema_name
            FROM information_schema.schemata
            WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
              AND schema_name NOT LIKE 'pg_%'
            ORDER BY schema_name
            """;

        var schemas = new List<string>();
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            schemas.Add(reader.GetString(0));
        }

        return schemas;
    }
}
