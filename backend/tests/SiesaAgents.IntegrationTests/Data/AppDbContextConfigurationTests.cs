using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Data;

/// <summary>
/// Expands AC #1 (Story 1.3) coverage beyond the ATDD tests in AppDbContextMigrationTests,
/// which verify the database/table/migration-folder exist. These tests cover two gaps not
/// exercised by ATDD: (1) the applied migration snapshot has zero pending model changes
/// (protects against a mismatch between AppDbContextModelSnapshot.cs and the live database
/// schema going undetected), and (2) `dotnet ef database update` is idempotent — running the
/// underlying migrate operation again against an already-migrated database does not error or
/// duplicate the __ef_migrations_history row.
///
/// Precondition: same as AppDbContextMigrationTests — PostgreSQL running locally with
/// `siesa_agents_db` already migrated via `dotnet ef database update`.
/// </summary>
public class AppDbContextConfigurationTests
{
    private const string ConnectionString =
        "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres";

    private static AppDbContext CreateContext()
    {
        // Mirrors Program.cs registration exactly (including the snake_case history
        // repository override) so these tests exercise the same configuration production uses.
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString, npgsql => { })
            .ReplaceService<IHistoryRepository, SnakeCaseNpgsqlHistoryRepository>()
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task Database_HasNoPendingModelChanges()
    {
        // GIVEN a real AppDbContext connected to the migrated siesa_agents_db
        await using var context = CreateContext();

        // WHEN checking for model/schema drift via EF's design-time model differ
        var hasPendingChanges = context.Database.HasPendingModelChanges();

        // THEN the current model (zero DbSets + snake_case naming) matches the last migration
        // snapshot exactly — no drift between AppDbContext and AppDbContextModelSnapshot.cs
        Assert.False(hasPendingChanges, "Expected no pending model changes against the last migration snapshot");
    }

    [Fact]
    public async Task Database_MigrateAsync_IsIdempotentOnAlreadyMigratedDatabase()
    {
        // GIVEN a database that has already been migrated (InitialCreate applied)
        await using var context = CreateContext();

        // WHEN calling MigrateAsync again (equivalent to re-running `dotnet ef database update`)
        var exception = await Record.ExceptionAsync(() => context.Database.MigrateAsync());

        // THEN no exception is thrown — EF Core skips already-applied migrations
        Assert.Null(exception);
    }

    [Fact]
    public async Task Database_MigrateAsync_DoesNotDuplicateMigrationsHistoryRow()
    {
        // GIVEN a database that has already been migrated, and MigrateAsync was just re-run
        await using var context = CreateContext();
        await context.Database.MigrateAsync();

        // WHEN counting rows in __ef_migrations_history for the InitialCreate migration
        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            "SELECT COUNT(*) FROM __ef_migrations_history WHERE migration_id LIKE '%_InitialCreate';",
            connection);
        var count = (long)(await command.ExecuteScalarAsync() ?? 0L);

        // THEN exactly one row exists (re-running migrate does not insert a duplicate row)
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task Database_GetAppliedMigrationsAsync_ContainsInitialCreateExactlyOnce()
    {
        // GIVEN a real AppDbContext connected to the migrated siesa_agents_db
        await using var context = CreateContext();

        // WHEN listing applied migrations
        var applied = (await context.Database.GetAppliedMigrationsAsync()).ToList();

        // THEN InitialCreate appears exactly once (no duplicate migration application)
        Assert.Single(applied, m => m.EndsWith("_InitialCreate", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Database_GetPendingMigrationsAsync_IsEmpty()
    {
        // GIVEN a real AppDbContext connected to the migrated siesa_agents_db
        await using var context = CreateContext();

        // WHEN listing pending (not-yet-applied) migrations
        var pending = await context.Database.GetPendingMigrationsAsync();

        // THEN there are no pending migrations left to apply
        Assert.Empty(pending);
    }
}
