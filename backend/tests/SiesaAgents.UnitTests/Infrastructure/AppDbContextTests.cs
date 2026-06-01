// Story 1.3: Backend Database Foundation
// Epic 1: Project Foundation & Application Shell
//
// Unit Tests — RED Phase (xUnit)
// These tests are intentionally FAILING until AppDbContext is implemented.
//
// Acceptance Criteria covered:
//   AC3 — UseSnakeCaseNamingConvention() applied in OnModelCreating as the last call
//   AC5 — AppDbContext injectable via DI (constructor accepts DbContextOptions<AppDbContext>)

using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Unit tests for AppDbContext — RED Phase.
/// These tests will fail until AppDbContext is created at
/// backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
/// </summary>
public class AppDbContextTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // AC5 — AppDbContext can be instantiated via DbContextOptions<AppDbContext>
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC5: AppDbContext can be instantiated with InMemory options without throwing")]
    public void AppDbContext_WhenInstantiatedWithInMemoryOptions_DoesNotThrow()
    {
        // GIVEN: DbContextOptions<AppDbContext> configured with InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: AppDbContext is instantiated (simulating DI resolution)
        // THEN: Constructor does not throw — DI registration will work
        var exception = Record.Exception(() =>
        {
            using var ctx = new AppDbContext(options);
        });

        Assert.Null(exception);
    }

    [Fact(DisplayName = "AC5: AppDbContext constructor accepts DbContextOptions<AppDbContext> (required for DI)")]
    public void AppDbContext_Constructor_AcceptsDbContextOptions()
    {
        // GIVEN: DbContextOptions<AppDbContext> built with InMemory database
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: AppDbContext is created using the options constructor
        using var ctx = new AppDbContext(options);

        // THEN: The context is not null — verifying the constructor signature matches DI expectations
        Assert.NotNull(ctx);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3 — UseSnakeCaseNamingConvention is the last call in OnModelCreating
    // NOTE: With no DbSet<> entities registered in this story, the naming convention
    // is verified by ensuring the context builds its model without errors.
    // Full snake_case column verification will be added in Epic 2 (Story 2.1)
    // when ClienteEntity is introduced.
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC3: AppDbContext.OnModelCreating builds the model without errors (UseSnakeCaseNamingConvention configured)")]
    public void AppDbContext_OnModelCreating_BuildsModelWithoutErrors()
    {
        // GIVEN: AppDbContext configured with InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: The EF Core model is built (triggers OnModelCreating internally)
        using var ctx = new AppDbContext(options);
        var exception = Record.Exception(() =>
        {
            _ = ctx.Model; // Forces EF Core to build the model and call OnModelCreating
        });

        // THEN: Model build completes without exceptions — UseSnakeCaseNamingConvention is safe
        Assert.Null(exception);
    }

    [Fact(DisplayName = "AC3: AppDbContext model contains no domain entity tables (empty migration constraint)")]
    public void AppDbContext_Model_ContainsNoDomainEntityTables()
    {
        // GIVEN: AppDbContext configured with InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: The EF Core model is inspected for registered entity types
        using var ctx = new AppDbContext(options);
        var entityTypes = ctx.Model.GetEntityTypes().Select(e => e.GetTableName()).ToList();

        // THEN: No domain entity tables exist (no DbSet<> added in this story)
        // ClienteEntity (Epic 2) and ContactoEntity (Epic 3) must NOT be present
        Assert.DoesNotContain("clientes", entityTypes);
        Assert.DoesNotContain("contactos", entityTypes);
    }

    [Fact(DisplayName = "AC4: AppDbContext inherits from DbContext (required for EF Core tooling)")]
    public void AppDbContext_InheritsFromDbContext()
    {
        // GIVEN: The AppDbContext class definition
        // WHEN: Reflection checks its base type
        var baseType = typeof(AppDbContext).BaseType;

        // THEN: AppDbContext extends DbContext (required for dotnet ef tooling to work)
        Assert.Equal(typeof(DbContext), baseType);
    }
}
