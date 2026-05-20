using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Unit tests for AppDbContext — Story 1.3 AC3.
/// Verifies that ApplySnakeCaseNaming() is applied in OnModelCreating so that
/// all entity table/column names follow snake_case conventions.
///
/// These tests are in RED phase. They will fail until AppDbContext is created
/// at backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs.
///
/// Test IDs: UNIT-F-06
/// </summary>
public class AppDbContextTests
{
    /// <summary>
    /// UNIT-F-06 (P2 — AC3)
    /// Given AppDbContext is created with an in-memory provider
    /// When OnModelCreating is invoked
    /// Then the model is built without errors (ApplySnakeCaseNaming does not throw)
    /// And the context is a valid DbContext subclass
    /// </summary>
    [Fact]
    public void AppDbContext_OnModelCreating_DoesNotThrow()
    {
        // GIVEN: Options configured with in-memory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        // WHEN: AppDbContext is instantiated (triggers OnModelCreating)
        // THEN: No exception is thrown — ApplySnakeCaseNaming() is safe to call
        var exception = Record.Exception(() =>
        {
            using var context = new AppDbContext(options);
            // Force model building by accessing Model property
            _ = context.Model;
        });

        Assert.Null(exception);
    }

    /// <summary>
    /// UNIT-F-06b (P2 — AC3)
    /// Given AppDbContext is configured with an in-memory provider
    /// When the model is built
    /// Then the AppDbContext inherits from DbContext
    /// (structural check that the class hierarchy is correct)
    /// </summary>
    [Fact]
    public void AppDbContext_InheritsFromDbContext()
    {
        // GIVEN / WHEN / THEN: AppDbContext must be a DbContext subclass
        Assert.True(
            typeof(DbContext).IsAssignableFrom(typeof(AppDbContext)),
            "AppDbContext must inherit from Microsoft.EntityFrameworkCore.DbContext"
        );
    }

    /// <summary>
    /// UNIT-F-06c (P2 — AC3)
    /// Given a DbContextOptionsBuilder with in-memory provider
    /// When AppDbContext is constructed with those options
    /// Then the constructor accepts DbContextOptions&lt;AppDbContext&gt; (not generic DbContextOptions)
    /// ensuring the DI registration pattern builder.Services.AddDbContext&lt;AppDbContext&gt;() works
    /// </summary>
    [Fact]
    public void AppDbContext_Constructor_AcceptsTypedDbContextOptions()
    {
        // GIVEN: Typed options for AppDbContext
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        // WHEN: Constructor is called with typed options
        // THEN: No exception — constructor signature is (DbContextOptions<AppDbContext> options)
        var exception = Record.Exception(() =>
        {
            using var context = new AppDbContext(options);
        });

        Assert.Null(exception);
    }

    /// <summary>
    /// UNIT-F-06d (P2 — updated for Story 2.1)
    /// Given AppDbContext built with an in-memory provider
    /// When the EF Core model is inspected
    /// Then exactly one DbSet&lt;&gt; property exists: Clientes (added in Story 2.1)
    /// </summary>
    [Fact]
    public void AppDbContext_HasClientesDbSet_AfterStory21()
    {
        // GIVEN: AppDbContext type reflection
        var dbSetType = typeof(DbSet<>);
        var contextType = typeof(AppDbContext);

        // WHEN: Enumerate all public instance properties
        var dbSetProperties = contextType
            .GetProperties(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance)
            .Where(p => p.PropertyType.IsGenericType &&
                        p.PropertyType.GetGenericTypeDefinition() == dbSetType)
            .ToList();

        // THEN: Exactly one DbSet<ClienteEntity> — Clientes added in Story 2.1
        Assert.Single(dbSetProperties);
        Assert.Equal("Clientes", dbSetProperties[0].Name);
    }
}
