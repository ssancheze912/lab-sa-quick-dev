using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using Testcontainers.PostgreSql;
using Xunit;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// RED-phase DB-touching integration tests (QA-owned) for Story 1.3.
///
/// Covers:
///   - AC #1 / AC #2 — running migrations creates <c>siesa_agents_db</c> and the
///     <c>__ef_migrations_history</c> bookkeeping table (TC-E1-P1-05).
///   - AC #4 — every column name on <c>__ef_migrations_history</c> is lower
///     snake_case after <c>ApplySnakeCaseNaming()</c> runs (TC-E1-P2-04).
///
/// These tests are tagged <c>[Trait("Category","Db")]</c> so the default local
/// loop (<c>dotnet test --filter "Category!=Db"</c>) skips them. CI / QA opt-in
/// by removing the filter (TestContainers-Postgres provisions the database).
///
/// RED until:
///   - <c>AppDbContext</c> exists in <c>SiesaAgents.Infrastructure.Data</c>.
///   - An <c>InitialCreate</c> migration is generated under
///     <c>SiesaAgents.Infrastructure/Data/Migrations/</c>.
///   - <c>ApplySnakeCaseNaming()</c> is the LAST call in <c>OnModelCreating</c>.
/// </summary>
[Trait("Category", "Db")]
public class MigrationCreatesDbTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:18-alpine")
        .WithDatabase("siesa_agents_db")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public Task InitializeAsync() => _postgres.StartAsync();

    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();

    private DbContextOptions<AppDbContext> BuildOptions() =>
        new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

    [Fact]
    public async Task Migrate_CreatesDatabase_And_EfMigrationsHistoryTable()
    {
        // GIVEN: a fresh PostgreSQL 18 instance with no schema applied
        await using var ctx = new AppDbContext(BuildOptions());

        // WHEN: EF Core migrations are applied (mirrors `dotnet ef database update`)
        await ctx.Database.MigrateAsync();

        // THEN: the migrations history table MUST exist in the public schema (AC #1, AC #2)
        var tables = await QuerySingleColumnAsync(
            ctx,
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");

        Assert.Contains("__ef_migrations_history", tables);
    }

    [Fact]
    public async Task Migrate_DoesNotCreateDomainTables_PerScopeNote()
    {
        // GIVEN: a fresh PostgreSQL 18 instance
        await using var ctx = new AppDbContext(BuildOptions());

        // WHEN: EF Core migrations are applied
        await ctx.Database.MigrateAsync();

        // THEN: zero domain tables exist — clientes / contactos are explicitly out of
        //       Story 1.3 scope (Epic Scope Note; AC #1 / AC #2 last clause).
        var tables = await QuerySingleColumnAsync(
            ctx,
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");

        Assert.DoesNotContain("clientes", tables);
        Assert.DoesNotContain("contactos", tables);
    }

    [Fact]
    public async Task EfMigrationsHistory_AllColumnNamesAreLowerSnakeCase()
    {
        // GIVEN: a fresh PostgreSQL 18 instance with migrations applied
        await using var ctx = new AppDbContext(BuildOptions());
        await ctx.Database.MigrateAsync();

        // WHEN: we inspect the columns of __ef_migrations_history
        var columns = await QuerySingleColumnAsync(
            ctx,
            "SELECT column_name FROM information_schema.columns " +
            "WHERE table_schema = 'public' AND table_name = '__ef_migrations_history';");

        // THEN: every column name matches ^[a-z0-9_]+$ — i.e. ApplySnakeCaseNaming()
        //       successfully rewrote MigrationId → migration_id and
        //       ProductVersion → product_version (AC #4, TC-E1-P2-04).
        Assert.NotEmpty(columns);
        var snakeCase = new Regex("^[a-z0-9_]+$");
        foreach (var column in columns)
        {
            Assert.Matches(snakeCase, column);
        }

        // Spot-check the two known columns from the EF Core history table contract.
        Assert.Contains("migration_id", columns);
        Assert.Contains("product_version", columns);
    }

    private static async Task<List<string>> QuerySingleColumnAsync(AppDbContext ctx, string sql)
    {
        var connection = ctx.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
        {
            await connection.OpenAsync();
        }

        await using var command = connection.CreateCommand();
        command.CommandText = sql;

        var results = new List<string>();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            results.Add(reader.GetString(0));
        }
        return results;
    }
}
