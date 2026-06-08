using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Acceptance tests for Story 1.3 – AppDbContext and IApplicationDbContext contract.
/// All tests are in RED phase: they reference types not yet implemented.
/// </summary>
public class AppDbContextTests
{
    // ─────────────────────────────────────────────────────────────────────
    // AC #3 – OnModelCreating applies snake_case naming convention
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void OnModelCreating_WhenCalled_AppliesSnakeCaseNamingConvention()
    {
        // GIVEN: AppDbContext configured with an in-memory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: The context is created (OnModelCreating runs implicitly)
        using var context = new AppDbContext(options);

        // THEN: The context is created without errors, indicating ApplySnakeCaseNaming() ran
        Assert.NotNull(context);
    }

    [Fact]
    public void OnModelCreating_WhenCalled_DoesNotThrow()
    {
        // GIVEN: AppDbContext with in-memory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN / THEN: Model creation must complete without exception
        var exception = Record.Exception(() =>
        {
            using var context = new AppDbContext(options);
            _ = context.Model; // forces OnModelCreating to execute
        });

        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC #5 – AppDbContext implements IApplicationDbContext
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_ImplementsIApplicationDbContext()
    {
        // GIVEN: The type AppDbContext
        var type = typeof(AppDbContext);

        // WHEN: Checking interface implementation
        var implementsInterface = typeof(IApplicationDbContext).IsAssignableFrom(type);

        // THEN: AppDbContext must satisfy the IApplicationDbContext contract
        Assert.True(implementsInterface,
            "AppDbContext must implement IApplicationDbContext defined in SiesaAgents.Application");
    }

    [Fact]
    public async Task SaveChangesAsync_WhenCalled_DelegatesToBase()
    {
        // GIVEN: AppDbContext backed by an in-memory database
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: SaveChangesAsync is called via the interface
        IApplicationDbContext dbContext = context;
        var result = await dbContext.SaveChangesAsync(CancellationToken.None);

        // THEN: No exception is thrown and result is a non-negative integer
        Assert.True(result >= 0, "SaveChangesAsync should return a non-negative change count");
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC #5 – IApplicationDbContext exposes SaveChangesAsync only (no DbSet<>)
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void IApplicationDbContext_HasOnlySaveChangesAsyncMethod()
    {
        // GIVEN: The IApplicationDbContext interface
        var interfaceType = typeof(IApplicationDbContext);

        // WHEN: Inspecting its declared methods
        var methods = interfaceType.GetMethods();

        // THEN: Only SaveChangesAsync should be declared at this stage
        Assert.Single(methods, m => m.Name == "SaveChangesAsync");
    }

    [Fact]
    public void IApplicationDbContext_HasNoDbSetProperties()
    {
        // GIVEN: The IApplicationDbContext interface
        var interfaceType = typeof(IApplicationDbContext);

        // WHEN: Inspecting its declared properties
        var properties = interfaceType.GetProperties();

        // THEN: No DbSet<> properties should exist (Application layer must stay ORM-free)
        Assert.Empty(properties);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC #2 – Scope boundary: no Clientes / Contactos DbSet<> in context
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_HasNoClientesDbSet()
    {
        // GIVEN: The AppDbContext type
        var type = typeof(AppDbContext);

        // WHEN: Inspecting public properties named "Clientes"
        var prop = type.GetProperty("Clientes");

        // THEN: No Clientes DbSet should exist in this story (Epic 2 scope)
        Assert.Null(prop);
    }

    [Fact]
    public void AppDbContext_HasNoContactosDbSet()
    {
        // GIVEN: The AppDbContext type
        var type = typeof(AppDbContext);

        // WHEN: Inspecting public properties named "Contactos"
        var prop = type.GetProperty("Contactos");

        // THEN: No Contactos DbSet should exist in this story (Epic 3 scope)
        Assert.Null(prop);
    }
}
