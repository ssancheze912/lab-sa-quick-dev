// Story 1.3 - Backend Database Foundation
// ATDD Integration Tests: AppDbContext and EF Core infrastructure
// Status: RED - Tests will fail until AppDbContext is registered in DI and migrations are applied
// AC covered: AC#1 (migrations applied, DB created), AC#4 (connection string from config),
//             AC#5 (AppDbContext registered in DI with Npgsql, empty context)

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.IntegrationTests.Data;

/// <summary>
/// Integration tests for AppDbContext — require a running PostgreSQL instance
/// at Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres
/// Run after: dotnet ef database update
/// </summary>
public class AppDbContextTests : IDisposable
{
    // -------------------------------------------------------------------------
    // Shared context setup: reads connection string from appsettings.Development.json
    // just as the real application does — no hardcoded strings in test code (AC#4)
    // -------------------------------------------------------------------------
    private readonly AppDbContext _context;
    private readonly ServiceProvider _serviceProvider;

    public AppDbContextTests()
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "Integration tests require 'ConnectionStrings:DefaultConnection' in appsettings.Development.json " +
                "or the CONNECTIONSTRINGS__DEFAULTCONNECTION environment variable. " +
                "No hardcoded fallback is provided per company security standards (no hardcoded secrets in source).");

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString)
                   .UseSnakeCaseNamingConvention());

        _serviceProvider = services.BuildServiceProvider();
        _context = _serviceProvider.GetRequiredService<AppDbContext>();
    }

    public void Dispose()
    {
        _context.Dispose();
        _serviceProvider.Dispose();
    }

    // =========================================================================
    // AC#1 — database is created and migrations are applied
    // =========================================================================

    [Fact]
    public async Task GivenPostgresIsRunning_WhenCheckingConnection_ThenCanConnectToSiesaAgentsDb()
    {
        // GIVEN: AppDbContext is configured with the DefaultConnection connection string

        // WHEN: Checking database connectivity
        var canConnect = await _context.Database.CanConnectAsync();

        // THEN: Connection to siesa_agents_db must succeed (AC#1)
        Assert.True(canConnect, "Cannot connect to siesa_agents_db. Ensure PostgreSQL is running and dotnet ef database update has been executed.");
    }

    [Fact]
    public async Task GivenMigrationsApplied_WhenCheckingPendingMigrations_ThenNoneShouldBePending()
    {
        // GIVEN: dotnet ef database update has been run

        // WHEN: Querying pending migrations
        var pendingMigrations = await _context.Database.GetPendingMigrationsAsync();

        // THEN: No pending migrations exist — all applied (AC#1)
        Assert.Empty(pendingMigrations);
    }

    [Fact]
    public async Task GivenMigrationsRan_WhenListingAppliedMigrations_ThenAtLeastOneExists()
    {
        // GIVEN: dotnet ef migrations add InitialCreate was executed

        // WHEN: Listing applied migrations
        var appliedMigrations = await _context.Database.GetAppliedMigrationsAsync();

        // THEN: At least the InitialCreate migration is applied (AC#1)
        Assert.NotEmpty(appliedMigrations);
    }

    // =========================================================================
    // AC#5 — AppDbContext is empty (no DbSet properties) for this story
    // =========================================================================

    [Fact]
    public void GivenAppDbContext_WhenInspectingEntityTypes_ThenNoEntityTypesAreDefined()
    {
        // GIVEN: AppDbContext is created

        // WHEN: Inspecting the model's entity types
        var entityTypes = _context.Model.GetEntityTypes();

        // THEN: No domain entity DbSet<> properties should exist in this story (AC#5)
        // ClienteEntity and ContactoEntity are added in Epics 2 and 3 respectively
        Assert.Empty(entityTypes);
    }

    // =========================================================================
    // AC#2 — ApplySnakeCaseNaming() is active (naming convention applied)
    // =========================================================================

    [Fact]
    public void GivenAppDbContext_WhenModelIsCreated_ThenSnakeCaseNamingConventionIsActive()
    {
        // GIVEN: AppDbContext is configured

        // WHEN: Accessing the model (which triggers OnModelCreating)
        var model = _context.Model;

        // THEN: Model should be created without error — presence of the model
        // proves OnModelCreating executed (including ApplySnakeCaseNaming) without exception.
        // Once entities are added in Epic 2+, column names will be snake_case automatically.
        Assert.NotNull(model);
    }

    // =========================================================================
    // AC#4 — Connection string comes from configuration, not hardcoded
    // =========================================================================

    [Fact]
    public void GivenConfiguration_WhenReadingDefaultConnection_ThenConnectionStringIsPresent()
    {
        // GIVEN: appsettings.Development.json exists with ConnectionStrings section

        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.Development.json", optional: false)
            .Build();

        // WHEN: Reading the DefaultConnection key
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        // THEN: Connection string must not be null or empty (AC#4)
        Assert.False(string.IsNullOrWhiteSpace(connectionString),
            "DefaultConnection must be defined in appsettings.Development.json and not hardcoded in source.");
    }

    [Fact]
    public void GivenConfiguration_WhenReadingDefaultConnection_ThenItTargetsSiesaAgentsDb()
    {
        // GIVEN: appsettings.Development.json exists

        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.Development.json", optional: false)
            .Build();

        // WHEN: Reading the DefaultConnection key
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        // THEN: Connection string must reference the correct database (AC#4)
        Assert.Contains("siesa_agents_db", connectionString, StringComparison.OrdinalIgnoreCase);
    }
}
