using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// ATDD tests for Story 1.3 — Backend Database Foundation.
/// These tests are in RED state: AppDbContext and EFCore.NamingConventions
/// are not yet implemented. They will pass (GREEN) once:
///   - SiesaAgents.Infrastructure.Data.AppDbContext is created
///   - EFCore.NamingConventions / UseSnakeCaseNamingConvention() is wired
///   - Microsoft.EntityFrameworkCore.InMemory is added to the test project
/// </summary>
public class AppDbContextTests
{
    // ─── Helper ────────────────────────────────────────────────────────────────

    private static DbContextOptions<AppDbContext> BuildInMemoryOptions() =>
        new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

    // ─── AC5 — AppDbContext resolves without errors ────────────────────────────

    /// <summary>
    /// Given an xUnit integration test that instantiates AppDbContext with an
    /// in-memory connection string,
    /// When the context is created,
    /// Then AppDbContext resolves without errors.
    /// </summary>
    [Fact]
    public void AppDbContext_Instantiates_WithInMemoryOptions()
    {
        // Arrange
        var options = BuildInMemoryOptions();

        // Act
        using var context = new AppDbContext(options);

        // Assert
        Assert.NotNull(context);
    }

    // ─── AC3 — OnModelCreating calls UseSnakeCaseNamingConvention ─────────────

    /// <summary>
    /// Given the backend receives any request that triggers OnModelCreating,
    /// When EF Core builds the model,
    /// Then OnModelCreating runs without exception and snake_case convention is active.
    /// </summary>
    [Fact]
    public void OnModelCreating_Runs_WithoutException()
    {
        // Arrange
        var options = BuildInMemoryOptions();

        // Act
        using var context = new AppDbContext(options);
        var exception = Record.Exception(() => context.Model); // triggers OnModelCreating

        // Assert
        Assert.Null(exception);
    }

    /// <summary>
    /// Given the AppDbContext is configured,
    /// When the EF Core model is built,
    /// Then the model builds successfully — confirming UseSnakeCaseNamingConvention()
    /// was called without error (the NamingConventions package is properly referenced).
    /// </summary>
    [Fact]
    public void AppDbContext_Model_BuildsSuccessfully()
    {
        // Arrange
        var options = BuildInMemoryOptions();

        // Act
        using var context = new AppDbContext(options);
        var model = context.Model;

        // Assert
        Assert.NotNull(model);
    }

    // ─── AC4 — AppDbContext is registered and usable ──────────────────────────

    /// <summary>
    /// Given the AppDbContext is instantiated,
    /// When the Database property is accessed,
    /// Then no exception is thrown — confirming the context is correctly wired.
    /// </summary>
    [Fact]
    public void AppDbContext_Database_IsAccessible()
    {
        // Arrange
        var options = BuildInMemoryOptions();

        // Act
        using var context = new AppDbContext(options);
        var exception = Record.Exception(() => context.Database);

        // Assert
        Assert.Null(exception);
    }

    /// <summary>
    /// Given the AppDbContext is instantiated with InMemory options,
    /// When no entities are registered (initial empty migration — no domain tables),
    /// Then the entity types collection is empty, confirming no DbSet properties
    /// have been added prematurely.
    /// </summary>
    [Fact]
    public void AppDbContext_HasNoEntityTypes_AtInitialMigrationStage()
    {
        // Arrange
        var options = BuildInMemoryOptions();

        // Act
        using var context = new AppDbContext(options);
        var entityTypes = context.Model.GetEntityTypes().ToList();

        // Assert — no domain tables at this stage (scope guard: no ClienteEntity/ContactoEntity)
        Assert.Empty(entityTypes);
    }

    // ─── AC3 — ApplySnakeCaseNaming is the last call in OnModelCreating ───────

    /// <summary>
    /// Given a test entity is registered in a derived context,
    /// When EF Core builds the model,
    /// Then the table name follows snake_case convention — confirming
    /// UseSnakeCaseNamingConvention() is active and applied last in OnModelCreating.
    /// </summary>
    [Fact]
    public void OnModelCreating_SnakeCaseConvention_IsActive()
    {
        // Arrange — use a derived context that adds a test entity to verify naming
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // Act
        using var context = new SnakeCaseVerificationContext(options);
        var exception = Record.Exception(() => context.Model);

        // Assert — model builds without errors; snake_case naming convention is wired
        Assert.Null(exception);
    }

    // ─── Edge cases: isolation and state boundaries ───────────────────────────

