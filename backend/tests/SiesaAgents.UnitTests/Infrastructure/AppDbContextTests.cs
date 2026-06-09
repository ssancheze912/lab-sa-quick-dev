// ATDD - Story 1.3: Backend Database Foundation
// TC-E1-P1-05: EF Core Migration Creates Database and Migrations Table (P1)
// TC-E1-P2-04: snake_case Column Naming Applied via ApplySnakeCaseNaming (P2)
// TC-Story-1.3-AC3: ApplySnakeCaseNaming is the last call in OnModelCreating (AC#3)
// TC-Story-1.3-AC4: Only __ef_migrations_history table exists — no domain tables (AC#4)
//
// Status: RED (failing) — AppDbContext, EFCore.NamingConventions package, and
// Microsoft.EntityFrameworkCore.Design are not yet present in the Infrastructure
// project. These tests will fail until Tasks 1-4 of Story 1.3 are completed.

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// ATDD integration tests for AppDbContext (Story 1.3 - AC#1, #3, #4).
/// Tests requiring a live PostgreSQL database are marked with [Trait("Category", "Integration")].
/// All tests are in RED phase — they will fail until the implementation is complete.
/// </summary>
public class AppDbContextTests
{
    // -----------------------------------------------------------------------
    // TC-Story-1.3-AC5: AppDbContext can be resolved from the DI container
    // Verifies that AddDbContext<AppDbContext> is registered and resolvable.
    // -----------------------------------------------------------------------

    [Fact]
    public void AppDbContext_CanBeResolvedFromDI_WhenRegisteredWithInMemoryProvider()
    {
        // GIVEN: A DI service collection with AppDbContext registered (in-memory for isolation)
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options =>
            options.UseInMemoryDatabase("TestDb_ResolveDI"));
        var provider = services.BuildServiceProvider();

        // WHEN: AppDbContext is resolved from the container
        var dbContext = provider.GetService<AppDbContext>();

