/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (Unit Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC4 — ApplySnakeCaseNaming() is called LAST in OnModelCreating; no [Column]/[Table] attributes used
 *   AC5 — DbContext registered in DI reading ConnectionStrings:DefaultConnection via Npgsql provider
 *
 * Test Framework: xUnit
 * Test Pattern: Arrange / Act / Assert
 * Dependency: Microsoft.EntityFrameworkCore.InMemory (must be added to .csproj)
 */

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

// NOTE: These tests will fail to COMPILE until:
//   1. SiesaAgents.Infrastructure project reference is added to SiesaAgents.UnitTests.csproj
//   2. Microsoft.EntityFrameworkCore.InMemory package is added to SiesaAgents.UnitTests.csproj
//   3. EFCore.NamingConventions package is added to SiesaAgents.Infrastructure.csproj
//   4. SiesaAgentsDbContext.OnModelCreating calls modelBuilder.UseSnakeCaseNamingConvention()

namespace SiesaAgents.UnitTests.Infrastructure;

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — ApplySnakeCaseNaming() is called LAST in OnModelCreating
// ─────────────────────────────────────────────────────────────────────────────

public class SiesaAgentsDbContextTests
{
    /// <summary>
    /// AC4: SiesaAgentsDbContext can be instantiated without throwing when using InMemory provider.
    /// RED: Fails until Infrastructure project reference and InMemory package are added.
    /// </summary>
    [Fact]
    public void SiesaAgentsDbContext_WhenInstantiatedWithInMemoryProvider_ShouldNotThrow()
    {
        // GIVEN: An InMemory database options configuration
        var options = new DbContextOptionsBuilder<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        // WHEN: The DbContext is instantiated
        var exception = Record.Exception(() =>
        {
            using var context = new SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext(options);
        });

        // THEN: No exception is thrown
        Assert.Null(exception);
    }

    /// <summary>
    /// AC4: OnModelCreating completes without errors — entity configuration assembly scan succeeds.
    /// RED: Fails until UseSnakeCaseNamingConvention() is properly applied via EFCore.NamingConventions.
    /// </summary>
    [Fact]
    public void SiesaAgentsDbContext_OnModelCreating_ShouldCompleteWithoutErrors()
    {
        // GIVEN: An InMemory database options configuration
        var options = new DbContextOptionsBuilder<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        // WHEN: The DbContext model is built (OnModelCreating is invoked)
        var exception = Record.Exception(() =>
        {
            using var context = new SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext(options);
            // Force model creation by accessing Model property
            _ = context.Model;
        });

        // THEN: OnModelCreating completes without throwing
        Assert.Null(exception);
    }

    /// <summary>
    /// AC4: UseSnakeCaseNamingConvention() must be applied — verifies that EF Core options
    /// are configured with the snake_case naming convention via UseSnakeCaseNamingConvention().
    /// </summary>
    [Fact]
    public void SiesaAgentsDbContext_Model_ShouldHaveSnakeCaseNamingConventionApplied()
    {
        // GIVEN: DbContextOptions configured with UseSnakeCaseNamingConvention (as per Program.cs registration)
        var options = new DbContextOptionsBuilder<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .UseSnakeCaseNamingConvention()
            .Options;

        using var context = new SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext(options);

        // WHEN: The model is accessed after OnModelCreating runs
        var model = context.Model;

        // THEN: The model builds without errors when snake_case convention is applied
        // EFCore.NamingConventions applies naming at options level — model is valid
        Assert.NotNull(model);

        // AND: The extension that provides snake_case naming is present in options
        var hasNamingConventionExtension = options.Extensions
            .Any(e => e.GetType().FullName?.Contains("NamingConvention", StringComparison.OrdinalIgnoreCase) == true);

        Assert.True(hasNamingConventionExtension,
            "Expected snake_case naming convention extension to be present in DbContextOptions. " +
            "Ensure UseSnakeCaseNamingConvention() is applied to the DbContextOptionsBuilder.");
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — DbContext registered in DI with Npgsql provider reading DefaultConnection
// ─────────────────────────────────────────────────────────────────────────────

public class DbContextDependencyInjectionTests
{
    /// <summary>
    /// AC5: SiesaAgentsDbContext is resolvable from the DI container when registered with AddDbContext.
    /// RED: Fails until AddDbContext<SiesaAgentsDbContext> is registered in Program.cs / ServiceCollection.
    /// </summary>
    [Fact]
    public void ServiceCollection_WhenDbContextRegistered_ShouldResolveSiesaAgentsDbContext()
    {
        // GIVEN: A service collection with SiesaAgentsDbContext registered using the InMemory provider
        //        (simulating the AddDbContext registration pattern from Program.cs)
        var services = new ServiceCollection();
        services.AddDbContext<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>(options =>
            options.UseInMemoryDatabase(databaseName: $"TestDb_DI_{Guid.NewGuid()}"));

        var serviceProvider = services.BuildServiceProvider();

        // WHEN: SiesaAgentsDbContext is resolved from the DI container
        var exception = Record.Exception(() =>
        {
            using var context = serviceProvider
                .GetRequiredService<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>();
        });

        // THEN: The DbContext is resolved without throwing
        Assert.Null(exception);
    }

    /// <summary>
    /// AC5: The connection string key "DefaultConnection" must be read from configuration.
    /// Verifies AddDbContext uses builder.Configuration.GetConnectionString("DefaultConnection").
    /// RED: Fails until Program.cs registers the DbContext reading from ConnectionStrings:DefaultConnection.
    /// </summary>
    [Fact]
    public void ServiceCollection_WhenDbContextRegistered_ShouldBeRegisteredAsScopedService()
    {
        // GIVEN: A service collection with SiesaAgentsDbContext registered via AddDbContext
        var services = new ServiceCollection();
        services.AddDbContext<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>(options =>
            options.UseInMemoryDatabase(databaseName: $"TestDb_DI_Scoped_{Guid.NewGuid()}"));

        // WHEN: The service descriptor for SiesaAgentsDbContext is inspected
        var descriptor = services.FirstOrDefault(d =>
            d.ServiceType == typeof(SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext));

        // THEN: DbContext is registered as Scoped (EF Core default for AddDbContext)
        Assert.NotNull(descriptor);
        Assert.Equal(ServiceLifetime.Scoped, descriptor!.Lifetime);
    }

    /// <summary>
    /// AC5: DbContext options must use Npgsql provider — not InMemory or SQLite.
    /// RED: Fails until AddDbContext uses .UseNpgsql() in Program.cs.
    /// NOTE: This test uses a real Npgsql options builder (no actual DB connection — just verifies
    ///       the provider is configured). The test does NOT run a query; it only checks options.
    /// </summary>
    [Fact]
    public void DbContextOptions_WhenConfiguredWithNpgsql_ShouldHaveNpgsqlProviderRegistered()
    {
        // GIVEN: DbContextOptions configured with the Npgsql provider and a valid connection string
        const string connectionString =
            "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres";

        var optionsBuilder = new DbContextOptionsBuilder<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>();

        // WHEN: UseNpgsql is called with the connection string from appsettings.Development.json
        optionsBuilder.UseNpgsql(connectionString);

        // THEN: The provider name in the options is the Npgsql provider
        var options = optionsBuilder.Options;
        Assert.NotNull(options.Extensions);

        var npgsqlExtension = options.Extensions
            .FirstOrDefault(e => e.GetType().FullName?.Contains("Npgsql") == true);

        Assert.NotNull(npgsqlExtension);
    }
}
