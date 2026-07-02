// -----------------------------------------------------------------------------
//  Story 2.1 — Client List & Search
//  Updated in Epic 2: with ClienteEntity landed, the previous "no domain tables"
//  scope-note guards from Story 1.3 no longer apply. This test now asserts that
//  applying migrations end-to-end yields the expected snake_case public schema
//  (history table + clientes table), and that ApplySnakeCaseNaming still runs
//  as the final statement of OnModelCreating.
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
    public async Task GivenEmptyDatabase_WhenApplyingMigrations_ThenClientesTableExistsWithSnakeCaseColumns()
    {
        // GIVEN: a fresh PostgreSQL 18 database.
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;
        await using var context = new AppDbContext(options);

        // WHEN: all migrations are applied end-to-end.
        await context.Database.MigrateAsync();

        await using var conn = new NpgsqlConnection(_postgres.GetConnectionString());
        await conn.OpenAsync();

        // THEN: the clientes table (Story 2.1) is present alongside the EF history table.
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
            Assert.Contains("clientes", tables);
            // Contactos lands in Epic 3.
            Assert.DoesNotContain("contactos", tables);
        }

        // THEN: history-table columns remain snake_case (ApplySnakeCaseNaming still last).
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
            Assert.DoesNotContain("MigrationId", cols);
            Assert.DoesNotContain("ProductVersion", cols);
        }

        // THEN: clientes columns are snake_case (id, nombre, nit, telefono, ciudad, created_at, updated_at).
        await using (var cmd = new NpgsqlCommand(
            @"SELECT column_name FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'clientes'
              ORDER BY column_name;", conn))
        await using (var reader = await cmd.ExecuteReaderAsync())
        {
            var cols = new List<string>();
            while (await reader.ReadAsync())
            {
                cols.Add(reader.GetString(0));
            }

            Assert.Contains("id", cols);
            Assert.Contains("nombre", cols);
            Assert.Contains("nit", cols);
            Assert.Contains("telefono", cols);
            Assert.Contains("ciudad", cols);
            Assert.Contains("created_at", cols);
            Assert.Contains("updated_at", cols);
            Assert.DoesNotContain("CreatedAt", cols);
            Assert.DoesNotContain("UpdatedAt", cols);
        }

        // THEN: uk_clientes_nit unique index is present.
        await using (var cmd = new NpgsqlCommand(
            @"SELECT indexname FROM pg_indexes
              WHERE schemaname = 'public' AND tablename = 'clientes';", conn))
        await using (var reader = await cmd.ExecuteReaderAsync())
        {
            var indexes = new List<string>();
            while (await reader.ReadAsync())
            {
                indexes.Add(reader.GetString(0));
            }

            Assert.Contains("uk_clientes_nit", indexes);
        }
    }
}
