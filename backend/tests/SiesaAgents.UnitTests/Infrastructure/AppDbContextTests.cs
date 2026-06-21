using Microsoft.EntityFrameworkCore;
using Xunit;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Unit tests for AppDbContext configuration (AC #4).
/// Expanded edge cases not covered by ATDD integration tests.
///
/// TC-E1-P2-04 (expanded): ApplySnakeCaseNaming() placement and DI construction.
/// </summary>
public class AppDbContextTests
{
    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;
        return new AppDbContext(options);
    }

    // ─── Constructor / DI ─────────────────────────────────────────────────────

    [Fact]
    public void Constructor_WithValidOptions_CreatesContextWithoutException()
    {
        // GIVEN: Valid DbContextOptions<AppDbContext>
        // WHEN: AppDbContext is instantiated via primary constructor
        // THEN: No exception is thrown and context is non-null
        using var ctx = CreateInMemoryContext();
        Assert.NotNull(ctx);
    }

    [Fact]
    public void Constructor_WithValidOptions_ExposesDatabase()
    {
        // GIVEN: A valid in-memory AppDbContext
        // WHEN: Accessing the Database property
        // THEN: DatabaseFacade is accessible (not null)
        using var ctx = CreateInMemoryContext();
        Assert.NotNull(ctx.Database);
    }

    // ─── OnModelCreating / snake_case ─────────────────────────────────────────

    [Fact]
    public void OnModelCreating_DoesNotThrow_WhenBuildingModel()
    {
        // GIVEN: AppDbContext with in-memory provider
        // WHEN: The EF Core model is compiled (triggered by accessing Model)
        // THEN: No exception is thrown during model creation
        using var ctx = CreateInMemoryContext();
        var exception = Record.Exception(() => _ = ctx.Model);
        Assert.Null(exception);
    }

    [Fact]
    public void OnModelCreating_ModelBuilds_WithNoEntitySets()
    {
        // GIVEN: AppDbContext in Story 1.3 has no DbSet properties (scope constraint)
        // WHEN: The EF Core model is compiled
        // THEN: EntityType count is zero (no domain tables defined yet)
        using var ctx = CreateInMemoryContext();
        var entityTypes = ctx.Model.GetEntityTypes().ToList();
        Assert.Empty(entityTypes);
    }

    // ─── Scope constraint: no domain entity DbSets ────────────────────────────

    [Fact]
    public void AppDbContext_HasNoDbSetProperties_ForDomainEntities()
    {
        // GIVEN: Story 1.3 scope — ClienteEntity and ContactoEntity are NOT added yet
        // WHEN: Reflection inspects public DbSet<T> properties on AppDbContext
        // THEN: No DbSet properties exist (domain tables belong to Epics 2 and 3)
        var dbSetProperties = typeof(AppDbContext)
            .GetProperties()
            .Where(p =>
                p.PropertyType.IsGenericType &&
                p.PropertyType.GetGenericTypeDefinition() == typeof(DbSet<>))
            .ToList();

        Assert.Empty(dbSetProperties);
    }

    // ─── Multiple concurrent instantiations ───────────────────────────────────

    [Fact]
    public void Constructor_CalledMultipleTimes_EachContextIsIndependent()
    {
        // GIVEN: Multiple AppDbContext instances with separate in-memory databases
        // WHEN: Both contexts are created
        // THEN: They do not share state (each has its own database name)
        using var ctx1 = new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase($"DB_A_{Guid.NewGuid()}")
                .Options);

        using var ctx2 = new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase($"DB_B_{Guid.NewGuid()}")
                .Options);

        Assert.NotSame(ctx1, ctx2);
        Assert.NotSame(ctx1.Database, ctx2.Database);
    }
}
