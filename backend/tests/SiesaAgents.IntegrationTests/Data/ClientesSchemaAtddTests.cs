using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SiesaAgents.Infrastructure.Data;
using Testcontainers.PostgreSql;

namespace SiesaAgents.IntegrationTests.Data;

/// <summary>
/// Story 2.1 — Client List & Search — Schema ATDD (RED phase).
///
/// Acceptance criterion covered:
///   AC #1 — the clientes table is created with:
///     • columns: id (uuid PK), nombre, nit, telefono, ciudad, created_at, updated_at (all snake_case)
///     • unique index uk_clientes_nit on nit
///     • GIN trigram index ix_clientes_nombre_trgm on nombre (pg_trgm)
///     • pg_trgm extension installed
///
/// These tests MUST fail until ClienteConfiguration + AppDbContext.DbSet<Cliente>
/// + the AddClientesTable migration are in place.
/// </summary>
public class ClientesSchemaAtddTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:18")
        .WithDatabase("siesa_agents_db")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public Task InitializeAsync() => _postgres.StartAsync();
    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();

    [Fact]
    public async Task Migrate_CreatesClientesTable_WithSnakeCaseColumns()
    {
        // GIVEN: a clean Postgres 18 instance
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        // WHEN: migrations are applied
        await using (var context = new AppDbContext(options))
        {
            await context.Database.MigrateAsync();
        }

        // THEN: the clientes table exists with snake_case columns
        await using var conn = new NpgsqlConnection(_postgres.GetConnectionString());
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "SELECT column_name FROM information_schema.columns " +
            "WHERE table_name = 'clientes' ORDER BY ordinal_position;",
            conn);

        var columns = new List<string>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync()) columns.Add(reader.GetString(0));

        columns.Should().NotBeEmpty("the clientes table must exist after migration");
        columns.Should().Contain(new[]
        {
            "id", "nombre", "nit", "telefono", "ciudad", "created_at", "updated_at"
        });
        columns.Should().NotContain("Id");
        columns.Should().NotContain("Nombre");
        columns.Should().NotContain("CreatedAt");
    }

    [Fact]
    public async Task Migrate_CreatesUniqueIndexOnNit()
    {
        // GIVEN: a clean Postgres 18 instance and applied migrations
        await ApplyMigrationsAsync();

        // WHEN: querying pg_indexes for the unique NIT index
        await using var conn = new NpgsqlConnection(_postgres.GetConnectionString());
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "SELECT indexdef FROM pg_indexes WHERE tablename = 'clientes' AND indexname = 'uk_clientes_nit';",
            conn);

        var indexDef = await cmd.ExecuteScalarAsync() as string;

        // THEN: the uk_clientes_nit unique index exists
        indexDef.Should().NotBeNull();
        indexDef.Should().Contain("UNIQUE");
        indexDef.Should().Contain("nit");
    }

    [Fact]
    public async Task Migrate_CreatesGinTrigramIndexOnNombre()
    {
        // GIVEN: a clean Postgres 18 instance and applied migrations
        await ApplyMigrationsAsync();

        // WHEN: querying pg_indexes for the GIN trigram index
        await using var conn = new NpgsqlConnection(_postgres.GetConnectionString());
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "SELECT indexdef FROM pg_indexes WHERE tablename = 'clientes' AND indexname = 'ix_clientes_nombre_trgm';",
            conn);

        var indexDef = await cmd.ExecuteScalarAsync() as string;

        // THEN: a GIN index using gin_trgm_ops exists on nombre
        indexDef.Should().NotBeNull();
        indexDef.Should().Contain("USING gin");
        indexDef.Should().Contain("gin_trgm_ops");
        indexDef.Should().Contain("nombre");
    }

    [Fact]
    public async Task Migrate_InstallsPgTrgmExtension()
    {
        // GIVEN: a clean Postgres 18 instance and applied migrations
        await ApplyMigrationsAsync();

        // WHEN: querying pg_extension for pg_trgm
        await using var conn = new NpgsqlConnection(_postgres.GetConnectionString());
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "SELECT extname FROM pg_extension WHERE extname = 'pg_trgm';",
            conn);

        var extName = await cmd.ExecuteScalarAsync() as string;

        // THEN: the pg_trgm extension is installed
        extName.Should().Be("pg_trgm");
    }

    [Fact]
    public async Task Migrate_ClientesTableHasUuidPrimaryKey()
    {
        // GIVEN: a clean Postgres 18 instance and applied migrations
        await ApplyMigrationsAsync();

        // WHEN: querying for primary key column type
        await using var conn = new NpgsqlConnection(_postgres.GetConnectionString());
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "SELECT data_type FROM information_schema.columns " +
            "WHERE table_name = 'clientes' AND column_name = 'id';",
            conn);

        var dataType = await cmd.ExecuteScalarAsync() as string;

        // THEN: the id column is uuid
        dataType.Should().Be("uuid");
    }

    private async Task ApplyMigrationsAsync()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;
        await using var context = new AppDbContext(options);
        await context.Database.MigrateAsync();
    }
}
