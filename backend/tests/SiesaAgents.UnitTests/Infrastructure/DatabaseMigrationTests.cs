using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Story 1.3 — Backend Database Foundation
/// AC #1 — siesa_agents_db created with no errors, Migrations folder exists.
/// AC #2 — __ef_migrations_history columns are snake_case (migration_id, product_version).
/// AC #5 — Connection string read from appsettings.Development.json.
/// Maps to: TC-E1-P1-05, TC-E1-P2-04
///
/// RED Phase: These tests FAIL until:
///   1. AppDbContext is created in SiesaAgents.Infrastructure/Data/AppDbContext.cs
///   2. AppDbContext is registered in DI in Program.cs (UseNpgsql)
///   3. The initial EF Core migration has been run (dotnet ef migrations add InitialCreate)
///   4. Microsoft.AspNetCore.Mvc.Testing package is added to the test project
///   5. SiesaAgents.API project reference is added to the test project
/// </summary>
public class DatabaseMigrationTests : IAsyncLifetime
{
    private readonly string _testConnectionString =
        "Host=localhost;Database=siesa_agents_db_test;Username=postgres;Password=postgres";

    private WebApplicationFactory<Program>? _factory;
    private IServiceScope? _scope;
    private AppDbContext? _dbContext;

    public async Task InitializeAsync()
    {
        // Arrange: Create WebApplicationFactory with test DB connection string
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove the default AppDbContext registration
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor != null)
                        services.Remove(descriptor);

                    // Register AppDbContext pointing to test database
                    services.AddDbContext<AppDbContext>(options =>
                        options.UseNpgsql(_testConnectionString));
                });
            });

        _scope = _factory.Services.CreateScope();
        _dbContext = _scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Apply migrations to test database (creates siesa_agents_db_test)
        await _dbContext.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        // Cleanup: Drop test database to keep tests idempotent
        if (_dbContext != null)
        {
            await _dbContext.Database.EnsureDeletedAsync();
            await _dbContext.DisposeAsync();
        }

        _scope?.Dispose();

        if (_factory != null)
            await _factory.DisposeAsync();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC #1 — Database is created after running migrations
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WhenMigrationsApplied_DatabaseShouldExist()
    {
        // GIVEN: AppDbContext is registered with a valid connection string
        // WHEN: MigrateAsync() has been executed in InitializeAsync

        var canConnect = await _dbContext!.Database.CanConnectAsync();

        // THEN: The database exists and can be connected to
        Assert.True(canConnect,
            "siesa_agents_db_test should exist and accept connections after migrations are applied.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC #1 — __ef_migrations_history table exists after migration
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WhenMigrationsApplied_EFMigrationsHistoryTableShouldExist()
    {
        // GIVEN: EF Core migrations have been applied
        // WHEN: Querying information_schema for the migrations history table

        await using var connection = new NpgsqlConnection(_testConnectionString);
        await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = '__ef_migrations_history'
            """;

        var count = (long)(await command.ExecuteScalarAsync() ?? 0L);

        // THEN: The __ef_migrations_history table exists
        Assert.Equal(1L, count);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC #2 — __ef_migrations_history has snake_case column 'migration_id'
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WhenMigrationsApplied_MigrationIdColumnShouldBeSnakeCase()
    {
        // GIVEN: ApplySnakeCaseNaming() is the last call in OnModelCreating
        // WHEN: Inspecting the __ef_migrations_history column names

        await using var connection = new NpgsqlConnection(_testConnectionString);
        await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = '__ef_migrations_history'
            ORDER BY ordinal_position
            """;

        var columns = new List<string>();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            columns.Add(reader.GetString(0));
        }

        // THEN: The column 'migration_id' exists (snake_case — NOT 'MigrationId')
        Assert.Contains("migration_id", columns,
            $"Expected snake_case 'migration_id' column. Found columns: {string.Join(", ", columns)}");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC #2 — __ef_migrations_history has snake_case column 'product_version'
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WhenMigrationsApplied_ProductVersionColumnShouldBeSnakeCase()
    {
        // GIVEN: ApplySnakeCaseNaming() converts PascalCase column names to snake_case
        // WHEN: Inspecting the __ef_migrations_history column names

        await using var connection = new NpgsqlConnection(_testConnectionString);
        await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = '__ef_migrations_history'
            ORDER BY ordinal_position
            """;

        var columns = new List<string>();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            columns.Add(reader.GetString(0));
        }

        // THEN: The column 'product_version' exists (snake_case — NOT 'ProductVersion')
        Assert.Contains("product_version", columns,
            $"Expected snake_case 'product_version' column. Found columns: {string.Join(", ", columns)}");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC #2 — No PascalCase column names exist in __ef_migrations_history
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WhenMigrationsApplied_NoColumnNamesShouldBePascalCase()
    {
        // GIVEN: ApplySnakeCaseNaming() must convert ALL column names
        // WHEN: Querying __ef_migrations_history columns

        await using var connection = new NpgsqlConnection(_testConnectionString);
        await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = '__ef_migrations_history'
            """;

        var pascalCaseColumns = new List<string>();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var col = reader.GetString(0);
            // PascalCase detection: any uppercase letter present
            if (col.Any(char.IsUpper))
                pascalCaseColumns.Add(col);
        }

        // THEN: No PascalCase column names exist
        Assert.Empty(pascalCaseColumns);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC #1 — No domain tables (clientes, contactos) exist yet
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WhenMigrationsApplied_NoDomainTablesShouldExist()
    {
        // GIVEN: Story 1.3 creates an empty initial migration — no domain tables
        // WHEN: Querying information_schema for domain tables

        await using var connection = new NpgsqlConnection(_testConnectionString);
        await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN ('clientes', 'contactos')
            """;

        var count = (long)(await command.ExecuteScalarAsync() ?? 0L);

        // THEN: Neither 'clientes' nor 'contactos' tables exist (scope note: Epics 2 and 3)
        Assert.Equal(0L, count);
    }
}
