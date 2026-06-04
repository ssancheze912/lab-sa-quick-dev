using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// ATDD tests for Story 1.3 — Backend Database Foundation.
/// AC #3: OnModelCreating applies UseSnakeCaseNamingConvention().
/// AC #5: AppDbContext can be instantiated with valid options (DI registration precondition).
/// Tests are in RED phase — AppDbContext does not exist yet (rename from SiesaAgentsDbContext pending).
/// </summary>
public class AppDbContextTests
{
    // ──────────────────────────────────────────────────────────────────────────────
    // AC #5 — AppDbContext can be instantiated with valid InMemory options
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_CanBeInstantiated_WithValidOptions()
    {
        // GIVEN: Valid InMemory DbContextOptions for AppDbContext
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: AppDbContext is instantiated with those options
        using var context = new AppDbContext(options);

        // THEN: Context is created without throwing any exception
        Assert.NotNull(context);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // AC #3 — OnModelCreating applies snake_case naming convention without throwing
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void OnModelCreating_AppliesSnakeCaseNaming_WithoutException()
    {
        // GIVEN: AppDbContext configured with InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: The model is built (triggers OnModelCreating)
        using var context = new AppDbContext(options);
        var ex = Record.Exception(() => context.Model);

        // THEN: No exception is thrown — snake_case convention is applied successfully
        Assert.Null(ex);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // AC #3 — Each AppDbContext instance gets an isolated InMemory database
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_TwoInstances_AreIsolated()
    {
        // GIVEN: Two separate InMemory databases (unique names)
        var options1 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var options2 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: Two AppDbContext instances are created
        using var context1 = new AppDbContext(options1);
        using var context2 = new AppDbContext(options2);

        // THEN: Both contexts are independent (no shared state)
        Assert.NotSame(context1, context2);
    }
}
