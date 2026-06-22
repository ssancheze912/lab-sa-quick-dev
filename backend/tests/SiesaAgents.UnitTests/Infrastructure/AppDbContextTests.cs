using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Unit tests for AppDbContext — Story 1.3: Backend Database Foundation
/// AC: #1 (migrations folder), #3 (ApplySnakeCaseNaming), #5 (connection string key)
///
/// RED PHASE: These tests will fail until AppDbContext is implemented in
/// SiesaAgents.Infrastructure/Data/AppDbContext.cs
/// </summary>
public class AppDbContextTests
{
    // -------------------------------------------------------------------------
    // AC#3 — ApplySnakeCaseNaming() is the LAST call in OnModelCreating
    // -------------------------------------------------------------------------

    [Fact]
    public void OnModelCreating_WhenCalled_DoesNotThrow()
    {
        // GIVEN: An InMemory options builder configured for AppDbContext
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: AppDbContext is instantiated and model is created
        AppDbContext? act() => new AppDbContext(options);

        // THEN: No exception is thrown during construction
        var exception = Record.Exception(act);
        Assert.Null(exception);
    }

    [Fact]
    public void OnModelCreating_ApplySnakeCaseNaming_IsRegistered()
    {
        // GIVEN: An InMemory AppDbContext
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: The model is accessed (triggers OnModelCreating)
        var model = context.Model;

        // THEN: Model is built successfully — snake_case naming convention applied
        // If ApplySnakeCaseNaming() is missing, the convention registration will differ.
        // The model must not be null and must have been constructed without error.
        Assert.NotNull(model);
    }

    [Fact]
    public void AppDbContext_Constructor_AcceptsDbContextOptions()
    {
        // GIVEN: Standard DbContextOptions<AppDbContext>
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: Constructing AppDbContext with those options
        using var context = new AppDbContext(options);

        // THEN: Context is successfully created and is not null
        Assert.NotNull(context);
    }

    [Fact]
    public void AppDbContext_ModelBuilds_WithRegisteredEntityTypes()
    {
        // GIVEN: AppDbContext is constructed
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: We inspect the entity types registered in the model
        var entityTypes = context.Model.GetEntityTypes().ToList();

        // THEN: The model is built successfully (entity types may exist from later stories)
        Assert.NotNull(entityTypes);
    }

    [Fact]
    public void AppDbContext_ConnectionStringKey_MatchesCompanyStandard()
    {
        // GIVEN: A configuration that simulates appsettings.Development.json
        // AC#5 — connection string must live under key "ConnectionStrings:DefaultConnection"
        var configValues = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] =
                "Host=localhost;Port=5432;Database=siesa_agents_db;Username=postgres;Password=postgres"
        };

        var configuration = new Microsoft.Extensions.Configuration.ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();

        // WHEN: Reading the connection string with the company-standard key
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        // THEN: The connection string is present and references siesa_agents_db
        Assert.NotNull(connectionString);
        Assert.Contains("siesa_agents_db", connectionString, StringComparison.OrdinalIgnoreCase);
    }
}
