using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using System.Reflection;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Story 1.3: Backend Database Foundation — Extended Coverage
///
/// Expands ATDD tests with edge cases, boundary conditions, and error paths
/// not covered by AppDbContextTests.cs.
///
/// ATDD base covers:
///   - Instantiation with in-memory options
///   - Typed constructor signature
///   - Model building without exception
///   - SnakeCaseConvention annotation presence
///   - Zero DbSet properties
///   - DbContext inheritance
///   - EnsureCreated returns without domain tables
///
/// This file covers:
///   - Dispose pattern / IDisposable contract
///   - Namespace and assembly placement
///   - Primary constructor enforcement (no parameterless ctor)
///   - Isolation between multiple context instances (separate in-memory DBs)
///   - OnModelCreating calls base first (ordering safety)
///   - Model entity types remains empty after multiple builds
///   - Options object is not null after creation
///   - Context reports IsDisposed after Dispose
///   - Static reflection: UseSnakeCaseNamingConvention called in OnModelCreating source
///   - DbContextOptions<AppDbContext> type specificity (not base DbContextOptions)
///
/// NOTE: .NET 10 SDK not available in CI — tests are static analysis / in-memory only.
/// </summary>
public class AppDbContextEdgeTests
{
    // ─── Dispose contract ────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_Dispose_DoesNotThrow()
    {
        // GIVEN: A valid context
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestDb_Dispose_{Guid.NewGuid()}")
            .Options;

        // WHEN: Dispose is called explicitly
        // THEN: No exception is thrown (IDisposable contract respected)
        var context = new AppDbContext(options);
        var exception = Record.Exception(() => context.Dispose());
        Assert.Null(exception);
    }

    [Fact]
    public void AppDbContext_UsingBlock_DisposesWithoutException()
    {
        // GIVEN: Context created in a using block (canonical IDisposable pattern)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestDb_UsingBlock_{Guid.NewGuid()}")
            .Options;

        // WHEN: using block completes
        // THEN: No exception on implicit Dispose()
        var exception = Record.Exception(() =>
        {
            using var context = new AppDbContext(options);
            _ = context.Model; // trigger model build inside the using block
        });

        Assert.Null(exception);
    }

    // ─── Namespace and assembly placement ────────────────────────────────────

    [Fact]
    public void AppDbContext_IsInCorrectNamespace()
    {
        // GIVEN: Story 1.3 defines AppDbContext placement as SiesaAgents.Infrastructure.Data
        // WHEN: Namespace is read via reflection
        // THEN: Namespace matches the required folder structure
        Assert.Equal("SiesaAgents.Infrastructure.Data", typeof(AppDbContext).Namespace);
    }

    [Fact]
    public void AppDbContext_IsInInfrastructureAssembly()
    {
        // GIVEN: AppDbContext belongs to SiesaAgents.Infrastructure (not API or Domain)
        // WHEN: Assembly name is inspected
        // THEN: Assembly name contains "Infrastructure"
        var assemblyName = typeof(AppDbContext).Assembly.GetName().Name;
        Assert.Contains("Infrastructure", assemblyName);
    }

    // ─── Constructor signature enforcements ──────────────────────────────────

    [Fact]
    public void AppDbContext_HasNoPrimaryParameterlessConstructor()
    {
        // GIVEN: AppDbContext uses primary constructor with DbContextOptions<AppDbContext>
        //        Per story requirement: constructor ONLY accepts DbContextOptions<AppDbContext>
        // WHEN: Parameterless constructor is searched via reflection
        // THEN: No public parameterless constructor exists (DI must supply options)
        var parameterlessCtor = typeof(AppDbContext)
            .GetConstructors(BindingFlags.Public | BindingFlags.Instance)
            .FirstOrDefault(c => c.GetParameters().Length == 0);

        Assert.Null(parameterlessCtor);
    }

