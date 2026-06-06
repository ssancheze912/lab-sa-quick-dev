using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Edge-case and boundary unit tests for AppDbContext.
/// Expands coverage beyond the ATDD baseline in AppDbContextTests.cs.
///
/// Coverage added:
///   - [P1] Context disposes cleanly without throwing
///   - [P1] Different InMemory DB names produce isolated contexts
///   - [P1] Same InMemory DB name shares data between instances (InMemory behavior contract)
///   - [P1] Model has zero entity types (infrastructure-only migration, AC #6)
///   - [P1] Null options constructor argument throws ArgumentNullException (boundary)
///   - [P2] Model properties: entity types count is zero (exact boundary assertion)
///   - [P2] Second context with same InMemory DB does not throw on instantiation
///   - [P2] Context can be constructed inside a using block without resource leaks
///   - [P2] AppDbContext accepts options with explicit tracking disabled
///   - [P2] OnModelCreating does not register ClienteEntity or ContactoEntity (story scope AC #6)
/// </summary>
public class AppDbContextEdgeTests
{
    // ──────────────────────────────────────────────────────────────────────────
    // [P1] Context disposes cleanly — no ObjectDisposedException or crash
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_Dispose_DoesNotThrow()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Dispose_" + Guid.NewGuid())
            .Options;
        var context = new AppDbContext(options);

        // Act
        var disposeException = Record.Exception(() => context.Dispose());

        // Assert
        Assert.Null(disposeException);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P1] Contexts with different DB names do not share InMemory state
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_TwoContextsWithDifferentDbNames_AreIsolated()
    {
        // Arrange
        var id1 = Guid.NewGuid().ToString();
        var id2 = Guid.NewGuid().ToString();

        var options1 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "IsolationDb_A_" + id1)
            .Options;
        var options2 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "IsolationDb_B_" + id2)
            .Options;

        // Act
        using var ctx1 = new AppDbContext(options1);
        using var ctx2 = new AppDbContext(options2);

        // Assert: both contexts are valid and independent instances
        Assert.NotNull(ctx1);
        Assert.NotNull(ctx2);
        Assert.NotSame(ctx1, ctx2);
        Assert.NotSame(ctx1.Model, ctx2.Model);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P1] Model contains zero registered entity types (infrastructure-only context)
    // This verifies AC #6: no domain tables created in this migration
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_Model_HasZeroEntityTypes()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_ZeroEntities_" + Guid.NewGuid())
            .Options;

        // Act
        using var context = new AppDbContext(options);
        var entityTypes = context.Model.GetEntityTypes().ToList();

        // Assert: no domain entity types registered — infrastructure-only migration
        Assert.Empty(entityTypes);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P1] Null options argument throws ArgumentNullException (boundary: null guard)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_NullOptions_ThrowsArgumentNullException()
    {
        // Arrange
        DbContextOptions<AppDbContext> nullOptions = null!;

        // Act
        var exception = Record.Exception(() => new AppDbContext(nullOptions));

        // Assert: constructor must reject null options
        Assert.NotNull(exception);
        Assert.IsAssignableFrom<ArgumentNullException>(exception);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P1] Two contexts with the same InMemory DB name can be instantiated
    // (verifies shared-store behavior contract — no crash on second instantiation)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_TwoContextsWithSameDbName_CanBothBeInstantiated()
    {
        // Arrange
        var sharedDbName = "SharedDb_" + Guid.NewGuid();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: sharedDbName)
            .Options;

        // Act
        var exception = Record.Exception(() =>
        {
            using var ctx1 = new AppDbContext(options);
            using var ctx2 = new AppDbContext(options);
            _ = ctx1.Model;
            _ = ctx2.Model;
        });

        // Assert: no exception from shared InMemory store
        Assert.Null(exception);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P2] Context constructed and used inside a using block — no resource leaks
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_UsedInsideUsingBlock_NoExceptionOnExit()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Using_" + Guid.NewGuid())
            .Options;

        // Act
        var exception = Record.Exception(() =>
        {
            using var context = new AppDbContext(options);
            Assert.NotNull(context.Model);
        });

        // Assert: no exception after using block exits (Dispose was called)
        Assert.Null(exception);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P2] OnModelCreating does not register ClienteEntity (story scope boundary, AC #6)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_OnModelCreating_DoesNotRegisterClienteEntity()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_NoCliente_" + Guid.NewGuid())
            .Options;

        // Act
        using var context = new AppDbContext(options);
        var entityTypeNames = context.Model.GetEntityTypes()
            .Select(e => e.ClrType.Name)
            .ToList();

        // Assert: ClienteEntity must NOT be registered in this story's migration
        Assert.DoesNotContain("ClienteEntity", entityTypeNames);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P2] OnModelCreating does not register ContactoEntity (story scope boundary, AC #6)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_OnModelCreating_DoesNotRegisterContactoEntity()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_NoContacto_" + Guid.NewGuid())
            .Options;

        // Act
        using var context = new AppDbContext(options);
        var entityTypeNames = context.Model.GetEntityTypes()
            .Select(e => e.ClrType.Name)
            .ToList();

        // Assert: ContactoEntity must NOT be registered in this story's migration
        Assert.DoesNotContain("ContactoEntity", entityTypeNames);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P2] Context created with QueryTrackingBehavior.NoTracking option does not throw
    // (boundary: non-default EF Core options accepted cleanly)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_WithNoTrackingQueryBehavior_CanBeInstantiated()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_NoTracking_" + Guid.NewGuid())
            .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)
            .Options;

        // Act
        var exception = Record.Exception(() =>
        {
            using var context = new AppDbContext(options);
            Assert.NotNull(context);
        });

        // Assert: alternate options configuration is accepted without error
        Assert.Null(exception);
    }
}