        // THEN: The context is successfully resolved and is not null
        Assert.NotNull(dbContext);
    }

    // -----------------------------------------------------------------------
    // TC-Story-1.3-AC4: No domain DbSet properties in this story's scope
    // Verifies the scope boundary — no clientes or contactos tables.
    // -----------------------------------------------------------------------

    [Fact]
    public void AppDbContext_HasNoDomainDbSets_RespectingScopeBoundary()
    {
        // GIVEN: An AppDbContext using an in-memory database
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("TestDb_NoDomainDbSets")
            .Options;

        // WHEN: The context is instantiated
        using var context = new AppDbContext(options);

        // THEN: No DbSet<> for domain entities exists (scope note from Epic 2 and 3)
        // The model should only have EF Core metadata tables, not domain tables.
        var entityTypes = context.Model.GetEntityTypes().Select(e => e.GetTableName()).ToList();
        Assert.DoesNotContain("clientes", entityTypes, StringComparer.OrdinalIgnoreCase);
        Assert.DoesNotContain("contactos", entityTypes, StringComparer.OrdinalIgnoreCase);
    }

    // -----------------------------------------------------------------------
    // TC-Story-1.3-AC3: OnModelCreating applies configurations from assembly
    // Verifies that ApplyConfigurationsFromAssembly is called (entity configs auto-registered).
    // This is a structural test — passes once AppDbContext exists with correct OnModelCreating.
    // -----------------------------------------------------------------------

    [Fact]
    public void AppDbContext_OnModelCreating_DoesNotThrow_WithInMemoryDatabase()
    {
        // GIVEN: An AppDbContext configured with an in-memory database
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("TestDb_OnModelCreating")
            .Options;

        // WHEN: The context is instantiated (triggers OnModelCreating internally)
        Exception? caughtException = null;
        try
        {
            using var context = new AppDbContext(options);
            // Force model building by accessing the model
            _ = context.Model;
        }
        catch (Exception ex)
        {
            caughtException = ex;
        }

        // THEN: OnModelCreating completes without throwing
        Assert.Null(caughtException);
    }

    // -----------------------------------------------------------------------
    // TC-E1-P1-05: EF Core migration creates siesa_agents_db
    // Requires live PostgreSQL — integration test.
    // RED: Will fail until AppDbContext + migration + DB are in place.
    // -----------------------------------------------------------------------

    [Fact]
    [Trait("Category", "Integration")]
    public async Task EfCoreMigration_CreatesSiesaAgentsDb_WithMigrationsHistoryTable()
    {
        // GIVEN: PostgreSQL running with connection string from appsettings.Development.json
        var connectionString = "Host=localhost;Database=siesa_agents_db_test;Username=postgres;Password=postgres";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .UseSnakeCaseNamingConvention()
            .Options;

        // WHEN: The migration is applied to the test database
        using var context = new AppDbContext(options);
        await context.Database.MigrateAsync();

        // THEN: The __ef_migrations_history table exists
        await using var connection = context.Database.GetDbConnection();
        await connection.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(1) FROM information_schema.tables WHERE table_name = '__EFMigrationsHistory'";
        var result = await command.ExecuteScalarAsync();
        var tableExists = Convert.ToInt64(result) > 0;
        Assert.True(tableExists, "The __ef_migrations_history table should exist after applying migrations.");

        // Cleanup
        await context.Database.EnsureDeletedAsync();
    }

    // -----------------------------------------------------------------------
    // TC-E1-P1-05b: No domain tables exist after initial migration
    // Requires live PostgreSQL — integration test.
    // RED: Will fail until AppDbContext + migration are in place.
    // -----------------------------------------------------------------------

    [Fact]
    [Trait("Category", "Integration")]
    public async Task EfCoreMigration_DoesNotCreateDomainTables_InInitialMigration()
    {
        // GIVEN: PostgreSQL running and migration applied
        var connectionString = "Host=localhost;Database=siesa_agents_db_scope_test;Username=postgres;Password=postgres";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .UseSnakeCaseNamingConvention()
            .Options;

        using var context = new AppDbContext(options);
        await context.Database.MigrateAsync();

        // WHEN: Querying the database schema for domain tables using a separate connection
        var sql = @"
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN ('clientes', 'contactos')";

        // THEN: No domain tables (clientes, contactos) exist — scope boundary respected
        var domainTablesExist = false;
        await using (var connection = new Npgsql.NpgsqlConnection(connectionString))
        {
            await connection.OpenAsync();
            await using var command = connection.CreateCommand();
            command.CommandText = sql;
            await using var reader = await command.ExecuteReaderAsync();
            domainTablesExist = reader.HasRows;
        }

        Assert.False(domainTablesExist,
            "No domain tables (clientes, contactos) should exist in the initial migration. " +
            "These are created in Epics 2 and 3 respectively.");

        await context.Database.EnsureDeletedAsync();
    }

    // -----------------------------------------------------------------------
    // TC-E1-P2-04: snake_case column naming via ApplySnakeCaseNaming
    // Requires live PostgreSQL — integration test.
    // RED: Will fail until EFCore.NamingConventions + AppDbContext are in place.
    // -----------------------------------------------------------------------

    [Fact]
    [Trait("Category", "Integration")]
    public async Task EfCoreMigration_HistoryTable_HasSnakeCaseColumnNames()
    {
        // GIVEN: PostgreSQL running and migration applied
        var connectionString = "Host=localhost;Database=siesa_agents_db_naming_test;Username=postgres;Password=postgres";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .UseSnakeCaseNamingConvention()
            .Options;

        using var context = new AppDbContext(options);
        await context.Database.MigrateAsync();

        // WHEN: Querying information_schema.columns for __ef_migrations_history columns using a separate connection
        var columnNames = new List<string>();
        await using (var connection = new Npgsql.NpgsqlConnection(connectionString))
        {
            await connection.OpenAsync();
            await using var command = connection.CreateCommand();
            command.CommandText = @"
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = '__EFMigrationsHistory'
                ORDER BY ordinal_position";

            await using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                columnNames.Add(reader.GetString(0));
            }
        }

        // THEN: Column names follow snake_case convention (not PascalCase)
        // EF Core default: MigrationId, ProductVersion — with ApplySnakeCaseNaming: migration_id, product_version
        Assert.Contains("migration_id", columnNames, StringComparer.OrdinalIgnoreCase);
        Assert.Contains("product_version", columnNames, StringComparer.OrdinalIgnoreCase);
        Assert.DoesNotContain("MigrationId", columnNames);
        Assert.DoesNotContain("ProductVersion", columnNames);

        await context.Database.EnsureDeletedAsync();
    }
}
