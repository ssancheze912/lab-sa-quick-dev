using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Edge-case and boundary condition tests for AppDbContext.
/// Expands ATDD coverage with error paths and boundary conditions
/// not covered by the acceptance tests in AppDbContextTests.cs.
/// </summary>
public class AppDbContextEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────
    // Type contract – sealed, inheritance, DbContext base
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_IsSealed()
    {
        // GIVEN: The AppDbContext type
        var type = typeof(AppDbContext);

        // WHEN: Checking if the class is sealed
        var isSealed = type.IsSealed;

        // THEN: AppDbContext must be sealed to prevent unintended subclassing
        Assert.True(isSealed, "AppDbContext must be sealed");
    }

    [Fact]
    public void AppDbContext_InheritsFromDbContext()
    {
        // GIVEN: The AppDbContext type
        var type = typeof(AppDbContext);

        // WHEN: Checking the base type
        var inheritsFromDbContext = typeof(DbContext).IsAssignableFrom(type);

        // THEN: AppDbContext must inherit from DbContext
        Assert.True(inheritsFromDbContext, "AppDbContext must inherit from DbContext");
    }

    // ─────────────────────────────────────────────────────────────────────
    // SaveChangesAsync – boundary: zero changes
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task SaveChangesAsync_WhenNoChangesExist_ReturnsZero()
    {
        // GIVEN: AppDbContext with an empty in-memory database (no tracked entities changed)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        using var context = new AppDbContext(options);

        // WHEN: SaveChangesAsync is called without any tracked changes
        var result = await context.SaveChangesAsync(CancellationToken.None);

        // THEN: Result must be exactly 0 (no rows affected)
        Assert.Equal(0, result);
    }

    // ─────────────────────────────────────────────────────────────────────
    // SaveChangesAsync – cancellation token: already cancelled
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task SaveChangesAsync_WhenCancellationTokenAlreadyCancelled_ThrowsOperationCanceledException()
    {
        // GIVEN: AppDbContext with an already-cancelled CancellationToken
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        using var context = new AppDbContext(options);
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        // WHEN / THEN: SaveChangesAsync must propagate OperationCanceledException
        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => context.SaveChangesAsync(cts.Token));
    }

    // ─────────────────────────────────────────────────────────────────────
    // Disposal – ObjectDisposedException on use after dispose
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task SaveChangesAsync_AfterDispose_ThrowsObjectDisposedException()
    {
        // GIVEN: AppDbContext that has been disposed
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var context = new AppDbContext(options);
        await context.DisposeAsync();

        // WHEN / THEN: Calling SaveChangesAsync after dispose must throw ObjectDisposedException
        await Assert.ThrowsAsync<ObjectDisposedException>(
            () => context.SaveChangesAsync(CancellationToken.None));
    }

    // ─────────────────────────────────────────────────────────────────────
    // IApplicationDbContext – interface via DI-style cast
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task IApplicationDbContext_SaveChangesAsync_WhenCalledViaInterface_ReturnsZeroForNoChanges()
    {
        // GIVEN: AppDbContext resolved as IApplicationDbContext (simulates DI usage)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        using var context = new AppDbContext(options);
        IApplicationDbContext dbContext = context;

        // WHEN: SaveChangesAsync is called via the interface with no tracked changes
        var result = await dbContext.SaveChangesAsync(CancellationToken.None);

        // THEN: Returns 0 — no rows affected
        Assert.Equal(0, result);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Multiple instances – each context instance is independent
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_TwoIndependentInstances_DoNotShareState()
    {
        // GIVEN: Two AppDbContext instances backed by different in-memory databases
        var options1 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var options2 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: Both contexts are created
        using var ctx1 = new AppDbContext(options1);
        using var ctx2 = new AppDbContext(options2);

        // THEN: Both contexts should be non-null and independent (not the same reference)
        Assert.NotNull(ctx1);
        Assert.NotNull(ctx2);
        Assert.NotSame(ctx1, ctx2);
    }

    // ─────────────────────────────────────────────────────────────────────
    // IApplicationDbContext – interface has exactly one method (SaveChangesAsync)
    // and no extra interface members appear as the story evolves
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void IApplicationDbContext_HasExactlyOneMethod()
    {
        // GIVEN: The IApplicationDbContext interface
        var interfaceType = typeof(IApplicationDbContext);

        // WHEN: Counting declared methods
        var methodCount = interfaceType.GetMethods().Length;

        // THEN: Exactly one method should exist (SaveChangesAsync)
        Assert.Equal(1, methodCount);
    }

    [Fact]
    public void IApplicationDbContext_SaveChangesAsyncMethod_ReturnsTaskOfInt()
    {
        // GIVEN: The IApplicationDbContext interface
        var interfaceType = typeof(IApplicationDbContext);

        // WHEN: Inspecting the SaveChangesAsync method return type
        var method = interfaceType.GetMethod("SaveChangesAsync");

        // THEN: Return type must be Task<int>
        Assert.NotNull(method);
        Assert.Equal(typeof(Task<int>), method.ReturnType);
    }

    [Fact]
    public void IApplicationDbContext_SaveChangesAsyncMethod_HasCancellationTokenParameter()
    {
        // GIVEN: The IApplicationDbContext interface
        var interfaceType = typeof(IApplicationDbContext);

        // WHEN: Inspecting the SaveChangesAsync method parameter
        var method = interfaceType.GetMethod("SaveChangesAsync");
        var parameters = method?.GetParameters();

        // THEN: Must have exactly one parameter of type CancellationToken
        Assert.NotNull(parameters);
        Assert.Single(parameters);
        Assert.Equal(typeof(CancellationToken), parameters[0].ParameterType);
    }

    // ─────────────────────────────────────────────────────────────────────
    // OnModelCreating – can be called multiple times via model cache (idempotent)
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_Model_AccessedMultipleTimes_DoesNotThrow()
    {
        // GIVEN: AppDbContext backed by in-memory database
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        using var context = new AppDbContext(options);

        // WHEN: Model is accessed multiple times (EF caches it — idempotency check)
        var exception = Record.Exception(() =>
        {
            var model1 = context.Model;
            var model2 = context.Model;
            Assert.Same(model1, model2);
        });

        // THEN: No exception is thrown; model reference is stable
        Assert.Null(exception);
    }
}
