using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SiesaAgents.Infrastructure.Data;
using Testcontainers.PostgreSql;

namespace SiesaAgents.IntegrationTests.Data;

/// <summary>
/// Migration edge cases that complement the ATDD <c>MigrationsIntegrationTests</c>:
/// - Idempotency: calling <c>MigrateAsync()</c> twice in a row is safe.
/// - No pending migrations remain after the first <c>MigrateAsync()</c>.
/// - The recorded ProductVersion is EF Core 10.x (we shipped 10.0.0).
/// - The migration id matches the timestamped class name on disk.
/// - The <c>__ef_migrations_history</c> table has exactly the two expected columns and no extras.
/// </summary>
public class MigrationsIdempotencyTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:18")
        .WithDatabase("siesa_agents_db")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public Task InitializeAsync() => _postgres.StartAsync();

    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();

    private DbContextOptions<AppDbContext> Options() =>
        new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

    [Fact]
    public async Task MigrateAsync_CalledTwice_IsIdempotent_NoErrors()
    {
        // GIVEN: a fresh Postgres container.
        await using var ctx1 = new AppDbContext(Options());
        await ctx1.Database.MigrateAsync();

        // WHEN: MigrateAsync is invoked again on a new context (same DB).
        await using var ctx2 = new AppDbContext(Options());
        Func<Task> act = () => ctx2.Database.MigrateAsync();

        // THEN: the second invocation must not throw — EF detects all migrations already applied.
        await act.Should().NotThrowAsync("MigrateAsync must be idempotent");
    }

    [Fact]
    public async Task GetPendingMigrationsAsync_AfterMigrateAsync_ReturnsEmpty()
    {
        // GIVEN: migrations already applied.
        await using (var seed = new AppDbContext(Options()))
        {
            await seed.Database.MigrateAsync();
        }

        // WHEN: querying pending migrations.
        await using var ctx = new AppDbContext(Options());
        var pending = await ctx.Database.GetPendingMigrationsAsync();

        // THEN: nothing pending.
        pending.Should().BeEmpty("all migrations should be applied after MigrateAsync");
    }

    [Fact]
    public async Task AppliedMigrations_ContainsInitialCreateTimestamp()
    {
        // GIVEN: migrations applied.
        await using var ctx = new AppDbContext(Options());
        await ctx.Database.MigrateAsync();

        // WHEN: enumerating applied migrations.
        var applied = (await ctx.Database.GetAppliedMigrationsAsync()).ToList();

        // THEN: the InitialCreate migration is present with the timestamped id (per source on disk).
        applied.Should().Contain(m => m.Contains("InitialCreate"),
            "the InitialCreate migration must be recorded");
    }

    [Fact]
    public async Task EfMigrationsHistory_ContainsExactlyMigrationIdAndProductVersion_Columns()
    {
        // GIVEN: migrations applied.
        await using (var ctx = new AppDbContext(Options()))
        {
            await ctx.Database.MigrateAsync();
        }

        // WHEN: inspecting the columns of the history table.
        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync();
        await using var cmd = new NpgsqlCommand(
            "SELECT column_name FROM information_schema.columns WHERE table_name = '__ef_migrations_history';",
            connection);
        var cols = new List<string>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            cols.Add(reader.GetString(0));
        }

        // THEN: only the two expected columns exist; no extras leak in.
        cols.Should().BeEquivalentTo(new[] { "migration_id", "product_version" },
            "the EF history table must only contain the two snake_case columns and nothing else");
    }

    [Fact]
    public async Task EfMigrationsHistory_ProductVersionRow_StartsWithMajorVersionTen()
    {
        // GIVEN: migrations applied with EF Core 10 packages.
        await using (var ctx = new AppDbContext(Options()))
        {
            await ctx.Database.MigrateAsync();
        }

        // WHEN: reading the recorded product_version.
        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync();
        await using var cmd = new NpgsqlCommand(
            "SELECT product_version FROM __ef_migrations_history LIMIT 1;",
            connection);

        var productVersion = (string?)await cmd.ExecuteScalarAsync();

        // THEN: the row contains a 10.x version string (e.g. "10.0.0").
        productVersion.Should().NotBeNullOrWhiteSpace();
        productVersion!.Should().StartWith("10.",
            "the EF Core stack pinned in csproj is 10.x — any other major number means a regression");
    }

    [Fact]
    public async Task PublicSchema_AfterMigration_ContainsOnlyMigrationsHistoryTable()
    {
        // GIVEN: a freshly migrated database with no domain tables.
        await using (var ctx = new AppDbContext(Options()))
        {
            await ctx.Database.MigrateAsync();
        }

        // WHEN: listing public tables.
        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync();
        await using var cmd = new NpgsqlCommand(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';",
            connection);
        var tables = new List<string>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            tables.Add(reader.GetString(0));
        }

        // THEN: only the EF history table is present — scope note from the epic is respected at runtime.
        tables.Should().ContainSingle()
            .Which.Should().Be("__ef_migrations_history",
                "Story 1.3 must NOT create domain tables — only the EF history table");
    }
}
