using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Integration tests for the database foundation — Story 1.3 AC1 / AC4.
/// Validates that AppDbContext can connect to siesa_agents_db and that the
/// initial EF Core migration has been applied (one entry in __EFMigrationsHistory).
///
/// These tests are in RED phase. They will fail until:
///   1. AppDbContext is created at SiesaAgents.Infrastructure/Data/AppDbContext.cs
///   2. dotnet ef migrations add InitialCreate has been run
///   3. dotnet ef database update has been run against siesa_agents_db
///
/// Prerequisites: A running PostgreSQL instance accessible via the connection string
/// in the environment variable ConnectionStrings__DefaultConnection
/// or in appsettings.Test.json (Host=localhost;Port=5432;Database=siesa_agents_db).
///
/// Test IDs: INT-F-01, INT-F-02
/// </summary>
public class DatabaseFoundationTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly ServiceProvider _serviceProvider;

    public DatabaseFoundationTests()
    {
        // Resolve connection string: env var takes priority over appsettings.Test.json
        var configuration = new ConfigurationBuilder()
            .AddJsonFile("appsettings.Test.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=siesa_agents_db;Username=postgres;Password=postgres";

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        _serviceProvider = services.BuildServiceProvider();
        _context = _serviceProvider.GetRequiredService<AppDbContext>();
    }

    /// <summary>
    /// INT-F-01 (P1 — AC4)
    /// Given the backend is running with AppDbContext registered (Npgsql provider)
    /// When AppDbContext.Database.CanConnectAsync() is called
    /// Then it returns true — confirming siesa_agents_db is reachable
    /// </summary>
    [Fact]
    public async Task CanConnectAsync_ReturnsTrueForSiesaAgentsDb()
    {
        // GIVEN: AppDbContext with Npgsql connection to siesa_agents_db
        // WHEN: CanConnectAsync is called
        var canConnect = await _context.Database.CanConnectAsync();

        // THEN: Database is reachable
        Assert.True(canConnect, "AppDbContext.Database.CanConnectAsync() must return true for siesa_agents_db");
    }

    /// <summary>
    /// INT-F-02 (P1 — AC1)
    /// Given dotnet ef database update has been executed successfully
    /// When the __EFMigrationsHistory table is queried
    /// Then it exists and contains exactly one entry (the initial empty migration)
    /// </summary>
    [Fact]
    public async Task MigrationsHistory_ContainsExactlyOneEntry_AfterInitialMigration()
    {
        // GIVEN: Database has been updated with the initial migration
        // WHEN: Query the EF migrations history table directly via raw SQL
        var migrationCount = await _context.Database
            .SqlQueryRaw<int>("SELECT COUNT(*)::int AS \"Value\" FROM \"__EFMigrationsHistory\"")
            .FirstAsync();

        // THEN: Exactly one migration entry exists (the empty InitialCreate migration)
        Assert.Equal(1, migrationCount);
    }

    /// <summary>
    /// INT-F-02b (P1 — AC1)
    /// Given the initial migration was applied
    /// When the __EFMigrationsHistory table is queried
    /// Then the migration ID contains "InitialCreate" as part of its name
    /// confirming the correct migration was applied
    /// </summary>
    [Fact]
    public async Task MigrationsHistory_ContainsMigrationNamedInitialCreate()
    {
        // GIVEN: Database updated with initial migration
        // WHEN: Query the MigrationId of the single history entry
        var migrationIds = await _context.Database
            .SqlQueryRaw<string>("SELECT \"MigrationId\" FROM \"__EFMigrationsHistory\"")
            .ToListAsync();

        // THEN: At least one migration has "InitialCreate" in its name
        Assert.Contains(migrationIds, id =>
            id.Contains("InitialCreate", StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// INT-F-01b (P1 — AC1)
    /// Given the backend is running
    /// When the database connection is tested and GetPendingMigrationsAsync() is called
    /// Then there are no pending migrations — all migrations have been applied
    /// </summary>
    [Fact]
    public async Task GetPendingMigrationsAsync_ReturnsEmpty_AfterDotnetEfDatabaseUpdate()
    {
        // GIVEN: Database updated via dotnet ef database update
        // WHEN: Pending migrations are queried
        var pendingMigrations = await _context.Database.GetPendingMigrationsAsync();

        // THEN: No migrations are pending — database is up to date
        Assert.Empty(pendingMigrations);
    }

    public void Dispose()
    {
        _context.Dispose();
        _serviceProvider.Dispose();
    }
}
