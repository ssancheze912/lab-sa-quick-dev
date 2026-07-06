using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// TC-E1-P1-05 / TC-E1-P2-04 — Story 1.3 AC #1 and AC #3.
///
/// AC #1: given PostgreSQL is running locally, after `dotnet ef database update` runs,
/// `siesa_agents_db` exists with no domain tables (only EF Core's own
/// __ef_migrations_history table).
///
/// AC #3: given AppDbContext.OnModelCreating runs, modelBuilder.ApplySnakeCaseNaming()
/// converts all EF-managed identifiers to snake_case, verified here via the
/// __ef_migrations_history columns (migration_id, product_version), since no domain
/// tables exist yet in this story.
///
/// RED phase: fails to compile today because SiesaAgents.Infrastructure.Data.AppDbContext
/// does not exist yet (Story 1.3 Task 2) and is not registered in DI (Task 4).
///
/// Per Story 1.3 Task 7, these tests require `dotnet ef database update` to have already
/// been run against a locally reachable PostgreSQL instance. Each test is decorated with
/// [RequiresPostgresFact] instead of [Fact]: when PostgreSQL is not reachable, xUnit reports
/// the test as "Skipped" (not a false "Passed") rather than failing the whole suite on infra
/// absence — see RequiresPostgresFactAttribute for why the previous "soft-skip via early
/// return" approach was a masking anti-pattern and was replaced.
/// </summary>
public class AppDbContextMigrationTests : IClassFixture<TestWebApplicationFactory>
{
    private const string EfMigrationsHistoryTable = "__ef_migrations_history";
    private readonly TestWebApplicationFactory _factory;

    public AppDbContextMigrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [RequiresPostgresFact]
    public async Task Database_CanConnect_AfterMigrationApplied()
    {
        // GIVEN AppDbContext is resolved from the test host's DI container
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // WHEN Database.CanConnectAsync() is called
        // THEN the connection to siesa_agents_db succeeds
        Assert.True(await dbContext.Database.CanConnectAsync());
    }

    [RequiresPostgresFact]
    public async Task EfMigrationsHistoryTable_HasSnakeCaseMigrationIdColumn()
    {
        // GIVEN the __ef_migrations_history table exists after `dotnet ef database update`
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // WHEN information_schema.columns is queried for that table
        var columnNames = await GetColumnNamesAsync(dbContext, EfMigrationsHistoryTable);

        // THEN the migration id column is named "migration_id" (snake_case)
        Assert.Contains("migration_id", columnNames);
    }

    [RequiresPostgresFact]
    public async Task EfMigrationsHistoryTable_HasSnakeCaseProductVersionColumn()
    {
        // GIVEN the __ef_migrations_history table exists after `dotnet ef database update`
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // WHEN information_schema.columns is queried for that table
        var columnNames = await GetColumnNamesAsync(dbContext, EfMigrationsHistoryTable);

        // THEN the product version column is named "product_version" (snake_case)
        Assert.Contains("product_version", columnNames);
    }

    [RequiresPostgresFact]
    public async Task EfMigrationsHistoryTable_HasNoPascalCaseColumns()
    {
        // GIVEN the __ef_migrations_history table exists after `dotnet ef database update`
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // WHEN information_schema.columns is queried for that table
        var columnNames = await GetColumnNamesAsync(dbContext, EfMigrationsHistoryTable);

        // THEN no PascalCase column name (e.g. "MigrationId") is present
        Assert.DoesNotContain("MigrationId", columnNames);
    }

    [RequiresPostgresFact]
    public async Task Database_ContainsOnlyMigrationsHistoryTable_NoDomainTables()
    {
        // GIVEN `dotnet ef database update` has applied only the empty InitialCreate migration
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // WHEN information_schema.tables is queried for the public schema
        var tableNames = await QueryStringColumnAsync(
            dbContext,
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
            "table_name");

        // THEN only __ef_migrations_history exists — no domain tables (clientes, contactos, etc.)
        Assert.Equal(new[] { EfMigrationsHistoryTable }, tableNames);
    }

    private static Task<List<string>> GetColumnNamesAsync(AppDbContext dbContext, string tableName) =>
        QueryStringColumnAsync(
            dbContext,
            $"SELECT column_name FROM information_schema.columns WHERE table_name = '{tableName}'",
            "column_name");

    private static async Task<List<string>> QueryStringColumnAsync(
        AppDbContext dbContext,
        string sql,
        string columnLabel)
    {
        var connection = dbContext.Database.GetDbConnection();
        var wasClosed = connection.State != ConnectionState.Open;
        if (wasClosed)
        {
            await connection.OpenAsync();
        }

        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = sql;

            var values = new List<string>();
            await using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                values.Add(reader.GetString(0));
            }

            return values;
        }
        finally
        {
            if (wasClosed)
            {
                await connection.CloseAsync();
            }
        }
    }
}
