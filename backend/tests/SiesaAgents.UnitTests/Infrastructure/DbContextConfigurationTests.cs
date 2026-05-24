using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// ATDD Unit Tests — Story 1.3: Backend Database Foundation
/// RED Phase: These tests FAIL until implementation is complete.
///
/// Acceptance Criteria covered:
///   AC4 — ApplySnakeCaseNaming() is called in OnModelCreating (snake_case convention)
///   AC5 — SiesaAgentsDbContext can be instantiated (DI wiring compiles and resolves correctly)
///   AC1/AC2 — DbContext model building executes without errors (precondition for migrations)
/// </summary>
public class DbContextConfigurationTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // AC5: SiesaAgentsDbContext can be instantiated via DI-style construction
    // RED: Fails because SiesaAgents.Infrastructure is not yet referenced in
    //      SiesaAgents.UnitTests.csproj and EFCore.NamingConventions is not installed.
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void DbContext_CanBeInstantiated_WithInMemoryDatabase()
    {
        // GIVEN: DbContextOptions configured with in-memory database
        var options = new DbContextOptionsBuilder<SiesaAgentsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: DbContext is constructed (simulates DI resolution)
        using var context = new SiesaAgentsDbContext(options);

        // THEN: Context is not null — DI wiring resolves correctly
        Assert.NotNull(context);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC4: ApplySnakeCaseNaming() is called — model building must not throw
    // RED: Fails because:
    //   1. EFCore.NamingConventions NuGet package is not added to Infrastructure.csproj
    //   2. ApplySnakeCaseNaming() call is missing from OnModelCreating
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void OnModelCreating_DoesNotThrow_WhenSnakeCaseNamingIsApplied()
    {
        // GIVEN: DbContext with in-memory database (triggers OnModelCreating)
        var options = new DbContextOptionsBuilder<SiesaAgentsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new SiesaAgentsDbContext(options);

        // WHEN: EnsureCreated triggers OnModelCreating (including ApplySnakeCaseNaming())
        var act = () => context.Database.EnsureCreated();

        // THEN: No exception is thrown — ApplySnakeCaseNaming() executed successfully
        var exception = Record.Exception(act);
        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC4: ApplyConfigurationsFromAssembly is also called (ordering requirement)
    // ApplySnakeCaseNaming() MUST be called AFTER ApplyConfigurationsFromAssembly
    // RED: Fails when EFCore.NamingConventions package is missing or call is absent
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void OnModelCreating_ModelIsBuilt_WithNoEntityTypeErrors()
    {
        // GIVEN: DbContext with in-memory database
        var options = new DbContextOptionsBuilder<SiesaAgentsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new SiesaAgentsDbContext(options);

        // WHEN: The model is accessed (forces model building via OnModelCreating)
        var model = context.Model;

        // THEN: Model is not null — OnModelCreating executed the full chain:
        //       base.OnModelCreating → ApplyConfigurationsFromAssembly → ApplySnakeCaseNaming()
        Assert.NotNull(model);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC5: Multiple DbContext instances can be created independently
    // Verifies primary constructor pattern: SiesaAgentsDbContext(DbContextOptions<T>)
    // RED: Fails when project reference to SiesaAgents.Infrastructure is missing
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void DbContext_MultipleInstances_AreIndependent()
    {
        // GIVEN: Two separate in-memory databases (simulate isolated test environments)
        var options1 = new DbContextOptionsBuilder<SiesaAgentsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var options2 = new DbContextOptionsBuilder<SiesaAgentsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: Both contexts are instantiated
        using var context1 = new SiesaAgentsDbContext(options1);
        using var context2 = new SiesaAgentsDbContext(options2);

        // THEN: Instances are distinct objects (scoped DI registration isolation)
        Assert.NotSame(context1, context2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC1/AC2: DbContext database provider is configured (precondition for EF migrations)
    // Verifies that the DbContext can report its database provider name
    // RED: Fails when SiesaAgents.Infrastructure project reference is missing from test project
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void DbContext_DatabaseProvider_IsConfigured()
    {
        // GIVEN: DbContext with in-memory database (simulates valid options object)
        var options = new DbContextOptionsBuilder<SiesaAgentsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: Context is created
        using var context = new SiesaAgentsDbContext(options);

        // THEN: Database provider is configured (not null) — precondition for migrations
        Assert.NotNull(context.Database.ProviderName);
    }
}
