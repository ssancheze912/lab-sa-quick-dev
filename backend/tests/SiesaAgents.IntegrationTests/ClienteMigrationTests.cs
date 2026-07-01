using Microsoft.EntityFrameworkCore;
using Npgsql;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Story 2.1 — <c>clientes</c> table migration integrity.
///
/// Applies migrations against a dedicated <c>siesa_agents_db_test</c> database and
/// verifies:
///   - AC #8: table <c>clientes</c> exists with the exact snake_case column set.
///   - AC #8: unique index <c>uk_clientes_nit</c> exists on <c>nit</c>.
///
/// Tests skip when local PostgreSQL is unreachable — same pattern as
/// <see cref="DatabaseMigrationTests"/>.
/// </summary>
public class ClienteMigrationTests : IAsyncLifetime
{
    private const string TestConnectionString =
        "Host=localhost;Port=5432;Database=siesa_agents_db_test;Username=postgres;Password=postgres";

    private const string AdminConnectionString =
        "Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=postgres";

    private bool _postgresAvailable;

    public async ValueTask InitializeAsync()
    {
        _postgresAvailable = await IsPostgresReachableAsync();

        if (_postgresAvailable)
        {
            await using var adminConn = new NpgsqlConnection(AdminConnectionString);
            await adminConn.OpenAsync();

            await using (var drop = new NpgsqlCommand(
                "DROP DATABASE IF EXISTS siesa_agents_db_test WITH (FORCE);", adminConn))
            {
                await drop.ExecuteNonQueryAsync();
            }
            await using (var create = new NpgsqlCommand(
                "CREATE DATABASE siesa_agents_db_test;", adminConn))
            {
                await create.ExecuteNonQueryAsync();
            }

            // Apply migrations upfront so each test can inspect the schema.
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(TestConnectionString)
                .UseSnakeCaseNamingConvention()
                .Options;
            await using var ctx = new AppDbContext(options);
            await ctx.Database.MigrateAsync();
        }
    }

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;

    [Fact(DisplayName = "[P1] AC#8 — clientes table has the exact snake_case column set")]
    public async Task ClientesTable_HasSnakeCaseColumns()
    {
        SkipIfPostgresUnavailable();

        await using var conn = new NpgsqlConnection(TestConnectionString);
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            @"SELECT column_name FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'clientes'
              ORDER BY column_name;", conn);

        var columns = new List<string>();
        await using (var reader = await cmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                columns.Add(reader.GetString(0));
            }
        }

        var expected = new List<string>
        {
            "ciudad", "created_at", "id", "nit", "nombre", "telefono", "updated_at",
        };
        var actual = columns.OrderBy(c => c, StringComparer.Ordinal).ToList();
        Assert.Equal(expected, actual);
    }

    [Fact(DisplayName = "[P1] AC#8 — uk_clientes_nit unique index exists on nit")]
    public async Task ClientesTable_HasUniqueIndexOnNit()
    {
        SkipIfPostgresUnavailable();

        await using var conn = new NpgsqlConnection(TestConnectionString);
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            @"SELECT indexname FROM pg_indexes
              WHERE schemaname = 'public' AND tablename = 'clientes';", conn);

        var indexes = new List<string>();
        await using (var reader = await cmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                indexes.Add(reader.GetString(0));
            }
        }

        Assert.Contains("uk_clientes_nit", indexes);

        // Assert uniqueness explicitly via pg_index.
        await using var uniqCmd = new NpgsqlCommand(
            @"SELECT i.indisunique
              FROM pg_class c
              JOIN pg_index i ON c.oid = i.indexrelid
              WHERE c.relname = 'uk_clientes_nit';", conn);
        var isUnique = (bool?)await uniqCmd.ExecuteScalarAsync();
        Assert.True(isUnique);
    }

    [Fact(DisplayName = "[P2] AC#8 — clientes.id column is uuid")]
    public async Task ClientesTable_IdColumn_IsUuid()
    {
        SkipIfPostgresUnavailable();

        await using var conn = new NpgsqlConnection(TestConnectionString);
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            @"SELECT data_type FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'clientes' AND column_name = 'id';", conn);
        var dataType = (string?)await cmd.ExecuteScalarAsync();
        Assert.Equal("uuid", dataType);
    }

    [Fact(DisplayName = "[P2] AC#8 — created_at / updated_at columns are timestamp with time zone")]
    public async Task ClientesTable_AuditColumns_AreTimestamptz()
    {
        SkipIfPostgresUnavailable();

        await using var conn = new NpgsqlConnection(TestConnectionString);
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            @"SELECT column_name, data_type FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'clientes'
                AND column_name IN ('created_at', 'updated_at')
              ORDER BY column_name;", conn);

        var types = new List<(string col, string type)>();
        await using (var reader = await cmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                types.Add((reader.GetString(0), reader.GetString(1)));
            }
        }

        Assert.Equal(2, types.Count);
        Assert.All(types, t => Assert.Equal("timestamp with time zone", t.type));
    }

    private static async Task<bool> IsPostgresReachableAsync()
    {
        try
        {
            await using var conn = new NpgsqlConnection(AdminConnectionString);
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
            await conn.OpenAsync(cts.Token);
            return conn.State == System.Data.ConnectionState.Open;
        }
        catch
        {
            return false;
        }
    }

    private void SkipIfPostgresUnavailable()
    {
        Assert.SkipUnless(_postgresAvailable,
            "PostgreSQL not reachable at localhost:5432 (postgres/postgres). " +
            "Start it with: docker run --name siesa-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:18-alpine");
    }
}
