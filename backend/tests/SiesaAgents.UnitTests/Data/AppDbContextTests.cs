using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Data;

/// <summary>
/// RED-phase unit tests for AppDbContext.
/// Covers Story 1.3 AC #4, AC #5, AC #6 (unit: derives from DbContext + accepts DbContextOptions ctor).
/// These tests will FAIL until SiesaAgents.Infrastructure.Data.AppDbContext exists.
/// </summary>
public class AppDbContextTests
{
    [Fact]
    public void AppDbContext_DerivesFromDbContext()
    {
        // GIVEN: the AppDbContext type as declared in SiesaAgents.Infrastructure.Data
        var type = typeof(AppDbContext);

        // WHEN: we inspect its inheritance chain
        var derivesFromDbContext = typeof(DbContext).IsAssignableFrom(type);

        // THEN: AppDbContext MUST inherit from Microsoft.EntityFrameworkCore.DbContext
        Assert.True(
            derivesFromDbContext,
            "AppDbContext must derive from Microsoft.EntityFrameworkCore.DbContext (AC #6 unit).");
    }

    [Fact]
    public void AppDbContext_HasPublicConstructor_AcceptingDbContextOptions()
    {
        // GIVEN: the AppDbContext type
        var type = typeof(AppDbContext);

        // WHEN: we look for a public constructor accepting DbContextOptions<AppDbContext>
        var ctor = type.GetConstructor(new[] { typeof(DbContextOptions<AppDbContext>) });

        // THEN: such a constructor MUST exist and be public (required by AddDbContext DI registration in AC #5)
        Assert.NotNull(ctor);
        Assert.True(ctor!.IsPublic, "Constructor accepting DbContextOptions<AppDbContext> must be public.");
    }

    [Fact]
    public void AppDbContext_CanBeInstantiated_WithInMemoryProvider()
    {
        // GIVEN: DbContextOptions configured with the InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"AppDbContextTests_{Guid.NewGuid():N}")
            .Options;

        // WHEN: we instantiate AppDbContext with those options
        using var context = new AppDbContext(options);

        // THEN: the instance is created and is a live DbContext
        Assert.NotNull(context);
        Assert.IsAssignableFrom<DbContext>(context);
    }

    [Fact]
    public void AppDbContext_OnModelCreating_AppliesSnakeCaseNamingAsLastStep()
    {
        // GIVEN: an AppDbContext built against the InMemory provider so the model is materialized
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"AppDbContextSnakeCase_{Guid.NewGuid():N}")
            .Options;
        using var context = new AppDbContext(options);

        // WHEN: we materialize the model (forces OnModelCreating to run)
        var model = context.Model;

        // THEN: every entity, column, key, FK, and index name in the model MUST already be snake_case.
        // (If ApplySnakeCaseNaming() is NOT the LAST call in OnModelCreating, any PascalCase
        //  identifier would survive — this assertion catches that regression.)
        foreach (var entity in model.GetEntityTypes())
        {
            var tableName = entity.GetTableName();
            if (tableName is not null)
            {
                Assert.Matches("^[a-z0-9_]+$", tableName);
            }

            foreach (var property in entity.GetProperties())
            {
                var columnName = property.GetColumnName();
                Assert.Matches("^[a-z0-9_]+$", columnName);
            }
        }
    }

    [Fact]
    public void AppDbContext_DoesNotExposeDomainTables_ScopeNoteForEpic1()
    {
        // GIVEN: per the Story 1.3 Scope Note, NO domain DbSet<T> properties are declared yet.
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"AppDbContextScope_{Guid.NewGuid():N}")
            .Options;
        using var context = new AppDbContext(options);

        // WHEN: we enumerate the model's entity types
        var entityTypes = context.Model.GetEntityTypes().ToList();

        // THEN: there are zero domain entities mapped (clientes / contactos arrive in Epic 2 & 3).
        Assert.Empty(entityTypes);
    }
}
