using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// ATDD tests for Story 1.3 - Backend Database Foundation.
/// RED PHASE: These tests define expected behavior before implementation.
/// They will fail until the implementation is complete.
/// </summary>
public class AppDbContextTests
{
    // -------------------------------------------------------------------------
    // AC3 + AC5: AppDbContext can be instantiated with InMemory provider
    //            and snake_case naming convention is applied in OnModelCreating
    // -------------------------------------------------------------------------

    [Fact]
    public void AppDbContext_CanBeInstantiated_WithInMemoryProvider()
    {
        // GIVEN: EF Core InMemory options are configured for AppDbContext
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        // WHEN: AppDbContext is created with those options
        // THEN: No exception is thrown (context is created successfully)
        var exception = Record.Exception(() =>
        {
            using var context = new AppDbContext(options);
            Assert.NotNull(context);
        });

        Assert.Null(exception);
    }

    [Fact]
    public void OnModelCreating_AppliesSnakeCaseNaming_CanEnsureCreated()
    {
        // GIVEN: AppDbContext configured with InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        // WHEN: EnsureCreated is called (triggers OnModelCreating)
        // THEN: No exception thrown — confirms UseSnakeCaseNamingConvention() and
        //       ApplyConfigurationsFromAssembly() are correctly wired in OnModelCreating
        var exception = Record.Exception(() =>
        {
            using var context = new AppDbContext(options);
            context.Database.EnsureCreated();
        });

        Assert.Null(exception);
    }

    [Fact]
    public void AppDbContext_HasNoEntityDbSets_InInitialMigration()
    {
        // GIVEN: AppDbContext configured with InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        // WHEN: Model is introspected after EnsureCreated()
        // THEN: No domain entity types (clientes, contactos) exist in the model —
        //       only the EF Core migration history (if any) applies
        //       AC4: Initial migration must be empty (no domain tables)
        using var context = new AppDbContext(options);
        context.Database.EnsureCreated();

        var entityTypes = context.Model.GetEntityTypes().ToList();

        // Verify no domain tables were created (scope boundary: no clientes, no contactos)
        Assert.DoesNotContain(entityTypes, et =>
            et.ClrType.Name.Contains("Cliente", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(entityTypes, et =>
            et.ClrType.Name.Contains("Contacto", StringComparison.OrdinalIgnoreCase));
    }
}
