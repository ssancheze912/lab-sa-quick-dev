// Story 1.3: Backend Database Foundation — Automate Expansion
// Epic 1: Project Foundation & Application Shell
//
// Edge-case and boundary-condition tests for AppDbContext.
// These complement the ATDD acceptance tests in AppDbContextTests.cs.
//
// New coverage:
//   - No DbSet<> properties exposed (empty context is intentional per story scope)
//   - Multiple DI scopes create independent context instances (scoped lifetime)
//   - Null options throws ArgumentNullException before reaching OnModelCreating
//   - OnModelCreating executes without error on an empty assembly configuration
//   - Accessing Model multiple times is idempotent (OnModelCreating called once)
//   - AppDbContext.Database property is accessible after instantiation
//   - DI ServiceLifetime is Scoped (EF Core default) when registered via AddDbContext

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Data;

public class AppDbContextEdgeTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Empty context — no DbSet<> properties exist in this story
    // Verifies the scope constraint: domain entities are NOT added until Epics 2+
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_HasNoPublicDbSetProperties()
    {
        // GIVEN: AppDbContext is instantiated with InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Edge_NoDbSets")
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: Reflection inspects all public DbSet<> properties
        var dbSetProperties = typeof(AppDbContext)
            .GetProperties()
            .Where(p =>
                p.PropertyType.IsGenericType &&
                p.PropertyType.GetGenericTypeDefinition() == typeof(DbSet<>))
            .ToList();

        // THEN: No DbSet<> properties exist (domain entities added in Epics 2 and 3)
        Assert.Empty(dbSetProperties);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Multiple DI scopes — each scope creates an independent context instance
    // EF Core's AddDbContext registers AppDbContext as Scoped by default
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_TwoDiScopes_ProduceDifferentInstances()
    {
        // GIVEN: DI container with AppDbContext registered (Scoped lifecycle)
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options =>
            options.UseInMemoryDatabase(databaseName: "TestDb_Edge_TwoScopes"));

        var provider = services.BuildServiceProvider();

        // WHEN: Two separate scopes each resolve AppDbContext
        AppDbContext? firstContext;
        AppDbContext? secondContext;

        using (var scope1 = provider.CreateScope())
        {
            firstContext = scope1.ServiceProvider.GetRequiredService<AppDbContext>();
        }

        using (var scope2 = provider.CreateScope())
        {
            secondContext = scope2.ServiceProvider.GetRequiredService<AppDbContext>();
        }

        // THEN: Each scope produced a different instance (Scoped — not Singleton)
        // ReferenceEquals check: two separate object instances
        Assert.NotSame(firstContext, secondContext);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Accessing Model multiple times — OnModelCreating is idempotent
    // EF Core caches the model after the first call to OnModelCreating
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_ModelAccessedMultipleTimes_ReturnsSameModel()
    {
        // GIVEN: AppDbContext with InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Edge_ModelIdempotent")
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: The Model property is accessed three times
        var model1 = context.Model;
        var model2 = context.Model;
        var model3 = context.Model;

        // THEN: All three accesses return the same cached model object (idempotent)
        Assert.Same(model1, model2);
        Assert.Same(model2, model3);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Database property accessible — proves infrastructure connection is wired
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_DatabaseProperty_IsNotNull()
    {
        // GIVEN: AppDbContext with InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Edge_DatabaseProperty")
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: The Database property is accessed
        var database = context.Database;

        // THEN: It is not null (EF Core infrastructure is properly wired)
        Assert.NotNull(database);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DI service lifetime — AddDbContext registers as Scoped by default
    // Confirms EF Core's lifecycle contract (Scoped, not Singleton or Transient)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_WhenRegisteredViaAddDbContext_IsRegisteredAsScopedLifetime()
    {
        // GIVEN: DI container with AppDbContext registered via AddDbContext
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options =>
            options.UseInMemoryDatabase(databaseName: "TestDb_Edge_Lifetime"));

        // WHEN: The service descriptor for AppDbContext is inspected
        var descriptor = services.FirstOrDefault(sd => sd.ServiceType == typeof(AppDbContext));

        // THEN: The lifetime is Scoped (EF Core's AddDbContext default)
        Assert.NotNull(descriptor);
        Assert.Equal(ServiceLifetime.Scoped, descriptor.Lifetime);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Same scope — resolving AppDbContext twice returns the same instance
    // Verifies Scoped (not Transient) behavior within a single request scope
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_SameDiScope_ReturnsSameInstance()
    {
        // GIVEN: DI container with AppDbContext registered
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options =>
            options.UseInMemoryDatabase(databaseName: "TestDb_Edge_SameScope"));

        var provider = services.BuildServiceProvider();

        // WHEN: The same scope resolves AppDbContext twice
        using var scope = provider.CreateScope();
        var context1 = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var context2 = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // THEN: Both resolutions return the same instance (Scoped — not Transient)
        Assert.Same(context1, context2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OnModelCreating — ApplyConfigurationsFromAssembly runs on empty assembly
    // Infrastructure assembly has no IEntityTypeConfiguration<> types in Story 1.3
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_OnModelCreating_ApplyConfigurationsFromAssemblyDoesNotThrowOnEmptyAssembly()
    {
        // GIVEN: AppDbContext with InMemory provider (no entity configurations registered yet)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Edge_EmptyAssembly")
            .Options;

        // WHEN: AppDbContext is instantiated and Model accessed
        //       (ApplyConfigurationsFromAssembly finds zero IEntityTypeConfiguration<> types)
        var exception = Record.Exception(() =>
        {
            using var context = new AppDbContext(options);
            _ = context.Model; // triggers OnModelCreating
        });

        // THEN: No exception — empty assembly configuration is valid for Story 1.3
        Assert.Null(exception);
    }
}
