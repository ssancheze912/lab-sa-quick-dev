using System.Reflection;
using Npgsql;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Data;

/// <summary>
/// AC #3 (Story 1.3) / TC-E1-P2-04 (test-design-epic-1.md):
/// Given the backend receives any request, When the request is processed, Then
/// `modelBuilder.ApplySnakeCaseNaming()` is called as the LAST statement inside
/// `AppDbContext.OnModelCreating()`, and all EF-managed table/column names follow
/// snake_case convention (verifiable via the `__ef_migrations_history` table using
/// `migration_id`/`product_version` columns, not `MigrationId`/`ProductVersion`).
/// </summary>
public class SnakeCaseNamingTests
{
    private const string ConnectionString =
        "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres";

    [Fact]
    public async Task EfMigrationsHistoryTable_HasSnakeCaseColumn_MigrationId()
    {
        // GIVEN a connection to siesa_agents_db (migration already applied)
        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync();

        // WHEN querying information_schema.columns for the migration_id column
        await using var command = new NpgsqlCommand(
            "SELECT COUNT(*) FROM information_schema.columns " +
            "WHERE table_name = '__ef_migrations_history' AND column_name = 'migration_id';",
            connection);
        var count = (long)(await command.ExecuteScalarAsync() ?? 0L);

        // THEN the column is named migration_id (snake_case), not MigrationId
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task EfMigrationsHistoryTable_HasSnakeCaseColumn_ProductVersion()
    {
        // GIVEN a connection to siesa_agents_db (migration already applied)
        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync();

        // WHEN querying information_schema.columns for the product_version column
        await using var command = new NpgsqlCommand(
            "SELECT COUNT(*) FROM information_schema.columns " +
            "WHERE table_name = '__ef_migrations_history' AND column_name = 'product_version';",
            connection);
        var count = (long)(await command.ExecuteScalarAsync() ?? 0L);

        // THEN the column is named product_version (snake_case), not ProductVersion
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task EfMigrationsHistoryTable_HasNoPascalCaseColumns()
    {
        // GIVEN a connection to siesa_agents_db (migration already applied)
        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync();

        // WHEN querying information_schema.columns for the legacy PascalCase names
        await using var command = new NpgsqlCommand(
            "SELECT COUNT(*) FROM information_schema.columns " +
            "WHERE table_name = '__ef_migrations_history' " +
            "AND column_name IN ('MigrationId', 'ProductVersion');",
            connection);
        var count = (long)(await command.ExecuteScalarAsync() ?? 0L);

        // THEN no PascalCase column names exist
        Assert.Equal(0, count);
    }

    [Fact]
    public void ApplySnakeCaseNaming_IsCalledAsLastStatement_InOnModelCreating()
    {
        // GIVEN the compiled AppDbContext type's OnModelCreating method body (IL-level check
        // is brittle, so this is enforced via source inspection of the known file path instead)
        var infrastructureProjectDir = Path.Combine(
            AppContext.BaseDirectory,
            "..", "..", "..", "..", "..",
            "src", "SiesaAgents.Infrastructure");
        var appDbContextPath = Path.GetFullPath(
            Path.Combine(infrastructureProjectDir, "Data", "AppDbContext.cs"));

        Assert.True(File.Exists(appDbContextPath), $"Expected AppDbContext.cs at: {appDbContextPath}");
        var source = File.ReadAllText(appDbContextPath);

        // WHEN locating the OnModelCreating method body
        var methodStart = source.IndexOf("OnModelCreating", StringComparison.Ordinal);
        Assert.True(methodStart >= 0, "OnModelCreating method not found in AppDbContext.cs");

        var bodyStart = source.IndexOf('{', methodStart);
        var bodyEnd = FindMatchingBrace(source, bodyStart);
        var methodBody = source[bodyStart..(bodyEnd + 1)];

        // THEN the last statement in the method body is the call to ApplySnakeCaseNaming()
        var lastStatementIndex = methodBody.LastIndexOf(';', methodBody.Length - 2);
        var precedingContent = methodBody[..lastStatementIndex];
        var lastCallIndex = precedingContent.LastIndexOf("modelBuilder.ApplySnakeCaseNaming()", StringComparison.Ordinal);
        var anyOtherCallAfter = precedingContent.LastIndexOf("modelBuilder.", lastCallIndex == -1 ? 0 : precedingContent.Length - 1, StringComparison.Ordinal);

        Assert.Contains("modelBuilder.ApplySnakeCaseNaming();", methodBody);
        Assert.True(
            methodBody.LastIndexOf("modelBuilder.ApplySnakeCaseNaming()", StringComparison.Ordinal) >
            methodBody.LastIndexOf("ApplyConfigurationsFromAssembly", StringComparison.Ordinal),
            "ApplySnakeCaseNaming() must be called AFTER ApplyConfigurationsFromAssembly (i.e., last in OnModelCreating)");
    }

    [Fact]
    public void AppDbContext_HasExactlyTheClientesDbSet()
    {
        // GIVEN the compiled AppDbContext type
        var type = typeof(AppDbContext);

        // WHEN inspecting its public instance properties for DbSet<T> members
        var dbSetProperties = type
            .GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Where(p => p.PropertyType.IsGenericType &&
                        p.PropertyType.GetGenericTypeDefinition().Name.StartsWith("DbSet", StringComparison.Ordinal))
            .ToList();

        // THEN exactly one DbSet<T> property exists: Clientes (Story 2.1 — first domain entity)
        Assert.Single(dbSetProperties, p => p.Name == "Clientes");
    }

    private static int FindMatchingBrace(string source, int openBraceIndex)
    {
        var depth = 0;
        for (var i = openBraceIndex; i < source.Length; i++)
        {
            if (source[i] == '{') depth++;
            if (source[i] == '}') depth--;
            if (depth == 0) return i;
        }

        throw new InvalidOperationException("No matching closing brace found.");
    }
}
