// Story 1.3: Backend Database Foundation
// Epic 1: Project Foundation & Application Shell
//
// ATDD Acceptance Tests — RED Phase (DB Integration — GATED on real PostgreSQL)
// These tests are intentionally FAILING until:
//   1. AppDbContext is implemented,
//   2. SnakeCaseNamingConvention is wired in OnModelCreating,
//   3. The InitialCreate migration exists.
//
// Acceptance Criteria covered:
//   AC #1 — `dotnet ef database update` creates `siesa_agents_db` with
//           `__ef_migrations_history` using snake_case columns (`migration_id`,
//           `product_version`).
//   AC #4 — All EF-managed identifiers are lowercase snake_case in the generated SQL.
//
// Test Design references:
//   TC-E1-P1-05 — EF Core Migration Creates Database and Migrations Table
//   TC-E1-P2-04 — snake_case column verification (DB-level)
//
// Gating:
//   The test runs ONLY when the environment variable RUN_DB_INTEGRATION_TESTS=1.
//   In sandbox / CI environments without PostgreSQL, all assertions are skipped
//   via Skip.If — this matches test-design-epic-1.md #8c (P1 gated by env).

using Microsoft.EntityFrameworkCore;
using Npgsql;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

public class MigrationsHistorySnakeCaseTests : IAsyncLifetime
{
    private const string GateEnvVar = "RUN_DB_INTEGRATION_TESTS";

    private string _dbName = string.Empty;
    private string _connStr = string.Empty;
    private AppDbContext? _context;

    private static bool IsGateOpen() =>
        string.Equals(Environment.GetEnvironmentVariable(GateEnvVar), "1", StringComparison.Ordinal);

    public Task InitializeAsync()
    {
        if (!IsGateOpen())
        {
            return Task.CompletedTask;
        }

        _dbName = $"siesa_agents_test_{Guid.NewGuid():N}";
        _connStr =
            $"Host=localhost;Port=5432;Database={_dbName};Username=postgres;Password=postgres";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_connStr)
            .Options;
        _context = new AppDbContext(options);
        return Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        if (_context is not null)
        {
            try
            {
                await _context.Database.EnsureDeletedAsync();
            }
            catch
            {
                // Swallow cleanup failures so they do not mask real test results.
            }

            await _context.DisposeAsync();
        }
    }

    [SkippableFact]
    public async Task MigrateAsync_CreatesDatabase_WithoutThrowing()
    {
        Skip.IfNot(IsGateOpen(), $"Skipped: env var {GateEnvVar}=1 not set (no PostgreSQL available).");

        // GIVEN: A fresh AppDbContext bound to a randomized database name
        Assert.NotNull(_context);

        // WHEN: The migration is applied
        var ex = await Record.ExceptionAsync(() => _context!.Database.MigrateAsync());

        // THEN: No exception is thrown — the database is created and the empty migration runs
        Assert.Null(ex);
    }

    [SkippableFact]
    public async Task MigrationsHistoryTable_Exists_AfterMigrate()
    {
        Skip.IfNot(IsGateOpen(), $"Skipped: env var {GateEnvVar}=1 not set (no PostgreSQL available).");

        // GIVEN: Migrations have been applied
        Assert.NotNull(_context);
        await _context!.Database.MigrateAsync();

        // WHEN: information_schema is queried for the migrations history table
        var exists = await TableExistsAsync(_connStr, "__ef_migrations_history");

        // THEN: The table is present (lowercase, with leading double-underscore)
        Assert.True(exists);
    }

    [SkippableFact]
    public async Task MigrationsHistoryTable_MigrationIdColumn_IsSnakeCase()
    {
        Skip.IfNot(IsGateOpen(), $"Skipped: env var {GateEnvVar}=1 not set (no PostgreSQL available).");

        // GIVEN: Migrations have been applied
        Assert.NotNull(_context);
        await _context!.Database.MigrateAsync();

        // WHEN: information_schema.columns is queried for `migration_id`
        var hasColumn = await ColumnExistsAsync(_connStr, "__ef_migrations_history", "migration_id");

        // THEN: The column is lowercase snake_case (NOT `MigrationId`)
        Assert.True(hasColumn);
    }

    [SkippableFact]
    public async Task MigrationsHistoryTable_ProductVersionColumn_IsSnakeCase()
    {
        Skip.IfNot(IsGateOpen(), $"Skipped: env var {GateEnvVar}=1 not set (no PostgreSQL available).");

        // GIVEN: Migrations have been applied
        Assert.NotNull(_context);
        await _context!.Database.MigrateAsync();

        // WHEN: information_schema.columns is queried for `product_version`
        var hasColumn = await ColumnExistsAsync(_connStr, "__ef_migrations_history", "product_version");

        // THEN: The column is lowercase snake_case (NOT `ProductVersion`)
        Assert.True(hasColumn);
    }

    // ──────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────

    private static async Task<bool> TableExistsAsync(string connStr, string tableName)
    {
        await using var conn = new NpgsqlConnection(connStr);
        await conn.OpenAsync();
        await using var cmd = new NpgsqlCommand(
            "SELECT 1 FROM information_schema.tables WHERE table_name = @t LIMIT 1;",
            conn);
        cmd.Parameters.AddWithValue("t", tableName);
        var result = await cmd.ExecuteScalarAsync();
        return result is not null;
    }

    private static async Task<bool> ColumnExistsAsync(string connStr, string tableName, string columnName)
    {
        await using var conn = new NpgsqlConnection(connStr);
        await conn.OpenAsync();
        await using var cmd = new NpgsqlCommand(
            @"SELECT 1
              FROM information_schema.columns
              WHERE table_name = @t AND column_name = @c
              LIMIT 1;",
            conn);
        cmd.Parameters.AddWithValue("t", tableName);
        cmd.Parameters.AddWithValue("c", columnName);
        var result = await cmd.ExecuteScalarAsync();
        return result is not null;
    }
}

