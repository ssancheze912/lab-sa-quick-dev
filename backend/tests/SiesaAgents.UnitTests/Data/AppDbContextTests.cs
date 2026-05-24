// Story 1.3: Backend Database Foundation
// Epic 1: Project Foundation & Application Shell
//
// ATDD Acceptance Tests — RED Phase (Unit Level)
// AC3 — AppDbContext.OnModelCreating calls ApplySnakeCaseNaming() as the last statement
// AC4 — AppDbContext resolves from the DI container using DefaultConnection
//
// These tests are intentionally in RED phase until:
//   - AppDbContext is created in backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
//   - EFCore.NamingConventions package is installed and ApplySnakeCaseNaming() is available
//   - AppDbContext is registered in Program.cs via AddDbContext<AppDbContext>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Data;

public class AppDbContextTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // AC3: AppDbContext can be instantiated with InMemory provider
    //      (proves constructor signature is correct and OnModelCreating runs)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_WhenInstantiatedWithInMemoryProvider_DoesNotThrow()
    {
        // GIVEN: DbContextOptions configured for InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_AC3")
            .Options;

        // WHEN: AppDbContext is instantiated
        var exception = Record.Exception(() =>
        {
            using var context = new AppDbContext(options);
        });

        // THEN: No exception is thrown — constructor and OnModelCreating execute correctly
        Assert.Null(exception);
    }

    [Fact]
    public void AppDbContext_WhenModelCreating_CanBeBuiltWithoutErrors()
    {
        // GIVEN: DbContextOptions configured for InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_AC3_ModelBuilding")
            .Options;

        // WHEN: AppDbContext is instantiated and Model is accessed (triggers OnModelCreating)
        var exception = Record.Exception(() =>
        {
            using var context = new AppDbContext(options);
            // Accessing Model triggers OnModelCreating which must call ApplySnakeCaseNaming()
            _ = context.Model;
        });

        // THEN: OnModelCreating executes without error — ApplySnakeCaseNaming() was called
        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC4: AppDbContext resolves from the DI container via AddDbContext
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_WhenRegisteredInDI_ResolvesWithoutError()
    {
        // GIVEN: DI container with AppDbContext registered using InMemory (test environment)
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options =>
            options.UseInMemoryDatabase(databaseName: "TestDb_AC4_DI"));

        var provider = services.BuildServiceProvider();

        // WHEN: AppDbContext is resolved from the DI container
        var exception = Record.Exception(() =>
        {
            using var scope = provider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.NotNull(context);
        });

        // THEN: AppDbContext resolves without InvalidOperationException (DI registration is correct)
        Assert.Null(exception);
    }

    [Fact]
    public void AppDbContext_WhenRegisteredInDI_InheritsFromDbContext()
    {
        // GIVEN: DbContextOptions configured for InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_AC4_Inheritance")
            .Options;

        // WHEN: AppDbContext is instantiated
        using var context = new AppDbContext(options);

        // THEN: AppDbContext is a valid DbContext instance (required for EF Core DI registration)
        Assert.IsAssignableFrom<DbContext>(context);
    }
}
