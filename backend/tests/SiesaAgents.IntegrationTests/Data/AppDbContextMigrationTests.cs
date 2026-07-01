using Npgsql;

namespace SiesaAgents.IntegrationTests.Data;

/// <summary>
/// AC #1 (Story 1.3) / TC-E1-P1-05 (test-design-epic-1.md):
/// Given PostgreSQL is running locally, When the developer runs `dotnet ef database update`,
/// Then the `siesa_agents_db` database is created with no errors, and an EF Core `Migrations/`
/// folder exists in SiesaAgents.Infrastructure containing the generated initial migration files.
///
/// Precondition: PostgreSQL must be running locally with the connection string configured in
/// appsettings.Development.json (Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres),
/// and `dotnet ef database update --startup-project ../SiesaAgents.API` must have been run
/// from `backend/src/SiesaAgents.Infrastructure` beforehand (per story Task 4).
/// </summary>
public class AppDbContextMigrationTests
{
    private const string ConnectionString =
        "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres";

    [Fact]
    public async Task Database_SiesaAgentsDb_ExistsAndIsReachable()
    {
        // GIVEN a connection string pointing at siesa_agents_db
        await using var connection = new NpgsqlConnection(ConnectionString);

        // WHEN opening a connection to the database
        await connection.OpenAsync();

        // THEN the connection succeeds (database was created by `dotnet ef database update`)
        Assert.Equal(System.Data.ConnectionState.Open, connection.State);
    }

    [Fact]
    public async Task Database_ContainsEfMigrationsHistoryTable()
    {
        // GIVEN a connection to siesa_agents_db
        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync();

        // WHEN querying information_schema.tables for the EF migrations bookkeeping table
        await using var command = new NpgsqlCommand(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '__ef_migrations_history';",
            connection);
        var count = (long)(await command.ExecuteScalarAsync() ?? 0L);

        // THEN the __ef_migrations_history table exists (confirms migration was applied)
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task Database_ContainsClientesTable_AndContactosTableAsOfStory25()
    {
        // GIVEN a connection to siesa_agents_db
        //
        // RED PHASE (Story 2.5, Task 1): as of Story 2.5, `contactos` is
        // introduced (minimal ContactoEntity + migration, needed to prove the
        // FK ON DELETE SET NULL orphaning behavior, R2). This supersedes the
        // Story 2.1-era expectation that `contactos` did not exist yet.
        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync();

        // WHEN querying information_schema.tables for domain tables
        await using var command = new NpgsqlCommand(
            "SELECT table_name FROM information_schema.tables WHERE table_name IN ('clientes', 'contactos');",
            connection);
        await using var reader = await command.ExecuteReaderAsync();
        var tableNames = new List<string>();
        while (await reader.ReadAsync())
        {
            tableNames.Add(reader.GetString(0));
        }

        // THEN both `clientes` (Story 2.1) and `contactos` (Story 2.5) exist
        Assert.Contains("clientes", tableNames);
        Assert.Contains("contactos", tableNames);
    }

    [Fact]
    public async Task Database_ContactosClienteIdForeignKey_HasOnDeleteSetNullBehavior()
    {
        // GIVEN a connection to siesa_agents_db
        //
        // RED PHASE (Story 2.5, Task 1, R2 — the single most important test in
        // the epic): the `fk_contactos_clientes` FK constraint on
        // `contactos.cliente_id` must be configured with ON DELETE SET NULL,
        // NOT the EF Core/Postgres default (NO ACTION) and NOT CASCADE — a
        // misconfiguration here would either block client deletion entirely or
        // silently destroy contact records.
        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync();

        // WHEN querying pg_constraint for the FK's delete rule
        //
        // Cast to text explicitly: Postgres's `confdeltype` column is `"char"`
        // (a single-byte internal type), which Npgsql maps to .NET
        // `System.Char`, not `System.String` — `ExecuteScalarAsync() as
        // string` on the raw value silently yields null (invalid cast) rather
        // than throwing, so the query casts server-side to `text` to get a
        // string value that round-trips through Npgsql correctly.
        await using var command = new NpgsqlCommand(
            @"SELECT confdeltype::text FROM pg_constraint
              WHERE conname = 'fk_contactos_clientes' AND contype = 'f';",
            connection);
        var deleteRule = await command.ExecuteScalarAsync() as string;

        // THEN the delete rule is 'n' (SET NULL) per Postgres's pg_constraint.confdeltype encoding
        Assert.Equal("n", deleteRule);
    }

    [Fact]
    public async Task Database_ContactosTable_HasClienteIdIndex()
    {
        // GIVEN a connection to siesa_agents_db
        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync();

        // WHEN querying pg_indexes for the documented index name (architecture.md)
        await using var command = new NpgsqlCommand(
            "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'contactos' AND indexname = 'ix_contactos_cliente_id';",
            connection);
        var count = (long)(await command.ExecuteScalarAsync() ?? 0L);

        // THEN the ix_contactos_cliente_id index exists
        Assert.Equal(1, count);
    }

    [Fact]
    public void MigrationsFolder_ExistsInInfrastructureProject_WithGeneratedFiles()
    {
        // GIVEN the expected path to the EF Core migrations output directory
        var migrationsDir = Path.Combine(
            AppContext.BaseDirectory,
            "..", "..", "..", "..", "..",
            "src", "SiesaAgents.Infrastructure", "Data", "Migrations");
        var fullPath = Path.GetFullPath(migrationsDir);

        // WHEN checking for the directory and its generated migration files
        var exists = Directory.Exists(fullPath);
        var hasMigrationFiles = exists &&
            Directory.GetFiles(fullPath, "*.cs")
                .Any(f => !f.EndsWith(".gitkeep", StringComparison.OrdinalIgnoreCase));

        // THEN the Migrations/ folder exists and contains generated migration files (not just .gitkeep)
        Assert.True(exists, $"Expected migrations directory at: {fullPath}");
        Assert.True(hasMigrationFiles, "Expected generated *.cs migration files in Migrations/ folder");
    }
}
