// Story 1.3: Backend Database Foundation
// Epic 1: Project Foundation & Application Shell
//
// ATDD Unit Tests — RED Phase (xUnit)
// These tests INTENTIONALLY FAIL until implementation is complete.
//
// Acceptance Criteria covered:
//   AC2 — OnModelCreating applies ApplySnakeCaseNaming() as the last call,
//          ensuring all future column and table names follow snake_case convention.
//
// Test Structure: Arrange / Act / Assert

using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Data;

public sealed class AppDbContextTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // AC2 — AppDbContext can be instantiated with DbContextOptions
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC2 — AppDbContext can be instantiated with InMemory provider")]
    public void AppDbContext_CanBeInstantiated_WithDbContextOptions()
    {
        // GIVEN: DbContextOptions configured for InMemory provider (no real PostgreSQL needed)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        // WHEN: AppDbContext is instantiated
        using var context = new AppDbContext(options);

        // THEN: Context is not null and no exception is thrown
        Assert.NotNull(context);
    }

    [Fact(DisplayName = "AC2 — AppDbContext inherits from DbContext")]
    public void AppDbContext_InheritsFromDbContext()
    {
        // GIVEN: The AppDbContext class exists in SiesaAgents.Infrastructure.Data namespace
        // WHEN: Checking type hierarchy

        var type = typeof(AppDbContext);

        // THEN: AppDbContext inherits from DbContext
        Assert.True(typeof(DbContext).IsAssignableFrom(type));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC2 — No DbSet<> properties exist on AppDbContext (scope: empty migration)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC2 — AppDbContext has no DbSet properties (empty initial migration — no domain entities in Story 1.3)")]
    public void AppDbContext_HasNoDbSetProperties_InStory13Scope()
    {
        // GIVEN: Story 1.3 scope explicitly forbids adding ClienteEntity, ContactoEntity, or any DbSet<>
        // WHEN: Inspecting the public DbSet properties of AppDbContext

        var type = typeof(AppDbContext);
        var dbSetProperties = type.GetProperties()
            .Where(p =>
                p.PropertyType.IsGenericType &&
                p.PropertyType.GetGenericTypeDefinition() == typeof(DbSet<>))
            .ToList();

        // THEN: No DbSet<> properties exist (domain entities are added in Epic 2 and 3)
        Assert.Empty(dbSetProperties);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC2 — AppDbContext namespace is SiesaAgents.Infrastructure.Data
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC2 — AppDbContext is in the SiesaAgents.Infrastructure.Data namespace")]
    public void AppDbContext_IsInCorrectNamespace()
    {
        // GIVEN: Architecture mandates AppDbContext lives in SiesaAgents.Infrastructure.Data
        // WHEN: Checking the namespace of AppDbContext

        var type = typeof(AppDbContext);

        // THEN: Namespace matches the architecture contract
        Assert.Equal("SiesaAgents.Infrastructure.Data", type.Namespace);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC2 — AppDbContext constructor accepts DbContextOptions<AppDbContext>
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC2 — AppDbContext constructor accepts DbContextOptions<AppDbContext>")]
    public void AppDbContext_Constructor_AcceptsDbContextOptions()
    {
        // GIVEN: The constructor signature matches the required DI registration pattern
        // WHEN: Inspecting the constructor parameters

        var type = typeof(AppDbContext);
        var constructors = type.GetConstructors();
        var primaryConstructor = constructors.FirstOrDefault(c =>
            c.GetParameters().Any(p =>
                p.ParameterType == typeof(DbContextOptions<AppDbContext>)));

        // THEN: A constructor accepting DbContextOptions<AppDbContext> exists
        Assert.NotNull(primaryConstructor);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC2 — AppDbContext can call EnsureCreated without throwing (smoke test)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC2 — AppDbContext model creation completes without errors using InMemory provider")]
    public async Task AppDbContext_EnsureCreatedAsync_DoesNotThrow()
    {
        // GIVEN: DbContextOptions configured with a fresh InMemory database
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: EnsureCreated is called (triggers OnModelCreating → ApplySnakeCaseNaming)
        // NOTE: InMemory provider ignores snake_case naming conventions but should not throw
        var exception = await Record.ExceptionAsync(() => context.Database.EnsureCreatedAsync());

        // THEN: No exception is thrown during model creation
        Assert.Null(exception);
    }
}