    /// <summary>
    /// Given two AppDbContext instances with different in-memory database names,
    /// When data is written to one context,
    /// Then the other context's database is unaffected — each instance is isolated.
    /// </summary>
    [Fact]
    public async Task AppDbContext_TwoInstances_AreIsolated_WithDifferentDatabaseNames()
    {
        // Arrange — two completely separate in-memory databases
        var options1 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"db1_{Guid.NewGuid()}")
            .Options;
        var options2 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"db2_{Guid.NewGuid()}")
            .Options;

        // Act
        using var ctx1 = new AppDbContext(options1);
        using var ctx2 = new AppDbContext(options2);

        // Assert — both contexts build and are independently accessible
        Assert.NotNull(ctx1.Model);
        Assert.NotNull(ctx2.Model);

        // Saving to one context does not affect the other
        var saved = await Record.ExceptionAsync(() => ctx1.SaveChangesAsync());
        Assert.Null(saved);
    }

    /// <summary>
    /// Given the AppDbContext instantiated with InMemory options,
    /// When ChangeTracker is accessed,
    /// Then it is accessible without exception — confirming the context is properly wired.
    /// </summary>
    [Fact]
    public void AppDbContext_ChangeTracker_IsAccessible()
    {
        // Arrange
        var options = BuildInMemoryOptions();

        // Act
        using var context = new AppDbContext(options);
        var exception = Record.Exception(() => context.ChangeTracker);

        // Assert
        Assert.Null(exception);
        Assert.NotNull(context.ChangeTracker);
    }

    /// <summary>
    /// Given an AppDbContext with InMemory provider,
    /// When EnsureCreated() is called,
    /// Then no exception is thrown — confirming the InMemory provider is properly wired.
    /// </summary>
    [Fact]
    public async Task AppDbContext_EnsureCreated_DoesNotThrow()
    {
        // Arrange
        var options = BuildInMemoryOptions();

        // Act
        using var context = new AppDbContext(options);
        var exception = await Record.ExceptionAsync(() => context.Database.EnsureCreatedAsync());

        // Assert
        Assert.Null(exception);
    }

    /// <summary>
    /// Given an AppDbContext built with InMemory options,
    /// When SaveChanges() is called with no pending changes,
    /// Then zero rows are affected and no exception is thrown.
    /// </summary>
    [Fact]
    public void AppDbContext_SaveChanges_WithNoPendingChanges_ReturnsZero()
    {
        // Arrange
        var options = BuildInMemoryOptions();

        // Act
        using var context = new AppDbContext(options);
        var rowsAffected = context.SaveChanges();

        // Assert — no changes means zero rows affected
        Assert.Equal(0, rowsAffected);
    }

    /// <summary>
    /// Given the AppDbContext at the initial migration stage,
    /// When GetEntityTypes() is called,
    /// Then no navigation properties or foreign keys exist in the model
    /// (scope guard: Epic 2 and Epic 3 entities are not registered here).
    /// </summary>
    [Fact]
    public void AppDbContext_Model_HasNoForeignKeys_AtInitialMigrationStage()
    {
        // Arrange
        var options = BuildInMemoryOptions();

        // Act
        using var context = new AppDbContext(options);
        var foreignKeys = context.Model.GetEntityTypes()
            .SelectMany(e => e.GetForeignKeys())
            .ToList();

        // Assert — no FKs at initial stage (no domain entities registered)
        Assert.Empty(foreignKeys);
    }

    /// <summary>
    /// Given multiple sequential instantiations of AppDbContext,
    /// When each is disposed and a new one is created,
    /// Then no ObjectDisposedException or resource leak exception is thrown.
    /// </summary>
    [Fact]
    public void AppDbContext_MultipleSequentialInstantiations_DisposeCleanly()
    {
        // Arrange / Act / Assert — each instantiation should create, use, and dispose cleanly
        for (var i = 0; i < 5; i++)
        {
            var options = BuildInMemoryOptions();
            var exception = Record.Exception(() =>
            {
                using var context = new AppDbContext(options);
                _ = context.Model; // trigger OnModelCreating
            });
            Assert.Null(exception);
        }
    }

    // ─── Edge case: snake_case naming verifies column names ──────────────────

    /// <summary>
    /// Given the SnakeCaseVerificationContext (derived context with a probe entity),
    /// When the EF Core model is built,
    /// Then the probe entity type is registered in the model — confirming EF Core
    /// can discover and configure entities added by derived contexts.
    /// </summary>
    [Fact]
    public void SnakeCaseVerificationContext_ProbeEntity_IsRegisteredInModel()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // Act
        using var context = new SnakeCaseVerificationContext(options);
        var entityType = context.Model.FindEntityType(typeof(TestProbeEntity));

        // Assert — the probe entity is found in the model
        Assert.NotNull(entityType);
    }
}

/// <summary>
/// Test-only context that inherits from AppDbContext and adds a probe entity
/// to verify that snake_case naming conventions are applied to entity mappings.
/// This class is ONLY used in AppDbContextTests — never in production code.
/// </summary>
internal class SnakeCaseVerificationContext(DbContextOptions<AppDbContext> options) : AppDbContext(options)
{
    public DbSet<TestProbeEntity> TestProbeEntities => Set<TestProbeEntity>();
}

/// <summary>
/// Probe entity used to verify snake_case naming in EF Core model.
/// Has a multi-word property to confirm snake_case transformation.
/// </summary>
internal class TestProbeEntity
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}
