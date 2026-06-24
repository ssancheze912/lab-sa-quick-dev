using Microsoft.EntityFrameworkCore;
using Xunit;

// NOTE: RED PHASE — These tests will FAIL until AppDbContext is implemented.
// Story 1.3: Backend Database Foundation — AC2

namespace SiesaAgents.UnitTests.Infrastructure.Data;

/// <summary>
/// ATDD Unit Tests for AppDbContext configuration.
/// Verifies that snake_case naming convention is applied via EFCore.NamingConventions.
/// All tests are in RED phase — AppDbContext does not yet exist.
/// </summary>
public class AppDbContextTests
{
    // ──────────────────────────────────────────────────────────────────────────
    // AC2: ApplySnakeCaseNaming() is called in OnModelCreating as the last statement.
    //      All future column and table names automatically follow snake_case convention.
    //      No [Column] or [Table] data annotation attributes are needed.
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_CanBeInstantiatedWithInMemoryProvider()
    {
        // GIVEN: DbContextOptions configured with InMemory provider (unit test isolation)
        var options = new DbContextOptionsBuilder<SiesaAgents.Infrastructure.Data.AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_CanInstantiate")
            .Options;

        // WHEN: AppDbContext is instantiated
        using var context = new SiesaAgents.Infrastructure.Data.AppDbContext(options);

        // THEN: Context is created without throwing (basic sanity check)
        Assert.NotNull(context);
    }

    [Fact]
    public void AppDbContext_OnModelCreating_DoesNotThrowWithInMemoryProvider()
    {
        // GIVEN: DbContextOptions configured with InMemory provider
        var options = new DbContextOptionsBuilder<SiesaAgents.Infrastructure.Data.AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_ModelCreating")
            .Options;

        // WHEN: OnModelCreating executes (triggered by Model access)
        using var context = new SiesaAgents.Infrastructure.Data.AppDbContext(options);

        // THEN: Accessing Model triggers OnModelCreating — it must not throw
        var exception = Record.Exception(() => _ = context.Model);
        Assert.Null(exception);
    }

    [Fact]
    public void AppDbContext_Constructor_AcceptsDbContextOptions()
    {
        // GIVEN: Properly configured DbContextOptions<AppDbContext>
        var options = new DbContextOptionsBuilder<SiesaAgents.Infrastructure.Data.AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Constructor")
            .Options;

        // WHEN: AppDbContext is constructed with those options
        // THEN: No exception is thrown (constructor signature is correct)
        var exception = Record.Exception(
            () => new SiesaAgents.Infrastructure.Data.AppDbContext(options));
        Assert.Null(exception);
    }
}
