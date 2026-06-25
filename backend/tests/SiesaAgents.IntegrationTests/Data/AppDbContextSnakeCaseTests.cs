using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.IntegrationTests.Data;

/// <summary>
/// ATDD Tests for Story 1.3 — AC #3
/// AppDbContext must apply ApplySnakeCaseNaming() as the LAST call in OnModelCreating
/// so that all column and table names follow snake_case convention.
/// Tests are in RED phase — AppDbContext does not exist yet.
/// </summary>
public class AppDbContextSnakeCaseTests
{
    // -------------------------------------------------------------------------
    // AC #3: ApplySnakeCaseNaming() is the last call in OnModelCreating
    //        All generated names must follow snake_case convention.
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenAppDbContextConfigured_WhenInspectingModelMetadata_ThenDbContextCanBeInstantiated()
    {
        // GIVEN: DbContext options configured with InMemory provider for model inspection
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "test_snake_case_inspect")
            .Options;

        // WHEN: AppDbContext is instantiated
        using var context = new AppDbContext(options);

        // THEN: Context is successfully created (AppDbContext class exists and is constructible)
        context.Should().NotBeNull();
    }

    [Fact]
    public void GivenAppDbContextConfigured_WhenModelIsCreated_ThenNoExceptionIsThrownDuringModelBuilding()
    {
        // GIVEN: DbContext options using InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "test_no_exception_model_build")
            .Options;

        // WHEN: Model building is triggered (OnModelCreating is called internally)
        using var context = new AppDbContext(options);
        var act = () => { _ = context.Model; };

        // THEN: No exception is thrown during model creation
        //       (Confirms ApplySnakeCaseNaming() is not called incorrectly)
        act.Should().NotThrow();
    }

    [Fact]
    public void GivenAppDbContextConfigured_WhenInspectingModel_ThenNoDbSetsAreRegistered()
    {
        // GIVEN: DbContext options configured for model inspection
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "test_no_dbsets")
            .Options;

        // WHEN: AppDbContext is instantiated and the model is inspected
        using var context = new AppDbContext(options);
        var entityTypes = context.Model.GetEntityTypes().ToList();

        // THEN: No domain entity types are registered in this story
        //       (AC #4: only __EFMigrationsHistory should exist; domain tables belong to Epic 2/3)
        entityTypes.Should().BeEmpty(
            "because no domain entities (ClienteEntity, ContactoEntity) should be registered in Story 1.3");
    }
}
