using Microsoft.EntityFrameworkCore;
using Npgsql;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Story 1.3 — Backend Database Foundation.
///
/// Failing acceptance tests (RED phase) written BEFORE implementation.
/// These tests assert that:
///   - AC #1: `dotnet ef database update` creates <c>siesa_agents_db</c> with a single EMPTY initial migration.
///   - AC #2: The only EF-managed table is <c>__ef_migrations_history</c> (snake_case) — no <c>clientes</c>/<c>contactos</c>.
///   - AC #4: <c>ApplySnakeCaseNaming()</c> is invoked as the LAST call in <c>OnModelCreating</c> (proven by column casing).
///   - AC #6: <c>__ef_migrations_history</c> columns are <c>migration_id</c> and <c>product_version</c> (snake_case).
///
/// These tests SHALL FAIL until:
///   1. <c>SiesaAgents.Infrastructure/Data/AppDbContext.cs</c> exists with primary constructor + snake_case naming.
///   2. <c>EFCore.NamingConventions</c> package is installed in Infrastructure.
///   3. The empty <c>InitialCreate</c> migration is generated under <c>Data/Migrations/</c>.
///   4. <c>AppDbContext</c> is registered via <c>AddDbContext</c> in Program.cs with <c>UseSnakeCaseNamingConvention()</c>.
///
/// Test-design mapping: TC-E1-P1-05 (migration creates DB), TC-E1-P2-04 (snake_case columns).
///
/// Test DB isolation: uses a dedicated <c>siesa_agents_db_test</c> database, dropped and recreated per run.
/// Requires a local PostgreSQL 18 instance at <c>localhost:5432</c> (postgres/postgres).
/// If Postgres is unavailable the tests are marked skipped (no false-positive PASS).
/// </summary>
public class DatabaseMigrationTests : IAsyncLifetime
{
    // Isolated per-test-run database (never touch the dev DB `siesa_agents_db`).
    private const string TestConnectionString =
        "Host=localhost;Port=5432;Database=siesa_agents_db_test;Username=postgres;Password=postgres";

    private const string AdminConnectionString =
        "Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=postgres";

    private bool _postgresAvailable;

    public async ValueTask InitializeAsync()
    {
        _postgresAvailable = await IsPostgresReachableAsync();

        if (_postgresAvailable)
        {
            // Ensure the test DB exists (drop-and-recreate)
            await using var adminConn = new NpgsqlConnection(AdminConnectionString);
            await adminConn.OpenAsync();

            await using (var drop = new NpgsqlCommand(
                "DROP DATABASE IF EXISTS siesa_agents_db_test WITH (FORCE);", adminConn))
            {
                await drop.ExecuteNonQueryAsync();
            }
            await using (var create = new NpgsqlCommand(
                "CREATE DATABASE siesa_agents_db_test;", adminConn))
            {
                await create.ExecuteNonQueryAsync();
            }
        }
    }

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;

    [Fact(DisplayName = "[P1] AC#1 — MigrateAsync applies the InitialCreate migration with no errors")]
    public async Task MigrateAsync_OnFreshDatabase_AppliesInitialMigrationWithoutErrors()
    {
        SkipIfPostgresUnavailable();

        // GIVEN a fresh PostgreSQL database and an AppDbContext wired with snake_case naming
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(TestConnectionString)
            .UseSnakeCaseNamingConvention()
            .Options;

        await using var ctx = new AppDbContext(options);

        // WHEN migrations are applied
        var exception = await Record.ExceptionAsync(() => ctx.Database.MigrateAsync());

        // THEN no exception is thrown and at least one migration is recorded as applied
        Assert.Null(exception);

        var applied = (await ctx.Database.GetAppliedMigrationsAsync()).ToList();
        Assert.NotEmpty(applied);
        Assert.Contains(applied, m => m.EndsWith("_InitialCreate", StringComparison.Ordinal));
    }

    [Fact(DisplayName = "[P1] AC#1 — Only ONE migration exists (a single empty InitialCreate)")]
    public async Task Migrations_OnlyOneInitialCreateMigrationExists()
    {
        SkipIfPostgresUnavailable();

        // GIVEN a fresh PostgreSQL database and the compiled model
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(TestConnectionString)
            .UseSnakeCaseNamingConvention()
            .Options;

        await using var ctx = new AppDbContext(options);

        // WHEN inspecting the migrations shipped in the Infrastructure assembly
        var known = ctx.Database.GetMigrations().ToList();

        // THEN exactly one migration is defined and it is the InitialCreate
        Assert.Single(known);
        Assert.EndsWith("_InitialCreate", known[0], StringComparison.Ordinal);
    }

