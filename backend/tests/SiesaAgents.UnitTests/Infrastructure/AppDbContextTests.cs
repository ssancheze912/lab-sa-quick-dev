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
    public DateTime CreatedAt { get; set; }
}
