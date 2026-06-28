using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// ATDD tests for Story 1.3: Backend Database Foundation
/// Tests are in RED phase — they fail until AppDbContext and EF Core migrations are implemented.
///
/// Covered acceptance criteria:
/// AC1 — siesa_agents_db created, EF migrations folder exists (TC-E1-P1-05)
/// AC3 — ApplySnakeCaseNaming() applied, columns use snake_case (TC-E1-P2-04)
/// AC4 — ConnectionStrings:DefaultConnection from appsettings.Development.json is used
/// AC5 — No domain tables (clientes, contactos) after initial migration (TC-E1-P1-05)
/// </summary>
public class AppDbContextTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AppDbContextTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC1 — siesa_agents_db created with EF Core migration (TC-E1-P1-05)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E1-P1-05 (P1)
    /// GIVEN PostgreSQL is running locally
    /// WHEN EnsureMigratedAsync is called via AppDbContext
    /// THEN siesa_agents_db database exists and __ef_migrations_history table is present
    /// </summary>
    [Fact]
    public async Task AppDbContext_WhenMigrationApplied_DatabaseAndMigrationsTableExist()
    {
        // GIVEN: AppDbContext is registered in DI via WebApplicationFactory
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // WHEN: Migration is applied
        await dbContext.Database.MigrateAsync();

        // THEN: The database was created (connection opens without error)
        var canConnect = await dbContext.Database.CanConnectAsync();
        Assert.True(canConnect, "Should be able to connect to siesa_agents_db after migration");

        // AND: __ef_migrations_history table exists (verifies EF migration tracking is active)
        var migrationHistoryExists = await MigrationsHistoryTableExistsAsync(dbContext);
        Assert.True(migrationHistoryExists,
            "__ef_migrations_history table must exist after applying initial migration");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3 — ApplySnakeCaseNaming applied — columns are snake_case (TC-E1-P2-04)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E1-P2-04 (P2)
    /// GIVEN the backend receives any request (AppDbContext configured with ApplySnakeCaseNaming)
    /// WHEN the migration history table schema is inspected
    /// THEN column names are migration_id and product_version (snake_case, not PascalCase)
    /// </summary>
    [Fact]
    public async Task AppDbContext_WhenMigrationApplied_MigrationsHistoryColumnsAreSnakeCase()
    {
        // GIVEN: AppDbContext is registered and migration applied
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();

        // WHEN: Querying column names of __ef_migrations_history from information_schema
        var connection = dbContext.Database.GetDbConnection();
        await connection.OpenAsync();

        var columnNames = new List<string>();
        using var command = connection.CreateCommand();
        command.CommandText = @"
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = '__EFMigrationsHistory'
            ORDER BY ordinal_position;
        ";

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            columnNames.Add(reader.GetString(0));
        }

        await connection.CloseAsync();

        // THEN: Columns must be snake_case (migration_id, product_version)
        Assert.True(columnNames.Contains("migration_id"),
            "Column must be 'migration_id' (snake_case), not 'MigrationId' (PascalCase). " +
            "UseSnakeCaseNamingConvention() must be applied in DI registration.");

        Assert.True(columnNames.Contains("product_version"),
            "Column must be 'product_version' (snake_case), not 'ProductVersion' (PascalCase). " +
            "UseSnakeCaseNamingConvention() must be applied in DI registration.");

        // AND: PascalCase column names must NOT exist
        Assert.False(columnNames.Contains("MigrationId"),
            "PascalCase 'MigrationId' column found — UseSnakeCaseNamingConvention() is not applied.");
        Assert.False(columnNames.Contains("ProductVersion"),
            "PascalCase 'ProductVersion' column found — UseSnakeCaseNamingConvention() is not applied.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC4 — ConnectionStrings:DefaultConnection is configured and used
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// AC4 (P1)
    /// GIVEN AppDbContext is configured
    /// WHEN the application starts
    /// THEN AppDbContext is resolvable from DI (connection string is wired via AddDbContext)
    /// </summary>
    [Fact]
    public void AppDbContext_WhenApplicationStarts_IsResolvableFromDI()
    {
        // GIVEN: WebApplicationFactory spins up the full application stack
        using var scope = _factory.Services.CreateScope();

        // WHEN: AppDbContext is requested from the service provider
        var exception = Record.Exception(() =>
            scope.ServiceProvider.GetRequiredService<AppDbContext>()
        );

        // THEN: No exception means DI is configured (AddDbContext + connection string wired)
        Assert.Null(exception);
    }

    /// <summary>
    /// AC4 (P1) — Connection string points to siesa_agents_db
    /// GIVEN the connection string is configured in appsettings.Development.json
    /// WHEN AppDbContext connection string is inspected
    /// THEN it contains Host=localhost and Database=siesa_agents_db
    /// </summary>
    [Fact]
    public void AppDbContext_WhenConfigured_ConnectionStringPointsToSiesaAgentsDb()
    {
        // GIVEN: AppDbContext resolved from DI
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // WHEN: The connection string is read from the underlying database connection
        var connectionString = dbContext.Database.GetConnectionString();

        // THEN: Connection string contains the expected database and host
        Assert.NotNull(connectionString);
        Assert.True(connectionString!.Contains("siesa_agents_db"),
            "ConnectionString must point to siesa_agents_db per appsettings.Development.json");
        Assert.True(connectionString.Contains("localhost"),
            "ConnectionString must use localhost as host");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC5 — No domain tables after initial empty migration
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// AC5 (P1) — Updated in Story 2.1: clientes table now exists (Epic 2 migration applied).
    /// GIVEN all migrations are applied (InitialCreate + AddClienteEntity)
    /// WHEN the database schema is inspected
    /// THEN clientes table exists (added by Story 2.1) and contactos table does NOT exist (Epic 3 pending)
    /// </summary>
    [Fact]
    public async Task AppDbContext_WhenMigrationsApplied_ClientesTableExistsContactosDoesNot()
    {
        // GIVEN: AppDbContext is configured and all migrations applied
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();

        // WHEN: All user tables in the public schema are queried
        var connection = dbContext.Database.GetDbConnection();
        await connection.OpenAsync();

        var tableNames = new List<string>();
        using var command = connection.CreateCommand();
        command.CommandText = @"
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE';
        ";

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            tableNames.Add(reader.GetString(0));
        }

        await connection.CloseAsync();

        // THEN: clientes table exists (Story 2.1 AddClienteEntity migration)
        Assert.True(tableNames.Contains("clientes"),
            "'clientes' table must exist after Story 2.1 AddClienteEntity migration.");
        // AND: contactos table does NOT exist yet (Epic 3 pending)
        Assert.False(tableNames.Contains("contactos"),
            "'contactos' table must NOT exist — domain entities are deferred to Epic 3.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper
    // ─────────────────────────────────────────────────────────────────────────

    private static async Task<bool> MigrationsHistoryTableExistsAsync(DbContext dbContext)
    {
        var connection = dbContext.Database.GetDbConnection();
        await connection.OpenAsync();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_name = '__EFMigrationsHistory';
        ";

        var result = await command.ExecuteScalarAsync();
        await connection.CloseAsync();

        return Convert.ToInt32(result) > 0;
    }
}