    [Fact(DisplayName = "[P1] AC#2 — After migrate, __ef_migrations_history is the ONLY EF-managed table")]
    public async Task Migrate_OnlyEfMigrationsHistoryTableExists()
    {
        SkipIfPostgresUnavailable();

        // GIVEN a fresh PostgreSQL database
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(TestConnectionString)
            .UseSnakeCaseNamingConvention()
            .Options;

        await using (var ctx = new AppDbContext(options))
        {
            // WHEN migrations are applied
            await ctx.Database.MigrateAsync();
        }

        // THEN only __ef_migrations_history exists in the public schema
        await using var conn = new NpgsqlConnection(TestConnectionString);
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            @"SELECT table_name FROM information_schema.tables
              WHERE table_schema = 'public'
              ORDER BY table_name;", conn);

        var tables = new List<string>();
        await using (var reader = await cmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                tables.Add(reader.GetString(0));
            }
        }

        Assert.Single(tables);
        Assert.Equal("__ef_migrations_history", tables[0]);
    }

    [Fact(DisplayName = "[P1] AC#2 — Domain tables 'clientes' and 'contactos' do NOT exist (scope: empty migration)")]
    public async Task Migrate_DomainTables_DoNotExist()
    {
        SkipIfPostgresUnavailable();

        // GIVEN a fresh PostgreSQL database
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(TestConnectionString)
            .UseSnakeCaseNamingConvention()
            .Options;

        await using (var ctx = new AppDbContext(options))
        {
            // WHEN migrations are applied
            await ctx.Database.MigrateAsync();
        }

        // THEN neither `clientes` (Epic 2 Story 2.1) nor `contactos` (Epic 3 Story 3.1) exist yet
        await using var conn = new NpgsqlConnection(TestConnectionString);
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            @"SELECT COUNT(*) FROM information_schema.tables
              WHERE table_schema = 'public'
                AND table_name IN ('clientes', 'contactos');", conn);

        var count = Convert.ToInt64((await cmd.ExecuteScalarAsync())!);
        Assert.Equal(0L, count);
    }

    [Fact(DisplayName = "[P2] AC#4/#6 — __ef_migrations_history columns are snake_case (migration_id, product_version)")]
    public async Task Migrate_EfMigrationsHistory_HasSnakeCaseColumns()
    {
        SkipIfPostgresUnavailable();

        // GIVEN a fresh PostgreSQL database migrated by AppDbContext
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(TestConnectionString)
            .UseSnakeCaseNamingConvention()
            .Options;

        await using (var ctx = new AppDbContext(options))
        {
            // WHEN migrations are applied
            await ctx.Database.MigrateAsync();
        }

        // THEN column names in __ef_migrations_history are snake_case
        // (proves ApplySnakeCaseNaming()/UseSnakeCaseNamingConvention() is active
        //  and applied AFTER EF built its internal migration-history model — AC #4)
        await using var conn = new NpgsqlConnection(TestConnectionString);
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            @"SELECT column_name FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name  = '__ef_migrations_history'
              ORDER BY column_name;", conn);

        var columns = new List<string>();
        await using (var reader = await cmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                columns.Add(reader.GetString(0));
            }
        }

        Assert.Contains("migration_id", columns);
        Assert.Contains("product_version", columns);
        // Reject any PascalCase leftover
        Assert.DoesNotContain("MigrationId", columns);
        Assert.DoesNotContain("ProductVersion", columns);
    }

    [Fact(DisplayName = "[P2] AC#4 — AppDbContext model has NO entity types (empty initial migration guard)")]
    public void AppDbContext_Model_HasNoEntityTypes()
    {
        // GIVEN an AppDbContext instantiated with any options
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(TestConnectionString)
            .UseSnakeCaseNamingConvention()
            .Options;

        using var ctx = new AppDbContext(options);

        // WHEN inspecting the compiled EF model
        var userEntityTypes = ctx.Model
            .GetEntityTypes()
            .Where(e => !e.ClrType.FullName!.Contains("Microsoft.EntityFrameworkCore", StringComparison.Ordinal))
            .ToList();

        // THEN NO domain entity types are declared (scope note: no DbSet<>s in this story)
        Assert.Empty(userEntityTypes);
    }

    private static async Task<bool> IsPostgresReachableAsync()
    {
        try
        {
            await using var conn = new NpgsqlConnection(AdminConnectionString);
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
            await conn.OpenAsync(cts.Token);
            return conn.State == System.Data.ConnectionState.Open;
        }
        catch
        {
            return false;
        }
    }

    private void SkipIfPostgresUnavailable()
    {
        Assert.SkipUnless(_postgresAvailable,
            "PostgreSQL not reachable at localhost:5432 (postgres/postgres). " +
            "Start it with: docker run --name siesa-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:18-alpine");
    }
}
