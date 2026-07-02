// -----------------------------------------------------------------------------
//  Story 1.3 — Backend Database Foundation
//  RED-phase ATDD integration test for AC #1, #2, #4, #5.
//  Covers TC-E1-P1-05 (migration applies cleanly), TC-E1-P2-04 (snake_case),
//  and the scope-note enforcement that NO domain tables exist yet.
//
//  Expected RED-phase failure reasons (before DEV team implements Story 1.3):
//    1. Task 3 not done: `SiesaAgents.Infrastructure.Data.AppDbContext` type
//       does not exist → CS0246 compile error.
//    2. Task 7 not done: no InitialCreate migration exists →
//       context.Database.MigrateAsync() throws "No migrations were found".
//    3. Task 2 not done: ApplySnakeCaseNaming extension missing → the migration
//       history table columns remain PascalCase (MigrationId, ProductVersion),
//       so the Assert.Contains("migration_id", ...) assertion fails.
//    4. Task 8 not done: SiesaAgents.IntegrationTests project doesn't exist,
//       so Testcontainers.PostgreSql / Npgsql / EFCore references cannot bind.
//  All failure modes trace back to a missing acceptance-criterion behavior.
//
//  Docker prerequisite: this test uses Testcontainers to spin up an isolated
//  PostgreSQL 18 container. On machines without Docker the test halts in
//  InitializeAsync — filter with `--filter Category!=Integration` to skip.
// -----------------------------------------------------------------------------
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SiesaAgents.Infrastructure.Data;
using Testcontainers.PostgreSql;

namespace SiesaAgents.IntegrationTests;

[Trait("Category", "Integration")]
public class MigrationsAndSnakeCaseTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:18-alpine")
        .WithDatabase("siesa_agents_db")
        .Build();

    public Task InitializeAsync() => _postgres.StartAsync();

    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();

    [Fact]
    public async Task GivenEmptyDatabase_WhenApplyingInitialCreateMigration_ThenOnlyHistoryTableExistsWithSnakeCaseColumns()
    {
        // GIVEN: a fresh, empty PostgreSQL 18 database (via Testcontainers) and
        //        an AppDbContext configured with the story's Npgsql connection.
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;
        await using var context = new AppDbContext(options);

        // WHEN: the InitialCreate migration is applied end-to-end.
        await context.Database.MigrateAsync();  // AC #1 — `dotnet ef database update` behavior

        await using var conn = new NpgsqlConnection(_postgres.GetConnectionString());
        await conn.OpenAsync();

        // THEN (AC #2 / AC #5): only the migrations history table exists — no
        //                        clientes or contactos tables. The scope note
        //                        "do NOT define ClienteEntity/ContactoEntity"
        //                        is enforced empirically here.
        await using (var cmd = new NpgsqlCommand(
            @"SELECT table_name FROM information_schema.tables
              WHERE table_schema = 'public' ORDER BY table_name;", conn))
        await using (var reader = await cmd.ExecuteReaderAsync())
        {
            var tables = new List<string>();
            while (await reader.ReadAsync())
            {
                tables.Add(reader.GetString(0));
            }

            Assert.Contains("__ef_migrations_history", tables);
            Assert.DoesNotContain("clientes", tables);    // AC #5 — scope-note guard
            Assert.DoesNotContain("contactos", tables);   // AC #5 — scope-note guard
        }

        // THEN (AC #4 / TC-E1-P2-04): the history-table columns MUST be
        //                              snake_case, proving ApplySnakeCaseNaming()
        //                              is the last call in OnModelCreating.
        await using (var cmd = new NpgsqlCommand(
            @"SELECT column_name FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = '__ef_migrations_history'
              ORDER BY column_name;", conn))
        await using (var reader = await cmd.ExecuteReaderAsync())
        {
            var cols = new List<string>();
            while (await reader.ReadAsync())
            {
                cols.Add(reader.GetString(0));
            }

            Assert.Contains("migration_id", cols);
            Assert.Contains("product_version", cols);
            Assert.DoesNotContain("MigrationId", cols);      // PascalCase — forbidden
            Assert.DoesNotContain("ProductVersion", cols);   // PascalCase — forbidden
        }
    }
}
