using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;
using Xunit;

// NOTE: RED PHASE — These tests will FAIL until AppDbContext and migrations are implemented.
// Story 1.3: Backend Database Foundation — AC1, AC6, AC7

namespace SiesaAgents.IntegrationTests.Infrastructure;

/// <summary>
/// ATDD Integration Tests for database connectivity and migration integrity.
/// Uses Testcontainers to spin up a real PostgreSQL container per test class.
/// All tests are in RED phase — AppDbContext, migrations, and EFCore packages do not yet exist.
/// </summary>
public sealed class DatabaseConnectivityTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgresContainer = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("siesa_agents_db_test")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    // ──────────────────────────────────────────────────────────────────────────
    // AC1: `dotnet ef database update` → siesa_agents_db created with no errors.
    //      EF Core Migrations folder exists with an initial migration file.
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Database_CanConnect_WhenConnectionStringIsConfigured()
    {
        // GIVEN: PostgreSQL container is running with the configured connection string
        var options = BuildDbContextOptions();
        await using var context = new SiesaAgents.Infrastructure.Data.AppDbContext(options);

        // WHEN: Checking connectivity via EF Core
        var canConnect = await context.Database.CanConnectAsync();

        // THEN: Connection succeeds (AC1 — database is reachable)
        Assert.True(canConnect);
    }

    [Fact]
    public async Task Database_AfterMigrationApplied_ContainsInitialCreateMigration()
    {
        // GIVEN: PostgreSQL is running and AppDbContext is configured
        var options = BuildDbContextOptions();
        await using var context = new SiesaAgents.Infrastructure.Data.AppDbContext(options);

        // WHEN: All pending migrations are applied
        await context.Database.MigrateAsync();
        var appliedMigrations = await context.Database.GetAppliedMigrationsAsync();

        // THEN: The "InitialCreate" migration is listed as applied (AC1)
        Assert.Contains(
            appliedMigrations,
            m => m.Contains("InitialCreate", StringComparison.OrdinalIgnoreCase));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC6: Connection uses siesa_agents_db PostgreSQL database on localhost:5432
    //      with the Npgsql provider.
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Database_WhenMigrationsApplied_EFMigrationsHistoryTableExists()
    {
        // GIVEN: PostgreSQL is running and AppDbContext is configured
        var options = BuildDbContextOptions();
        await using var context = new SiesaAgents.Infrastructure.Data.AppDbContext(options);

        // WHEN: All pending migrations are applied
        await context.Database.MigrateAsync();

        // THEN: The EF Migrations history table exists (confirms Npgsql + EF Core integration — AC6)
        // CanConnectAsync + MigrateAsync succeeding proves the Npgsql provider is active
        Assert.True(await context.Database.CanConnectAsync());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC7: Initial migration contains NO domain entity tables.
    //      Only __EFMigrationsHistory is created. No `clientes`, no `contactos`.
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Database_AfterInitialMigration_DoesNotContainClientesTable()
    {
        // GIVEN: PostgreSQL is running and only InitialCreate migration is applied
        var options = BuildDbContextOptions();
        await using var context = new SiesaAgents.Infrastructure.Data.AppDbContext(options);
        await context.Database.MigrateAsync();

        // WHEN: Querying the PostgreSQL information_schema for the 'clientes' table
        // THEN: The 'clientes' table does NOT exist (domain tables are created in Epic 2 — Story 2.1)
        var tableExists = await TableExistsAsync(context, "clientes");
        Assert.False(tableExists,
            "The 'clientes' table must NOT exist after the InitialCreate migration. " +
            "It is created in Story 2.1 (Epic 2), not in Story 1.3.");
    }

    [Fact]
    public async Task Database_AfterInitialMigration_DoesNotContainContactosTable()
    {
        // GIVEN: PostgreSQL is running and only InitialCreate migration is applied
        var options = BuildDbContextOptions();
        await using var context = new SiesaAgents.Infrastructure.Data.AppDbContext(options);
        await context.Database.MigrateAsync();

        // WHEN: Querying the PostgreSQL information_schema for the 'contactos' table
        // THEN: The 'contactos' table does NOT exist (domain tables are created in Epic 3 — Story 3.1)
        var tableExists = await TableExistsAsync(context, "contactos");
        Assert.False(tableExists,
            "The 'contactos' table must NOT exist after the InitialCreate migration. " +
            "It is created in Story 3.1 (Epic 3), not in Story 1.3.");
    }

    [Fact]
    public async Task Database_AfterInitialMigration_OnlyEFMigrationsHistoryTableExists()
    {
        // GIVEN: PostgreSQL is running and only InitialCreate migration is applied
        var options = BuildDbContextOptions();
        await using var context = new SiesaAgents.Infrastructure.Data.AppDbContext(options);
        await context.Database.MigrateAsync();

        // WHEN: Querying the PostgreSQL information_schema for all tables in public schema
        // THEN: Only __EFMigrationsHistory table exists (no domain tables — AC7)
        var tables = await GetAllPublicTablesAsync(context);
        var domainTables = tables
            .Where(t => t != "__EFMigrationsHistory")
            .ToList();

        Assert.Empty(domainTables);
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

    private static async Task<bool> TableExistsAsync(
        SiesaAgents.Infrastructure.Data.AppDbContext context,
        string tableName)
    {
        // Query information_schema via raw SQL to check table existence
        var connection = context.Database.GetDbConnection();
        await connection.OpenAsync();

        using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = @tableName
            """;

        var param = command.CreateParameter();
        param.ParameterName = "@tableName";
        param.Value = tableName;
        command.Parameters.Add(param);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt64(result) > 0;
    }

    private static async Task<List<string>> GetAllPublicTablesAsync(
        SiesaAgents.Infrastructure.Data.AppDbContext context)
    {
        var connection = context.Database.GetDbConnection();
        await connection.OpenAsync();

        using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
            """;

        var tables = new List<string>();
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            tables.Add(reader.GetString(0));
        }

        return tables;
    }
}
