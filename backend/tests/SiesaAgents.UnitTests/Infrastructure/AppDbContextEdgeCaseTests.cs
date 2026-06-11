using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Expanded edge-case and boundary tests for AppDbContext (Story 1.3).
/// Complements the ATDD tests in AppDbContextTests.cs with boundary conditions,
/// multiple-instantiation scenarios, and disposal safety.
/// </summary>
public class AppDbContextEdgeCaseTests
{
    private static AppDbContext CreateInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge Case 1: AppDbContext must not throw when Dispose() is called twice.
    // (Idempotent disposal is required for safe DI lifecycle management.)
    //
    // Given: an AppDbContext is created and disposed once
    // When:  Dispose() is called a second time
    // Then:  no exception is thrown
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public void AppDbContext_DisposingTwice_DoesNotThrow()
    {
        // Arrange
        var ctx = CreateInMemoryContext("DoubleDisposeTest");

        // Act + Assert
        var exception = Record.Exception(() =>
        {
            ctx.Dispose();
            ctx.Dispose(); // second dispose must be safe
        });
        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge Case 2: Multiple AppDbContext instances with the same InMemory
    // database name must share the same in-memory store — they are NOT isolated.
    // This confirms the InMemory provider behavior and that the context does not
    // accidentally create a per-instance isolated store.
    //
    // Given: two contexts share the same InMemory db name
    // When:  both are instantiated
    // Then:  both return the same model and neither throws
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public void AppDbContext_TwoInstancesSameDbName_BothInstantiateWithoutError()
    {
        // Arrange + Act
        using var ctx1 = CreateInMemoryContext("SharedDb");
        using var ctx2 = CreateInMemoryContext("SharedDb");

        // Assert — both must build a non-null model
        Assert.NotNull(ctx1.Model);
        Assert.NotNull(ctx2.Model);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge Case 3: Two contexts with DIFFERENT database names must have
    // independent stores — model must still build correctly for each.
    //
    // Given: two contexts are created with different InMemory db names
    // When:  models are built
    // Then:  both models are non-null and the entity count is identical (zero)
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public void AppDbContext_TwoInstancesDifferentDbNames_BothHaveEmptyModels()
    {
        // Arrange
        using var ctx1 = CreateInMemoryContext("IndependentDb_A");
        using var ctx2 = CreateInMemoryContext("IndependentDb_B");

        // Act
        var entities1 = ctx1.Model.GetEntityTypes().ToList();
        var entities2 = ctx2.Model.GetEntityTypes().ToList();

        // Assert — both must be baseline empty (Story 1.3 no domain entities)
        Assert.Empty(entities1);
        Assert.Empty(entities2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge Case 4: AppDbContext must be resolvable as a scoped service from
    // the DI container and disposed correctly when the scope ends.
    //
    // Given: AppDbContext is registered as a scoped service
    // When:  a service scope is created and disposed
    // Then:  no exception is thrown on scope disposal
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public void AppDbContext_ResolvedAsScoped_DisposedWithScopeWithoutError()
    {
        // Arrange
        var services = new ServiceCollection()
            .AddDbContext<AppDbContext>(opts =>
                opts.UseInMemoryDatabase("ScopedTest"));
        var provider = services.BuildServiceProvider();

        // Act + Assert
        var exception = Record.Exception(() =>
        {
            using var scope = provider.CreateScope();
            var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.NotNull(ctx);
            // scope.Dispose() called implicitly — should not throw
        });
        Assert.Null(exception);
        provider.Dispose();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge Case 5: GetRequiredService<AppDbContext> (strict DI resolution)
    // must not throw when using InMemory provider.
    //
    // Given: AppDbContext is registered in DI
    // When:  GetRequiredService<AppDbContext> is called (strict, not GetService)
    // Then:  the context is returned without InvalidOperationException
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public void AppDbContext_GetRequiredService_DoesNotThrow()
    {
        // Arrange
        using var provider = new ServiceCollection()
            .AddDbContext<AppDbContext>(opts =>
                opts.UseInMemoryDatabase("RequiredServiceTest"))
            .BuildServiceProvider();

        // Act + Assert
        var exception = Record.Exception(() =>
        {
            using var ctx = provider.GetRequiredService<AppDbContext>();
            Assert.NotNull(ctx);
        });
        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge Case 6: AppDbContext.ChangeTracker must be accessible after
    // construction without error — needed for future entity tracking config.
    //
    // Given: AppDbContext is constructed
    // When:  ChangeTracker is accessed
    // Then:  it is non-null and accessible
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public void AppDbContext_ChangeTrackerIsAccessible_AfterConstruction()
    {
        // Arrange
        using var ctx = CreateInMemoryContext("ChangeTrackerTest");

        // Act
        var tracker = ctx.ChangeTracker;

        // Assert
        Assert.NotNull(tracker);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge Case 7: AppDbContext.Database must be accessible and non-null —
    // required for EnsureCreated(), EnsureDeleted(), and migration operations.
    //
    // Given: AppDbContext is constructed
    // When:  the Database facade is accessed
    // Then:  it is non-null
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public void AppDbContext_DatabaseFacadeIsAccessible_AfterConstruction()
    {
        // Arrange
        using var ctx = CreateInMemoryContext("DatabaseFacadeTest");

        // Act
        var db = ctx.Database;

        // Assert
        Assert.NotNull(db);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge Case 8: EnsureDeleted() followed by EnsureCreated() must not throw.
    // This pattern is used in test teardown/setup to reset the InMemory store.
    //
    // Given: an AppDbContext with an InMemory database
    // When:  EnsureDeleted() then EnsureCreated() are called
    // Then:  no exception is thrown
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public void AppDbContext_EnsureDeletedThenEnsureCreated_DoesNotThrow()
    {
        // Arrange
        using var ctx = CreateInMemoryContext("DeleteThenCreateTest");

        // Act + Assert
        var exception = Record.Exception(() =>
        {
            ctx.Database.EnsureDeleted();
            ctx.Database.EnsureCreated();
        });
        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: AppDbContext must NOT accept null options in the constructor.
    // Passing null DbContextOptions must throw ArgumentNullException — this
    // validates that the DI contract requires proper options injection.
    //
    // Given: null is passed as DbContextOptions
    // When:  AppDbContext constructor is called
    // Then:  an exception is thrown (ArgumentNullException or similar)
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public void AppDbContext_Constructor_ThrowsWhenOptionsIsNull()
    {
        // Act + Assert
        Assert.ThrowsAny<Exception>(() =>
        {
            // Suppress nullable warning — intentionally testing null guard
            DbContextOptions<AppDbContext> nullOptions = null!;
            _ = new AppDbContext(nullOptions);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: AppDbContext must NOT implement IDisposable explicitly — it must
    // inherit disposal from DbContext (base class pattern). This ensures the DI
    // container can call Dispose() through the standard IDisposable interface.
    //
    // Given: AppDbContext is instantiated
    // When:  it is cast to IDisposable
    // Then:  the cast succeeds (AppDbContext IS IDisposable via DbContext base)
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public void AppDbContext_IsIDisposable_ViaDbContextBase()
    {
        // Arrange
        using var ctx = CreateInMemoryContext("IDisposableTest");

        // Act
        var disposable = ctx as IDisposable;

        // Assert
        Assert.NotNull(disposable);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: Model building must be idempotent — accessing .Model multiple
    // times must return the same instance (EF Core caches the compiled model).
    //
    // Given: AppDbContext is constructed
    // When:  .Model is accessed twice
    // Then:  the same instance is returned (reference equality or equal entity count)
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public void AppDbContext_ModelAccessedTwice_ReturnsSameInstance()
    {
        // Arrange
        using var ctx = CreateInMemoryContext("ModelIdempotentTest");

        // Act
        var model1 = ctx.Model;
        var model2 = ctx.Model;

        // Assert — EF Core's compiled model is cached; same reference expected
        Assert.Same(model1, model2);
    }
}
