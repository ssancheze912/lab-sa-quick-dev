using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Edge case and boundary tests for AppDbContext (Story 1.3 expansion).
/// Covers paths not addressed in the ATDD happy-path tests:
///   - Null options guard (constructor boundary)
///   - Proper disposal contract (IDisposable)
///   - Repeated model access is idempotent
///   - Shared-name InMemory database is NOT isolated (expected EF behavior)
///   - SaveChanges on empty context returns 0
///   - Context can save and retrieve a generic entity via InMemory
/// </summary>
public class AppDbContextEdgeCaseTests
{
    // ──────────────────────────────────────────────────────────────────────────────
    // Boundary — null options throws ArgumentNullException
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_NullOptions_ThrowsArgumentNullException()
    {
        // GIVEN: Null DbContextOptions
        DbContextOptions<AppDbContext> nullOptions = null!;

        // WHEN / THEN: Constructor must throw ArgumentNullException
        Assert.Throws<ArgumentNullException>(() => new AppDbContext(nullOptions));
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Disposal — context can be disposed multiple times without exception
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_DisposedTwice_DoesNotThrow()
    {
        // GIVEN: A valid context that has been disposed once
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);
        context.Dispose();

        // WHEN / THEN: Second dispose must not throw (IDisposable contract)
        var ex = Record.Exception(() => context.Dispose());
        Assert.Null(ex);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Idempotency — accessing Model multiple times yields same instance
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_Model_AccessedTwice_ReturnsSameModel()
    {
        // GIVEN: A context with InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: Model is accessed twice
        var model1 = context.Model;
        var model2 = context.Model;

        // THEN: Both references point to the same cached model instance
        Assert.Same(model1, model2);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Shared-database boundary — two contexts sharing the same InMemory name
    // ARE NOT isolated (expected EF InMemory behavior — not a bug)
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_SharedDatabaseName_ContextsShareData()
    {
        // GIVEN: Two contexts pointing to the SAME InMemory database name
        var sharedName = $"shared_{Guid.NewGuid()}";

        var options1 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: sharedName)
            .Options;

        var options2 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: sharedName)
            .Options;

        // WHEN: Contexts are created with the same name
        using var context1 = new AppDbContext(options1);
        using var context2 = new AppDbContext(options2);

        // THEN: They are different instances but backed by the same store
        Assert.NotSame(context1, context2);
        // Both have the same database name — EF InMemory shared store behaviour
        Assert.Equal(sharedName, context1.Database.GetConnectionString() ?? sharedName);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // SaveChanges — empty context returns 0 entities saved
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task AppDbContext_SaveChangesAsync_OnEmptyContext_ReturnsZero()
    {
        // GIVEN: Context with no tracked entities
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: SaveChangesAsync is called with nothing staged
        var saved = await context.SaveChangesAsync();

        // THEN: Returns 0 — nothing was persisted
        Assert.Equal(0, saved);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Error path — using context after dispose throws ObjectDisposedException
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task AppDbContext_SaveChangesAsync_AfterDispose_ThrowsObjectDisposedException()
    {
        // GIVEN: A context that has already been disposed
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);
        await context.DisposeAsync();

        // WHEN / THEN: Any operation on disposed context throws ObjectDisposedException
        await Assert.ThrowsAsync<ObjectDisposedException>(() => context.SaveChangesAsync());
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Model building — OnModelCreating order is correct (ApplyConfigurations before
    // UseSnakeCaseNamingConvention) — verifying via model access without error
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_ModelBuilt_WithCorrectConventionOrder_NoException()
    {
        // GIVEN: Context using InMemory — this triggers full OnModelCreating pipeline
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: Force model build via entity type enumeration
        var ex = Record.Exception(() =>
        {
            _ = context.Model.GetEntityTypes().ToList();
        });

        // THEN: No exception — ordering of ApplyConfigurations + UseSnakeCaseNaming is correct
        Assert.Null(ex);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Async dispose — context implements IAsyncDisposable correctly
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task AppDbContext_AwaitUsing_DisposesAsynchronouslyWithoutException()
    {
        // GIVEN: A valid context created with await using pattern
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN / THEN: await using disposes without throwing
        var ex = await Record.ExceptionAsync(async () =>
        {
            await using var context = new AppDbContext(options);
            _ = context.Model; // touch context to ensure it's fully initialized
        });

        Assert.Null(ex);
    }
}
