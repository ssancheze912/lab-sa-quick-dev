// Story 2.1: Client List & Search
// Epic 2: Client Management
//
// ATDD Acceptance Tests — RED Phase (DB Integration — GATED on real PostgreSQL)
// These tests are intentionally FAILING until:
//   1. AppDbContext exposes DbSet<ClienteEntity>,
//   2. The AddClienteEntity migration is generated,
//   3. ApplySnakeCaseNaming rewrites the columns + index name as documented.
//
// Acceptance Criteria covered:
//   AC #1  — clientes table with snake_case columns + unique index uk_clientes_nit on nit.
//   AC #12 — Backend coverage: TC-E2-P2-06 (uk_clientes_nit exists at DB level),
//            TC-E2-P2-07 (snake_case column names).
//
// Test Design references:
//   TC-E2-P2-06 — NIT unique index at DB level.
//   TC-E2-P2-07 — `clientes` table uses snake_case columns.
//
// Gating:
//   Runs ONLY when RUN_DB_INTEGRATION_TESTS=1. In sandbox / CI without PostgreSQL,
//   every assertion is skipped via Skip.IfNot — matches the Story 1.3 pattern set
//   by MigrationsHistorySnakeCaseTests.

using Microsoft.EntityFrameworkCore;
using Npgsql;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

public class ClienteSchemaIntegrationTests : IAsyncLifetime
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
    public async Task TC_E2_P2_07_ClientesTable_HasAllSevenSnakeCaseColumns()
    {
        Skip.IfNot(IsGateOpen(), $"Skipped: env var {GateEnvVar}=1 not set (no PostgreSQL available).");

        // GIVEN: The migration has been applied
        Assert.NotNull(_context);
        await _context!.Database.MigrateAsync();

        // WHEN / THEN: information_schema.columns reports every expected snake_case column
        var expected = new[] { "id", "nombre", "nit", "telefono", "ciudad", "created_at", "updated_at" };
        foreach (var column in expected)
        {
            var present = await ColumnExistsAsync(_connStr, "clientes", column);
            Assert.True(present, $"Column 'clientes.{column}' is missing — verify ApplySnakeCaseNaming runs LAST.");
        }
    }

    [SkippableFact]
    public async Task TC_E2_P2_07_ClientesTable_DoesNotExposePascalCaseColumns()
    {
        Skip.IfNot(IsGateOpen(), $"Skipped: env var {GateEnvVar}=1 not set (no PostgreSQL available).");

        // GIVEN: The migration has been applied
        Assert.NotNull(_context);
        await _context!.Database.MigrateAsync();

        // WHEN / THEN: No PascalCase leaks (would indicate ApplySnakeCaseNaming was skipped)
        var leaks = new[] { "Id", "Nombre", "Nit", "Telefono", "Ciudad", "CreatedAt", "UpdatedAt" };
        foreach (var leak in leaks)
        {
            var present = await ColumnExistsAsync(_connStr, "clientes", leak);
            Assert.False(present, $"PascalCase column 'clientes.{leak}' leaked into the database.");
        }
    }

    [SkippableFact]
    public async Task TC_E2_P2_06_ClientesTable_HasUniqueIndexUkClientesNitOnNit()
    {
        Skip.IfNot(IsGateOpen(), $"Skipped: env var {GateEnvVar}=1 not set (no PostgreSQL available).");

        // GIVEN: The migration has been applied
        Assert.NotNull(_context);
        await _context!.Database.MigrateAsync();

        // WHEN: pg_indexes is queried for the canonical unique index name
        var matches = await CountAsync(_connStr,
            "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'clientes' AND indexname = 'uk_clientes_nit';");

        // THEN: Exactly one index named `uk_clientes_nit` exists on `clientes`
        Assert.Equal(1, matches);
    }

    [SkippableFact]
    public async Task TC_E2_P2_06_UkClientesNit_EnforcesUniqueConstraintOnNit()
    {
        Skip.IfNot(IsGateOpen(), $"Skipped: env var {GateEnvVar}=1 not set (no PostgreSQL available).");

        // GIVEN: The migration has been applied
        Assert.NotNull(_context);
        await _context!.Database.MigrateAsync();

        // WHEN: pg_index is queried for the unique flag on uk_clientes_nit
        var isUnique = await CountAsync(_connStr,
            @"SELECT COUNT(*) FROM pg_index i
              JOIN pg_class c ON c.oid = i.indexrelid
              WHERE c.relname = 'uk_clientes_nit' AND i.indisunique = TRUE;");

        // THEN: The index exists AND is marked as unique
        Assert.Equal(1, isUnique);
    }

    // ──────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────

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

    private static async Task<int> CountAsync(string connStr, string sql)
    {
        await using var conn = new NpgsqlConnection(connStr);
        await conn.OpenAsync();
        await using var cmd = new NpgsqlCommand(sql, conn);
        var result = await cmd.ExecuteScalarAsync();
        return result is null ? 0 : Convert.ToInt32(result);
    }
}