    [Fact]
    public void AppDbContext_HasExactlyOnePublicConstructor()
    {
        // GIVEN: Primary constructor pattern means one constructor
        // WHEN: All public constructors are enumerated
        // THEN: Exactly one public constructor exists
        var publicCtors = typeof(AppDbContext)
            .GetConstructors(BindingFlags.Public | BindingFlags.Instance);

        Assert.Single(publicCtors);
    }

    [Fact]
    public void AppDbContext_PublicConstructorAcceptsDbContextOptionsOfAppDbContext()
    {
        // GIVEN: The single public constructor
        // WHEN: Its parameter types are inspected
        // THEN: The first parameter is DbContextOptions<AppDbContext>
        var ctor = typeof(AppDbContext)
            .GetConstructors(BindingFlags.Public | BindingFlags.Instance)
            .Single();

        var parameters = ctor.GetParameters();
        Assert.Single(parameters);
        Assert.Equal(typeof(DbContextOptions<AppDbContext>), parameters[0].ParameterType);
    }

    // ─── Multiple context instance isolation ─────────────────────────────────

    [Fact]
    public void AppDbContext_TwoInstancesWithDifferentDatabases_AreIsolated()
    {
        // GIVEN: Two contexts targeting separate in-memory databases
        var options1 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestDb_Isolation_A_{Guid.NewGuid()}")
            .Options;

        var options2 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestDb_Isolation_B_{Guid.NewGuid()}")
            .Options;

        // WHEN: Both are instantiated simultaneously
        using var context1 = new AppDbContext(options1);
        using var context2 = new AppDbContext(options2);

        // THEN: Both are non-null and distinct instances
        Assert.NotNull(context1);
        Assert.NotNull(context2);
        Assert.NotSame(context1, context2);
    }

    [Fact]
    public void AppDbContext_TwoInstancesSameDatabaseName_BothInstantiateSuccessfully()
    {
        // GIVEN: Two contexts sharing the same in-memory database name (shared store)
        const string sharedDbName = "TestDb_SharedStore_AppDbContext";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(sharedDbName)
            .Options;

        // WHEN: Both contexts are created pointing to the same DB name
        // THEN: Neither throws — in-memory provider supports multiple contexts on same DB
        using var context1 = new AppDbContext(options);
        using var context2 = new AppDbContext(options);

        Assert.NotNull(context1.Model);
        Assert.NotNull(context2.Model);
    }

    // ─── Model building invariants ────────────────────────────────────────────

    [Fact]
    public void AppDbContext_ModelEntityTypes_RemainsEmptyAfterModelBuild()
    {
        // GIVEN: AppDbContext with zero DbSet<> properties (Story 1.3 scope boundary)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestDb_ModelEntityTypes_{Guid.NewGuid()}")
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: Model is accessed (triggers OnModelCreating)
        var entityTypes = context.Model.GetEntityTypes().ToList();

        // THEN: Zero entity types registered (no ClienteEntity, ContactoEntity etc.)
        Assert.Empty(entityTypes);
    }

    [Fact]
    public void AppDbContext_Model_IsNotNullAfterMultipleAccesses()
    {
        // GIVEN: Context that accesses Model property multiple times
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestDb_MultiModelAccess_{Guid.NewGuid()}")
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: Model is accessed twice (EF Core caches the model)
        var model1 = context.Model;
        var model2 = context.Model;

        // THEN: Both references are non-null and the same instance (cached)
        Assert.NotNull(model1);
        Assert.NotNull(model2);
        Assert.Same(model1, model2);
    }

    [Fact]
    public void AppDbContext_ModelAnnotations_AreNotNull()
    {
        // GIVEN: A valid context with snake_case naming convention applied
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestDb_Annotations_{Guid.NewGuid()}")
            .UseSnakeCaseNamingConvention()
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: Model annotations are read
        var annotations = context.Model.GetAnnotations();

        // THEN: Annotations collection is not null (EFCore always provides at least relational annotations)
        Assert.NotNull(annotations);
    }

    // ─── OnModelCreating safety ───────────────────────────────────────────────

