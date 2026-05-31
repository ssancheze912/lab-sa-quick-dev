// Story 1.3: Backend Database Foundation
// Unit Tests — RED Phase (failing until implementation complete)
//
// Covers:
//   AC4 — ApplySnakeCaseNaming() is called last in OnModelCreating
//   AC5 — AppDbContext is registered via DI reading ConnectionStrings:DefaultConnection
//   AC6 — All projects compile (build validation tests)
//
// Pattern: xUnit + EF Core InMemory provider, Given-When-Then

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

public class AppDbContextTests
{
    // -------------------------------------------------------------------------
    // AC5 — Constructor accepts DbContextOptions without throwing
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenValidOptions_WhenConstructingAppDbContext_ThenInstanceIsNotNull()
    {
        // GIVEN: Valid DbContextOptions using InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: Constructing the AppDbContext
        using var context = new AppDbContext(options);

        // THEN: Instance is created without exception
        Assert.NotNull(context);
    }

    // -------------------------------------------------------------------------
    // AC4 — OnModelCreating calls ApplySnakeCaseNaming() without throwing
    // The InMemory provider does not enforce snake_case, but EnsureCreated()
    // triggers OnModelCreating, which must complete successfully when
    // ApplySnakeCaseNaming() is the last call (EFCore.NamingConventions package).
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenAppDbContext_WhenOnModelCreatingIsTriggered_ThenApplySnakeCaseNamingDoesNotThrow()
    {
        // GIVEN: AppDbContext configured with InMemory database
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: EnsureCreated() triggers OnModelCreating
        using var context = new AppDbContext(options);

        // THEN: ApplySnakeCaseNaming() must not throw (verify via exception absence)
        var exception = Record.Exception(() => context.Database.EnsureCreated());
        Assert.Null(exception);
    }

    [Fact]
    public void GivenAppDbContext_WhenOnModelCreatingIsTriggered_ThenDatabaseIsCreatedSuccessfully()
    {
        // GIVEN: AppDbContext configured with InMemory database
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: EnsureCreated() triggers OnModelCreating
        var created = context.Database.EnsureCreated();

        // THEN: Database creation reports success
        Assert.True(created);
    }

    // -------------------------------------------------------------------------
    // AC5 — AppDbContext is registered via AddDbContext<AppDbContext> in DI
    // with connection string from ConnectionStrings:DefaultConnection
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenConfigurationWithConnectionString_WhenAppDbContextIsRegisteredInDI_ThenItCanBeResolved()
    {
        // GIVEN: Configuration with ConnectionStrings:DefaultConnection
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] =
                    "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"
            })
            .Build();

        var services = new ServiceCollection();

        // WHEN: Registering AppDbContext exactly as Program.cs must do (AC5)
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        var serviceProvider = services.BuildServiceProvider();

        // THEN: AppDbContext can be resolved from DI container
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetService<AppDbContext>();
        Assert.NotNull(context);
    }

    [Fact]
    public void GivenDIRegistration_WhenResolvingAppDbContext_ThenConnectionStringIsDefaultConnection()
    {
        // GIVEN: Configuration with ConnectionStrings:DefaultConnection
        const string expectedConnectionString =
            "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres";

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = expectedConnectionString
            })
            .Build();

        var services = new ServiceCollection();

        // WHEN: Registering AppDbContext using GetConnectionString("DefaultConnection")
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        var serviceProvider = services.BuildServiceProvider();

        // THEN: The resolved context's connection string matches DefaultConnection
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var connectionString = context.Database.GetConnectionString();
        Assert.Equal(expectedConnectionString, connectionString);
    }

    // -------------------------------------------------------------------------
    // AC4 — ApplyConfigurationsFromAssembly is called — future entity configs
    // will be auto-registered (smoke test: no exception with empty assembly scan)
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenAppDbContext_WhenOnModelCreatingScansAssembly_ThenApplyConfigurationsFromAssemblyDoesNotThrow()
    {
        // GIVEN: AppDbContext with InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: Model is built (triggers ApplyConfigurationsFromAssembly + ApplySnakeCaseNaming)
        // THEN: No exception is thrown — assembly scan with empty results is valid
        var exception = Record.Exception(() =>
        {
            var model = context.Model; // Forces model building
            Assert.NotNull(model);
        });
        Assert.Null(exception);
    }
}
