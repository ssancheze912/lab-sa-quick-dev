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
    public async Task Database_ContainsClientesTable_ButNotContactos()
    {
        // GIVEN a connection to siesa_agents_db
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

        // THEN `clientes` exists (Story 2.1) but `contactos` does not yet (out of scope until Epic 3)
        Assert.Contains("clientes", tableNames);
        Assert.DoesNotContain("contactos", tableNames);
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
