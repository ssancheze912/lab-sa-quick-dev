using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using System.Reflection;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Story 1.3: Backend Database Foundation — Model Building and Static Structure
///
/// Covers model building invariants, OnModelCreating safety, DbContextOptions type
/// specificity, EnsureCreated boundary conditions, and class-level structure checks.
///
/// Split from AppDbContextEdgeTests.cs to comply with the 300-line file size limit.
/// </summary>
public class AppDbContextStructureTests
{
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