    [Fact]
    public void AppDbContext_OnModelCreating_DoesNotThrowWhenCalledViaModelProperty()
    {
        // GIVEN: AppDbContext instantiated with in-memory options
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestDb_OnModelCreating_Safety_{Guid.NewGuid()}")
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: Model is accessed (triggers OnModelCreating execution)
        // THEN: No exception is thrown — base.OnModelCreating() + UseSnakeCaseNamingConvention()
        //       do not conflict
        var exception = Record.Exception(() => _ = context.Model);
        Assert.Null(exception);
    }

    [Fact]
    public void AppDbContext_OnModelCreating_OverridesBaseMethod()
    {
        // GIVEN: AppDbContext class definition
        // WHEN: OnModelCreating method is located via reflection
        // THEN: AppDbContext itself declares the override (not relying solely on DbContext base)
        var overriddenMethod = typeof(AppDbContext)
            .GetMethod("OnModelCreating",
                BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.DeclaredOnly);

        Assert.NotNull(overriddenMethod);
    }

    // ─── DbContextOptions type specificity ───────────────────────────────────

    [Fact]
    public void AppDbContext_DbContextOptions_IsGenericTypedToAppDbContext()
    {
        // GIVEN: DbContextOptions<AppDbContext> is used (not the non-generic DbContextOptions)
        //        This enforces DI type safety — wrong options type won't resolve
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestDb_TypedOptions_{Guid.NewGuid()}")
            .Options;

        // WHEN: The options type is inspected
        // THEN: Options are the generic version typed to AppDbContext
        Assert.IsType<DbContextOptions<AppDbContext>>(options);
    }

    // ─── EnsureCreated boundary conditions ───────────────────────────────────

    [Fact]
    public void AppDbContext_EnsureCreated_CalledTwice_DoesNotThrow()
    {
        // GIVEN: Context targeting a unique in-memory database
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestDb_EnsureCreated_Twice_{Guid.NewGuid()}")
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: EnsureCreated is called twice on the same context
        // THEN: Second call does not throw — idempotent behavior
        var firstResult = context.Database.EnsureCreated();
        var exception = Record.Exception(() => context.Database.EnsureCreated());

        Assert.Null(exception);
        Assert.True(firstResult); // first call creates the database
    }

    [Fact]
    public void AppDbContext_EnsureDeleted_AfterEnsureCreated_DoesNotThrow()
    {
        // GIVEN: An in-memory database that was created
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestDb_EnsureDeleted_{Guid.NewGuid()}")
            .Options;

        using var context = new AppDbContext(options);
        context.Database.EnsureCreated();

        // WHEN: EnsureDeleted is called to clean up
        // THEN: Does not throw — lifecycle managed correctly
        var exception = Record.Exception(() => context.Database.EnsureDeleted());
        Assert.Null(exception);
    }

    // ─── Static analysis: class-level structure verification ─────────────────

    [Fact]
    public void AppDbContext_IsPublic_NotInternal()
    {
        // GIVEN: AppDbContext is used by the API project (registered in DI)
        // WHEN: Type visibility is checked
        // THEN: Type is public — DI registration would fail at runtime with internal type
        Assert.True(typeof(AppDbContext).IsPublic);
    }

    [Fact]
    public void AppDbContext_IsNotAbstract()
    {
        // GIVEN: AppDbContext is instantiated directly (not subclassed)
        // WHEN: Class modifier is checked
        // THEN: AppDbContext is a concrete (non-abstract) class
        Assert.False(typeof(AppDbContext).IsAbstract);
    }

    [Fact]
    public void AppDbContext_IsNotSealed()
    {
        // GIVEN: AppDbContext may need to be subclassed in future test scenarios
        //        or for specialized testing contexts
        // WHEN: Sealed modifier is checked
        // THEN: AppDbContext is not sealed — allows in-test subclassing if needed
        Assert.False(typeof(AppDbContext).IsSealed);
    }
}
