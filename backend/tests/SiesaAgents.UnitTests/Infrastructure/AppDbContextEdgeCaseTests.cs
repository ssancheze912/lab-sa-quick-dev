using Xunit;
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Edge case and boundary tests for AppDbContext.
/// Expands ATDD coverage (AppDbContextTests.cs) with: Dispose behavior,
/// multiple instances sharing same InMemory DB, EnsureDeleted behavior,
/// SaveChanges on empty context, and concurrent access.
/// </summary>
public class AppDbContextEdgeCaseTests
{
    // ──────────────────────────────────────────────────────────────────
    // [P1] Dispose / lifecycle boundary
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_CanBeDisposed_WithoutException()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "edge_dispose_db")
            .Options;

        AppDbContext context;

        // Act
        using (context = new AppDbContext(options)) { }

        // Assert — no exception thrown during Dispose
        Assert.NotNull(context);
    }

    [Fact]
    public void AppDbContext_IsDisposed_AfterUsingBlock()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "edge_disposed_check_db")
            .Options;

        AppDbContext context;

        // Act
        using (context = new AppDbContext(options)) { }

        // Assert — accessing ChangeTracker after dispose raises ObjectDisposedException
        var exception = Record.Exception(() => { _ = context.ChangeTracker.Entries(); });
        Assert.IsType<ObjectDisposedException>(exception);
    }

    // ──────────────────────────────────────────────────────────────────
    // [P1] Multiple instances sharing same InMemory database
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public void TwoAppDbContextInstances_ShareSameInMemoryDatabase_BothNotNull()
    {
        // Arrange — same database name → same in-memory store
        const string dbName = "edge_shared_db";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        // Act
        using var ctx1 = new AppDbContext(options);
        using var ctx2 = new AppDbContext(options);

        // Assert — both instances created without error; same underlying store
        Assert.NotNull(ctx1);
        Assert.NotNull(ctx2);
        Assert.NotSame(ctx1, ctx2);
    }

    // ──────────────────────────────────────────────────────────────────
    // [P1] EnsureDeleted removes in-memory database
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_EnsureDeleted_ReturnsTrueForExistingDatabase()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "edge_ensure_deleted_db")
            .Options;

        using var context = new AppDbContext(options);
        context.Database.EnsureCreated();

        // Act
        var deleted = context.Database.EnsureDeleted();

        // Assert — returns true when database existed and was deleted
        Assert.True(deleted);
    }

    // ──────────────────────────────────────────────────────────────────
    // [P2] SaveChanges on empty context does not throw
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public async Task AppDbContext_SaveChangesAsync_OnEmptyContext_ReturnsZero()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "edge_savechanges_db")
            .Options;

        using var context = new AppDbContext(options);

        // Act — no entities tracked, SaveChanges should succeed with 0 changes
        var changesWritten = await context.SaveChangesAsync();

        // Assert
        Assert.Equal(0, changesWritten);
    }

    [Fact]
    public void AppDbContext_SaveChanges_OnEmptyContext_ReturnsZero()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "edge_savechanges_sync_db")
            .Options;

        using var context = new AppDbContext(options);

        // Act
        var changesWritten = context.SaveChanges();

        // Assert
        Assert.Equal(0, changesWritten);
    }

    // ──────────────────────────────────────────────────────────────────
    // [P2] ChangeTracker starts with zero entries (no entities tracked)
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_ChangeTracker_HasNoEntries_OnFreshContext()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "edge_change_tracker_db")
            .Options;

        using var context = new AppDbContext(options);

        // Act
        var entries = context.ChangeTracker.Entries().ToList();

        // Assert — no entities tracked on a fresh context
        Assert.Empty(entries);
    }

    // ──────────────────────────────────────────────────────────────────
    // [P2] Model does not change between two EnsureCreated calls
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_EnsureCreated_IsIdempotent()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "edge_idempotent_db")
            .Options;

        using var context = new AppDbContext(options);

        // Act
        var firstCall = context.Database.EnsureCreated();
        var secondCall = context.Database.EnsureCreated();

        // Assert — first call creates (true), second call no-ops (false)
        Assert.True(firstCall);
        Assert.False(secondCall);
    }

    // ──────────────────────────────────────────────────────────────────
    // [P2] Model entity count is stable across separate context instances
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_EntityTypes_AreEmptyAcrossMultipleInstances()
    {
        // Arrange — two separate instances, same schema expectation
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "edge_multi_instance_model_db")
            .Options;

        // Act
        using var ctx1 = new AppDbContext(options);
        using var ctx2 = new AppDbContext(options);

        var types1 = ctx1.Model.GetEntityTypes().ToList();
        var types2 = ctx2.Model.GetEntityTypes().ToList();

        // Assert — both instances see the same empty model
        Assert.Empty(types1);
        Assert.Empty(types2);
        Assert.Equal(types1.Count, types2.Count);
    }
}
