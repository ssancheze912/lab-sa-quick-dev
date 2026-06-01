// Story 1.3: Backend Database Foundation — Automation Expansion
// Epic 1: Project Foundation & Application Shell
//
// Unit Tests — AUTOMATION EXPANSION (xUnit)
// Edge cases and boundary conditions NOT covered by ATDD tests.
//
// Focus areas:
//   - Multiple instantiations and disposal behavior
//   - Model build idempotency (calling Model multiple times is safe)
//   - Entity count boundary: exactly 0 entity types registered in this story
//   - ApplyConfigurationsFromAssembly with no IEntityTypeConfiguration<> in assembly
//   - DbContext type identity: only one AppDbContext class exists
//   - Options builder invariants: database name uniqueness for parallel tests
//   - Null-safety: operations after Dispose must throw ObjectDisposedException

using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Automation expansion tests for AppDbContext.
/// Covers edge cases beyond AC3/AC5 acceptance criteria:
/// disposal, model idempotency, entity count boundaries, concurrent instantiation.
/// </summary>
public class AppDbContextEdgeCasesTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Disposal behavior — using pattern must release resources cleanly
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Dispose: AppDbContext disposes without exception via using pattern")]
    public void AppDbContext_WhenDisposedViaUsing_DoesNotThrow()
    {
        // GIVEN: AppDbContext created with InMemory options
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: AppDbContext is used inside a using block and Dispose is called implicitly
        var exception = Record.Exception(() =>
        {
            using var ctx = new AppDbContext(options);
            _ = ctx.Model; // access model before disposal
        });

        // THEN: Dispose completes without throwing
        Assert.Null(exception);
    }

    [Fact(DisplayName = "[P1] Dispose: accessing Model after Dispose throws ObjectDisposedException")]
    public void AppDbContext_WhenDisposedExplicitly_ThrowsObjectDisposedExceptionOnModelAccess()
    {
        // GIVEN: AppDbContext created and explicitly disposed
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var ctx = new AppDbContext(options);
        ctx.Dispose();

        // WHEN: Model is accessed after disposal
        // THEN: ObjectDisposedException is thrown (DbContext contract)
        Assert.Throws<ObjectDisposedException>(() => _ = ctx.Model);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Model build idempotency — EF Core caches the model after first build
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Model idempotency: accessing Model property twice returns the same instance")]
    public void AppDbContext_WhenModelAccessedTwice_ReturnsSameInstance()
    {
        // GIVEN: AppDbContext configured with InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var ctx = new AppDbContext(options);

        // WHEN: Model is accessed multiple times
        var model1 = ctx.Model;
        var model2 = ctx.Model;

        // THEN: Both accesses return the same cached model instance (EF Core caches after first build)
        Assert.Same(model1, model2);
    }

    [Fact(DisplayName = "[P1] Model idempotency: OnModelCreating is safe to trigger multiple times across separate instances")]
    public void AppDbContext_WhenMultipleInstancesCreated_EachBuildsModelWithoutErrors()
    {
        // GIVEN: Multiple separate AppDbContext instances (simulating multiple scopes in DI)
        var exceptions = new List<Exception?>();

        for (var i = 0; i < 5; i++)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            exceptions.Add(Record.Exception(() =>
            {
                using var ctx = new AppDbContext(options);
                _ = ctx.Model;
            }));
        }

        // THEN: All 5 instances build their model without exceptions
        Assert.All(exceptions, ex => Assert.Null(ex));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Entity count boundary — exactly 0 entity types in this story
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Entity count: model has exactly 0 entity types registered in Story 1.3")]
    public void AppDbContext_Model_HasExactlyZeroEntityTypes()
    {
        // GIVEN: AppDbContext with no DbSet<> properties (Story 1.3 scope constraint)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var ctx = new AppDbContext(options);

        // WHEN: Entity types are enumerated from the model
        var entityTypeCount = ctx.Model.GetEntityTypes().Count();

        // THEN: Count is 0 — no entities registered in this story (Epic 2 adds ClienteEntity)
        Assert.Equal(0, entityTypeCount);
    }

    [Fact(DisplayName = "[P2] Table names: no table name in model matches any known domain entity convention")]
    public void AppDbContext_Model_ContainsNoKnownDomainEntityTableNames()
    {
        // GIVEN: AppDbContext with no DbSet<> properties
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var ctx = new AppDbContext(options);

        // WHEN: All entity type names (not table names, since no entities) are checked
        var entityTypeNames = ctx.Model.GetEntityTypes()
            .Select(e => e.ClrType.Name.ToLowerInvariant())
            .ToList();

        // THEN: No known domain entity class names are present
        Assert.DoesNotContain("clienteentity", entityTypeNames);
        Assert.DoesNotContain("cliente", entityTypeNames);
        Assert.DoesNotContain("contactoentity", entityTypeNames);
        Assert.DoesNotContain("contacto", entityTypeNames);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: ApplyConfigurationsFromAssembly with empty configuration set
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] ApplyConfigurationsFromAssembly: no IEntityTypeConfiguration in assembly — model still builds")]
    public void AppDbContext_WithNoEntityConfigurations_ModelBuildsWithoutErrors()
    {
        // GIVEN: SiesaAgents.Infrastructure assembly has no IEntityTypeConfiguration<T> classes yet
        //        (ClienteConfiguration and ContactoConfiguration belong to Epic 2/3)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: OnModelCreating calls ApplyConfigurationsFromAssembly (with 0 configs to apply)
        // THEN: No exception is thrown — method is safe with empty configuration set
        var exception = Record.Exception(() =>
        {
            using var ctx = new AppDbContext(options);
            _ = ctx.Model;
        });

        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Type identity — AppDbContext is the correct concrete type
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Type identity: AppDbContext is assignable to DbContext (polymorphism contract)")]
    public void AppDbContext_IsAssignableToDbContext()
    {
        // GIVEN: The AppDbContext class definition
        // WHEN: Assignability is checked via reflection
        // THEN: AppDbContext is a DbContext subtype (required for EF Core DI and tooling)
        Assert.True(typeof(DbContext).IsAssignableFrom(typeof(AppDbContext)));
    }

    [Fact(DisplayName = "[P2] Type identity: AppDbContext lives in SiesaAgents.Infrastructure.Data namespace")]
    public void AppDbContext_LivesInCorrectNamespace()
    {
        // GIVEN: Company architecture places DbContext in Infrastructure.Data
        // WHEN: Namespace is inspected via reflection
        var namespaceName = typeof(AppDbContext).Namespace;

        // THEN: Namespace matches the Clean Architecture convention
        Assert.Equal("SiesaAgents.Infrastructure.Data", namespaceName);
    }

    [Fact(DisplayName = "[P2] Type identity: Only one class named AppDbContext exists in Infrastructure assembly")]
    public void AppDbContext_OnlyOneClassWithThatNameExists()
    {
        // GIVEN: Infrastructure assembly loaded
        var assembly = typeof(AppDbContext).Assembly;

        // WHEN: All types named AppDbContext are found
        var dbContextTypes = assembly.GetTypes()
            .Where(t => t.Name == "AppDbContext")
            .ToList();

        // THEN: Exactly one AppDbContext class exists (no accidental duplicates)
        Assert.Single(dbContextTypes);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Database name uniqueness — parallel tests don't share state
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P2] Test isolation: two contexts with different database names have different options")]
    public void AppDbContext_WithDifferentDatabaseNames_HaveDifferentOptions()
    {
        // GIVEN: Two AppDbContext instances configured with different InMemory database names
        var dbName1 = "test-isolation-" + Guid.NewGuid();
        var dbName2 = "test-isolation-" + Guid.NewGuid();

        var options1 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName1)
            .Options;

        var options2 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName2)
            .Options;

        // WHEN: Both contexts are created
        using var ctx1 = new AppDbContext(options1);
        using var ctx2 = new AppDbContext(options2);

        // THEN: The options objects are not the same reference (different configurations)
        // This confirms test isolation — each context was built from independent options
        Assert.NotSame(options1, options2);

        // AND: Both contexts are independently functional (model builds without errors)
        var exception1 = Record.Exception(() => _ = ctx1.Model);
        var exception2 = Record.Exception(() => _ = ctx2.Model);
        Assert.Null(exception1);
        Assert.Null(exception2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Constructor parameter type — must be generic DbContextOptions<AppDbContext>
    //       not the non-generic DbContextOptions
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Constructor: takes DbContextOptions<AppDbContext> (generic, not base DbContextOptions)")]
    public void AppDbContext_Constructor_ParameterIsGenericDbContextOptions()
    {
        // GIVEN: The AppDbContext constructor definition
        var constructors = typeof(AppDbContext).GetConstructors();

        // WHEN: Constructor parameters are inspected
        var primaryConstructor = constructors.FirstOrDefault();
        Assert.NotNull(primaryConstructor);

        var parameters = primaryConstructor!.GetParameters();

        // THEN: The constructor has exactly one parameter of type DbContextOptions<AppDbContext>
        Assert.Single(parameters);
        Assert.Equal(typeof(DbContextOptions<AppDbContext>), parameters[0].ParameterType);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Async disposal — DisposeAsync must not throw
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Async disposal: DisposeAsync completes without exception")]
    public async Task AppDbContext_WhenDisposedAsynchronously_DoesNotThrow()
    {
        // GIVEN: AppDbContext created with InMemory options
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: DisposeAsync is called (await using pattern)
        var exception = await Record.ExceptionAsync(async () =>
        {
            await using var ctx = new AppDbContext(options);
            _ = ctx.Model;
        });

        // THEN: Async disposal completes without exception
        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: AppDbContext.Database.ProviderName when using InMemory
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P2] Provider name: InMemory provider name is not null when using UseInMemoryDatabase")]
    public void AppDbContext_WithInMemoryOptions_DatabaseProviderNameIsNotNull()
    {
        // GIVEN: AppDbContext configured with InMemory database for testing
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var ctx = new AppDbContext(options);

        // WHEN: ProviderName is accessed
        var providerName = ctx.Database.ProviderName;

        // THEN: Provider name is set (not null) — InMemory provider is active
        Assert.NotNull(providerName);
        Assert.Contains("InMemory", providerName, StringComparison.OrdinalIgnoreCase);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: AppDbContext is not abstract and can be instantiated directly
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P2] Concreteness: AppDbContext is not abstract (must be directly instantiable by DI)")]
    public void AppDbContext_IsNotAbstractClass()
    {
        // GIVEN: The AppDbContext type
        // WHEN: Abstract flag is checked
        // THEN: AppDbContext is concrete (DI container requires concrete types or factory registrations)
        Assert.False(typeof(AppDbContext).IsAbstract);
    }
}
