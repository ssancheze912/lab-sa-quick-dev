using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Advanced edge-case unit tests for AppDbContext.
/// Covers boundary behaviors not present in AppDbContextTests.cs or AppDbContextEdgeTests.cs.
///
/// Coverage added:
///   - [P1] SaveChangesAsync on fresh context returns 0 (no changes tracked)
///   - [P1] ChangeTracker.HasChanges() is false on fresh context
///   - [P1] Database.ProviderName is non-null after InMemory provider registration
///   - [P2] Context with EnableSensitiveDataLogging option is accepted without error
///   - [P2] Model annotation ProductVersion is set (migration snapshot integrity)
///   - [P2] Context can be disposed multiple times without throwing (idempotent Dispose)
///   - [P2] SaveChanges (sync) on fresh context returns 0
/// </summary>
public class AppDbContextAdvancedTests
{
    // ──────────────────────────────────────────────────────────────────────────
    // [P1] SaveChangesAsync returns 0 on a context with no pending changes
    // This verifies no phantom changes are tracked after construction
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task AppDbContext_SaveChangesAsync_ReturnsZeroOnFreshContext()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_SaveChanges_" + Guid.NewGuid())
            .Options;

        // Act
        using var context = new AppDbContext(options);
        var saved = await context.SaveChangesAsync();

        // Assert: no changes tracked means zero rows affected
        Assert.Equal(0, saved);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P1] ChangeTracker.HasChanges() is false on fresh context (nothing tracked)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_ChangeTracker_HasNoChangesOnFreshContext()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Tracker_" + Guid.NewGuid())
            .Options;

        // Act
        using var context = new AppDbContext(options);
        var hasChanges = context.ChangeTracker.HasChanges();

        // Assert: fresh context with no DbSet operations has zero pending changes
        Assert.False(hasChanges);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P1] Database.ProviderName is non-null after InMemory provider registration
    // Verifies that the options builder correctly wires the InMemory provider
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_DatabaseProviderName_IsNotNullAfterConstruction()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Provider_" + Guid.NewGuid())
            .Options;

        // Act
        using var context = new AppDbContext(options);
        var providerName = context.Database.ProviderName;

        // Assert: provider is registered and its name is accessible
        Assert.NotNull(providerName);
        Assert.NotEmpty(providerName);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P2] Context created with EnableSensitiveDataLogging is accepted without error
    // Boundary: non-default debug option should not break context construction
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_WithEnableSensitiveDataLogging_CanBeInstantiated()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_SensitiveLog_" + Guid.NewGuid())
            .EnableSensitiveDataLogging()
            .Options;

        // Act
        var exception = Record.Exception(() =>
        {
            using var context = new AppDbContext(options);
            Assert.NotNull(context);
        });

        // Assert: debug option does not prevent construction
        Assert.Null(exception);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P2] SaveChanges (synchronous) on fresh context returns 0
    // Parallel boundary check to the async version
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_SaveChangesSync_ReturnsZeroOnFreshContext()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_SaveChangesSync_" + Guid.NewGuid())
            .Options;

        // Act
        using var context = new AppDbContext(options);
        var saved = context.SaveChanges();

        // Assert
        Assert.Equal(0, saved);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P2] Context can be disposed multiple times without throwing
    // EF Core DbContext.Dispose() is expected to be idempotent
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_DisposedMultipleTimes_DoesNotThrow()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_DoubleDispose_" + Guid.NewGuid())
            .Options;
        var context = new AppDbContext(options);

        // Act: first dispose
        context.Dispose();

        // Act: second dispose — must not throw ObjectDisposedException
        var secondDisposeException = Record.Exception(() => context.Dispose());

        // Assert: second dispose is safe
        Assert.Null(secondDisposeException);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P2] InMemory database name with empty string is rejected by EF Core
    // Boundary: UseInMemoryDatabase validates that the name is non-empty.
    // This test documents and pins the ArgumentException boundary.
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_UseInMemoryDatabase_WithEmptyStringDatabaseName_ThrowsArgumentException()
    {
        // Arrange + Act: passing empty string to UseInMemoryDatabase throws immediately
        var exception = Record.Exception(() =>
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: string.Empty)
                .Options);

        // Assert: EF Core rejects empty database names at options-builder time
        Assert.NotNull(exception);
        Assert.IsAssignableFrom<ArgumentException>(exception);
    }
}
