// ATDD Unit Tests for Story 1.3: Backend Database Foundation
// Epic 1: Project Foundation & Application Shell
//
// These tests define the expected structural behavior of AppDbContext.
//
// Acceptance Criteria covered:
//   AC3 — ApplySnakeCaseNaming() is applied in OnModelCreating; all future column
//          names follow snake_case convention automatically
//   AC4 — AppDbContext is resolvable from DI (CanBeInstantiated_WithOptions verifies constructor)
//   AC5 — Initial migration contains NO clientes or contactos table definitions
//          (verified by asserting zero DbSet<> properties on AppDbContext)
//
// Test runner: xUnit
// Provider:    Microsoft.EntityFrameworkCore.InMemory (structural tests only)
//              Note: InMemory does NOT enforce ApplySnakeCaseNaming column mappings.
//              Actual column name verification requires PostgreSQL integration tests
//              (added via Testcontainers in a future testing story).

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

public class AppDbContextTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // AC4 — AppDbContext constructor accepts DbContextOptions<AppDbContext>
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_CanBeInstantiated_WithOptions()
    {
        // GIVEN: A DbContextOptions<AppDbContext> is built with the InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Instantiation_1_3")
            .Options;

        // WHEN: AppDbContext is constructed with those options
        using var context = new AppDbContext(options);

        // THEN: The context is created without throwing an exception
        Assert.NotNull(context);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3 — OnModelCreating completes without error (structural validation)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_OnModelCreating_BuildsModelWithoutError()
    {
        // GIVEN: AppDbContext is configured with InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_ModelCreating_1_3")
            .Options;

        // WHEN: The EF Core model is accessed (triggers OnModelCreating)
        using var context = new AppDbContext(options);
        var model = context.Model;

        // THEN: Model is built successfully — snake_case naming call did not throw
        Assert.NotNull(model);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC5 — AppDbContext has NO DbSet<> properties (empty migration scope)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_HasNo_DbSetProperties_InStory1_3_Scope()
    {
        // GIVEN: Story 1.3 creates an INTENTIONALLY EMPTY AppDbContext
        //        (ClienteEntity and ContactoEntity DbSets are added in Epics 2 and 3)
        // WHEN: The public properties of AppDbContext are inspected via reflection

        var contextType = typeof(AppDbContext);
        var dbSetProperties = contextType
            .GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Where(p =>
                p.PropertyType.IsGenericType &&
                p.PropertyType.GetGenericTypeDefinition() == typeof(DbSet<>))
            .ToList();

        // THEN: There are ZERO DbSet<> properties on AppDbContext in this story
        //       Any DbSet would indicate scope creep (clientes/contactos added too early)
        Assert.Empty(dbSetProperties);
    }

    [Fact]
    public void AppDbContext_DoesNotContain_ClienteEntity_DbSet()
    {
        // GIVEN: Scope boundary — ClienteEntity is created in Epic 2 Story 2.1
        // WHEN: AppDbContext public properties are inspected by name

        var contextType = typeof(AppDbContext);
        var propertyNames = contextType
            .GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Select(p => p.Name.ToLower())
            .ToList();

        // THEN: No property named 'clientes' exists on AppDbContext
        Assert.DoesNotContain("clientes", propertyNames);
    }

    [Fact]
    public void AppDbContext_DoesNotContain_ContactoEntity_DbSet()
    {
        // GIVEN: Scope boundary — ContactoEntity is created in Epic 3 Story 3.1
        // WHEN: AppDbContext public properties are inspected by name

        var contextType = typeof(AppDbContext);
        var propertyNames = contextType
            .GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Select(p => p.Name.ToLower())
            .ToList();

        // THEN: No property named 'contactos' exists on AppDbContext
        Assert.DoesNotContain("contactos", propertyNames);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC4 — AppDbContext is resolvable from the DI container
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_IsResolvable_FromDependencyInjection()
    {
        // GIVEN: A service collection with AddDbContext<AppDbContext> registered
        //        using the InMemory provider (mirrors Program.cs registration with UseNpgsql)
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options =>
            options.UseInMemoryDatabase(databaseName: "TestDb_DI_1_3"));

        var serviceProvider = services.BuildServiceProvider();

        // WHEN: AppDbContext is resolved from the DI container
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetService<AppDbContext>();

        // THEN: The context is resolved without an exception
        //       (InvalidOperationException here means DI registration is broken)
        Assert.NotNull(context);
    }

    [Fact]
    public void AppDbContext_CanSaveChanges_WithEmptyContext()
    {
        // GIVEN: AppDbContext is created with InMemory provider and no entities configured
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_SaveChanges_1_3")
            .Options;

        // WHEN: SaveChanges is called on an empty context (no-op operation)
        using var context = new AppDbContext(options);
        var result = context.SaveChanges();

        // THEN: SaveChanges returns 0 (no changes applied — context is empty)
        Assert.Equal(0, result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3 — Structural: AppDbContext inherits DbContext
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_Inherits_DbContext()
    {
        // GIVEN: AppDbContext must extend DbContext (EF Core requirement)
        // WHEN: The type hierarchy is inspected

        var contextType = typeof(AppDbContext);

        // THEN: AppDbContext is a subclass of DbContext
        Assert.True(typeof(DbContext).IsAssignableFrom(contextType));
    }

    [Fact]
    public void AppDbContext_Constructor_AcceptsGenericOptions_NotBaseOptions()
    {
        // GIVEN: AppDbContext uses primary constructor syntax (Story 1.3 Dev Notes)
        //        Constructor must accept DbContextOptions<AppDbContext>, NOT DbContextOptions
        // WHEN: The constructor parameters are inspected via reflection

        var contextType = typeof(AppDbContext);
        var constructors = contextType.GetConstructors(BindingFlags.Public | BindingFlags.Instance);

        // THEN: At least one public constructor exists
        Assert.NotEmpty(constructors);

        // AND: The first public constructor accepts DbContextOptions<AppDbContext>
        var expectedParamType = typeof(DbContextOptions<AppDbContext>);
        var hasGenericOptionsConstructor = constructors.Any(c =>
            c.GetParameters().Any(p => p.ParameterType == expectedParamType));

        Assert.True(hasGenericOptionsConstructor,
            "AppDbContext must have a constructor accepting DbContextOptions<AppDbContext>");
    }
}
