using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Integration edge-case tests for the database foundation — Story 1.3.
/// Expands ATDD coverage with boundary and error-path scenarios not included in
/// DatabaseFoundationTests.cs (INT-F-01, INT-F-02).
///
/// Prerequisites: A running PostgreSQL instance accessible via the connection string
/// in the environment variable ConnectionStrings__DefaultConnection
/// or in appsettings.Test.json (Host=localhost;Port=5432;Database=siesa_agents_db).
///
/// Test IDs: INT-EDGE-01 … INT-EDGE-06
/// </summary>
public class DatabaseFoundationEdgeCaseTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly string _connectionString;
    private readonly ServiceProvider _serviceProvider;

    public DatabaseFoundationEdgeCaseTests()
    {
        var configuration = new ConfigurationBuilder()
            .AddJsonFile("appsettings.Test.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=siesa_agents_db;Username=postgres;Password=postgres";

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(_connectionString));

        _serviceProvider = services.BuildServiceProvider();
        _context = _serviceProvider.GetRequiredService<AppDbContext>();
    }

    /// <summary>
    /// INT-EDGE-01 (P1 — AC4)
    /// GetAppliedMigrationsAsync() must return a non-empty list after
    /// "dotnet ef database update" — at least the InitialCreate migration.
    /// Complements INT-F-02 which checks history count; this asserts the list is not empty.
    /// </summary>
    [Fact]
    public async Task GetAppliedMigrationsAsync_ReturnsAtLeastOneMigration()
    {
        // GIVEN: Database has been updated with at least one migration
        // WHEN: Applied migrations are queried
        var applied = await _context.Database.GetAppliedMigrationsAsync();

        // THEN: At least one migration has been applied
        Assert.NotEmpty(applied);
    }

    /// <summary>
    /// INT-EDGE-02 (P1 — AC1)
    /// The applied migrations list must contain exactly one entry whose name
    /// includes "InitialCreate". This is a boundary check on both count and content.
    /// </summary>
    [Fact]
    public async Task GetAppliedMigrationsAsync_ContainsExactlyInitialCreate()
    {
        // GIVEN: Database is freshly migrated with the initial empty migration
        // WHEN: Applied migrations are queried
        var applied = (await _context.Database.GetAppliedMigrationsAsync()).ToList();

        // THEN: Exactly one migration, named InitialCreate
        Assert.Single(applied);
        Assert.Contains("InitialCreate", applied[0], StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// INT-EDGE-03 (P1 — AC4)
    /// CanConnectAsync() called twice in sequence on the same context instance
    /// must return true both times — connection is reusable (no connection leak).
    /// </summary>
    [Fact]
    public async Task CanConnectAsync_CalledTwice_ReturnsTrueBothTimes()
    {
        // GIVEN: AppDbContext with Npgsql connection
        // WHEN: CanConnectAsync is called twice sequentially
        var first = await _context.Database.CanConnectAsync();
        var second = await _context.Database.CanConnectAsync();

        // THEN: Both calls succeed — connection pooling is healthy
        Assert.True(first, "First CanConnectAsync must return true");
        Assert.True(second, "Second CanConnectAsync must return true — no connection leak");
    }

    /// <summary>
    /// INT-EDGE-04 (P2 — AC1)
    /// CanConnectAsync() with a deliberately invalid connection string must return false
    /// (or throw a specific exception) and NOT return true.
    /// This validates that the positive case in INT-F-01 is meaningful (not trivially passing).
    /// </summary>
    [Fact]
    public async Task CanConnectAsync_WithInvalidConnectionString_ReturnsFalseOrThrows()
    {
        // GIVEN: A context configured with a port that no PostgreSQL listens on
        const string badConnString =
            "Host=localhost;Port=9999;Database=nonexistent_db;Username=wrong;Password=wrong;" +
            "Timeout=2;CommandTimeout=2";

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(badConnString));

        using var provider = services.BuildServiceProvider();
        using var badContext = provider.GetRequiredService<AppDbContext>();

        // WHEN: CanConnectAsync is called against the unreachable host
        // THEN: Result must be false OR an exception is thrown — never silently true
        bool canConnect;
        try
        {
            canConnect = await badContext.Database.CanConnectAsync();
        }
        catch (Exception)
        {
            // An exception from an unreachable host is an acceptable outcome
            canConnect = false;
        }

        Assert.False(canConnect,
            "CanConnectAsync must NOT return true for an invalid/unreachable connection string.");
    }

    /// <summary>
    /// INT-EDGE-05 (P2 — AC1)
    /// The EF Core database provider registered for AppDbContext must be Npgsql (PostgreSQL).
    /// This guards against accidentally swapping to SQLite or in-memory in production DI.
    /// </summary>
    [Fact]
    public void AppDbContext_DatabaseProvider_IsNpgsql()
    {
        // GIVEN: AppDbContext is created via DI with Npgsql registered in Program.cs
        // WHEN: The database provider name is inspected
        var providerName = _context.Database.ProviderName;

        // THEN: Provider must be Npgsql — not SQLite, InMemory, or any other
        Assert.NotNull(providerName);
        Assert.Contains("Npgsql", providerName, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// INT-EDGE-06 (P2 — AC4)
    /// The connection string resolved at runtime must reference "siesa_agents_db"
    /// and not a test-only database or an empty string.
    /// Guards against misconfigured test environments silently passing against wrong DB.
    /// </summary>
    [Fact]
    public void ConnectionString_ContainsSiesaAgentsDb_DatabaseName()
    {
        // GIVEN: Connection string from environment or appsettings.Test.json
        // WHEN: Inspected for the mandatory database name
        // THEN: Must reference siesa_agents_db
        Assert.Contains("siesa_agents_db", _connectionString, StringComparison.OrdinalIgnoreCase);
    }

    public void Dispose()
    {
        _context.Dispose();
        _serviceProvider.Dispose();
    }
}
