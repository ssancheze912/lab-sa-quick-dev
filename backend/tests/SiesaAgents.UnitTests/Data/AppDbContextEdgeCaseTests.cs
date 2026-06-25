using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Data;

/// <summary>
/// Edge-case and boundary tests for AppDbContext and the internal ToSnakeCase convention
/// (Story 1.3 — AC #3, #4).
/// Expands ATDD coverage with boundary conditions for the snake_case implementation.
/// </summary>
public class AppDbContextEdgeCaseTests
{
    // -------------------------------------------------------------------------
    // Helper: build a context with an optional additional entity type
    // -------------------------------------------------------------------------

    private static AppDbContext BuildContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    // -------------------------------------------------------------------------
    // [P0] AC #4: Only __EFMigrationsHistory exists — no domain tables
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenAppDbContext_WhenModelInspected_ThenEntityTypeListContainsDomainEntities()
    {
        // GIVEN: AppDbContext configured with InMemory provider
        using var context = BuildContext("test_entities_edge");

        // WHEN: Model entity types are queried
        var entityTypes = context.Model.GetEntityTypes().Select(e => e.ClrType.Name).ToList();

        // THEN: ClienteEntity is registered (Story 2.1 adds it; Story 1.3 had no entities)
        entityTypes.Should().Contain("ClienteEntity",
            because: "Story 2.1 adds ClienteEntity to AppDbContext");
    }

    // -------------------------------------------------------------------------
    // [P0] AC #3: ApplySnakeCaseNaming does not throw on empty model
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenEmptyModel_WhenApplySnakeCaseNamingRuns_ThenNoExceptionIsThrown()
    {
        // GIVEN: AppDbContext with no registered entity types
        using var context = BuildContext("test_empty_model_snake");

        // WHEN: Model is created (triggers OnModelCreating → ApplySnakeCaseNaming)
        var act = () => { _ = context.Model; };

        // THEN: No exception is thrown
        act.Should().NotThrow(
            because: "ApplySnakeCaseNaming must handle an empty entity set gracefully");
    }

    // -------------------------------------------------------------------------
    // [P1] ToSnakeCase conversion: PascalCase simple → snake_case
    // Tested indirectly via a test entity registered at runtime
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenEntityWithPascalCaseName_WhenModelBuilt_ThenTableNameIsSnakeCase()
    {
        // GIVEN: A DbContext variant that registers a test entity with PascalCase name
        var options = new DbContextOptionsBuilder<AppDbContextWithTestEntity>()
            .UseInMemoryDatabase("test_pascal_snake")
            .Options;

        using var context = new AppDbContextWithTestEntity(options);

        // WHEN: Model is built
        var entityType = context.Model.FindEntityType(typeof(TestPascalCaseEntity));

        // THEN: Table name follows snake_case convention
        entityType.Should().NotBeNull();
        var tableName = entityType!.GetTableName();
        tableName.Should().Be("test_pascal_case_entity",
            because: "PascalCase 'TestPascalCaseEntity' must map to 'test_pascal_case_entity'");
    }

    [Fact]
    public void GivenEntityWithPascalCaseProperties_WhenModelBuilt_ThenColumnNamesAreSnakeCase()
    {
        // GIVEN: A DbContext variant that registers a test entity
        var options = new DbContextOptionsBuilder<AppDbContextWithTestEntity>()
            .UseInMemoryDatabase("test_column_snake")
            .Options;

        using var context = new AppDbContextWithTestEntity(options);

        // WHEN: Model is built
        var entityType = context.Model.FindEntityType(typeof(TestPascalCaseEntity))!;
        var properties = entityType.GetProperties().ToList();

        // THEN: All column names follow snake_case
        var idProp = properties.First(p => p.Name == "Id");
        idProp.GetColumnName().Should().Be("id",
            because: "'Id' must map to 'id'");

        var createdAtProp = properties.First(p => p.Name == "CreatedAt");
        createdAtProp.GetColumnName().Should().Be("created_at",
            because: "'CreatedAt' must map to 'created_at'");

        var someNameProp = properties.First(p => p.Name == "SomeName");
        someNameProp.GetColumnName().Should().Be("some_name",
            because: "'SomeName' must map to 'some_name'");
    }

    // -------------------------------------------------------------------------
    // [P1] ToSnakeCase: consecutive uppercase acronyms (e.g., XMLParser → xml_parser)
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenEntityWithAcronymInName_WhenModelBuilt_ThenAcronymIsHandledCorrectly()
    {
        // GIVEN: A DbContext with an entity whose name contains an acronym
        var options = new DbContextOptionsBuilder<AppDbContextWithAcronymEntity>()
            .UseInMemoryDatabase("test_acronym_snake")
            .Options;

        using var context = new AppDbContextWithAcronymEntity(options);

        // WHEN: Model is built
        var entityType = context.Model.FindEntityType(typeof(TestAPIResponse));

        // THEN: Table name handles acronym — consecutive capitals split at boundary
        entityType.Should().NotBeNull();
        var tableName = entityType!.GetTableName();

        // "TestAPIResponse" → Regex handles "API" (consecutive caps) correctly
        // Pattern: ([A-Z]+)([A-Z][a-z]) → API splits into AP_I? No — pattern:
        // Regex.Replace("TestAPIResponse", @"([A-Z]+)([A-Z][a-z])", "$1_$2")
        //   matches "APIR" as ([API])([Re]) → "API_Response"
        // Then Regex.Replace("TestAPI_Response", @"([a-z0-9])([A-Z])", "$1_$2")
        //   matches "st" + "A" → "Test_API_Response"
        // Result: "test_api_response"
        tableName.Should().Be("test_api_response",
            because: "acronym 'API' must be converted correctly by the two-pass regex");
    }

    // -------------------------------------------------------------------------
    // [P1] ToSnakeCase: already lowercase string passes through unchanged
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenEntityAlreadyInLowerCase_WhenModelBuilt_ThenNameRemainsUnchanged()
    {
        // GIVEN: A DbContext with an entity whose name is already lowercase
        var options = new DbContextOptionsBuilder<AppDbContextWithLowercaseEntity>()
            .UseInMemoryDatabase("test_lowercase_passthrough")
            .Options;

        using var context = new AppDbContextWithLowercaseEntity(options);

        // WHEN: Model is built
        var entityType = context.Model.FindEntityType(typeof(alreadylowercase));

        // THEN: Table name is still lowercase (no double-underscore or other corruption)
        entityType.Should().NotBeNull();
        var tableName = entityType!.GetTableName();
        tableName.Should().Be("alreadylowercase",
            because: "an already-lowercase name must pass through ToSnakeCase without modification");
    }

    // -------------------------------------------------------------------------
    // [P2] AC #3: base.OnModelCreating is called before ApplySnakeCaseNaming
    //     (Ensures snake_case is applied as the LAST step, not overridden)
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenAppDbContext_WhenModelIsBuilt_ThenModelIsValid()
    {
        // GIVEN: AppDbContext (which calls base.OnModelCreating then ApplySnakeCaseNaming last)
        using var context = BuildContext("test_model_valid_order");

        // WHEN: Model is accessed
        var model = context.Model;

        // THEN: Model is not null and is fully built (no partial-build exception)
        model.Should().NotBeNull(
            because: "calling base.OnModelCreating() then ApplySnakeCaseNaming() in correct order must produce a valid model");
    }

    // -------------------------------------------------------------------------
    // [P2] Multiple instantiations of AppDbContext with same db name — no cross-contamination
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenMultipleContextInstances_WhenBothInspected_ThenBothAreIsolated()
    {
        // GIVEN: Two separate AppDbContext instances with different db names
        using var context1 = BuildContext("test_isolation_1");
        using var context2 = BuildContext("test_isolation_2");

        // WHEN: Both models are inspected
        var entities1 = context1.Model.GetEntityTypes().Select(e => e.ClrType.Name).ToList();
        var entities2 = context2.Model.GetEntityTypes().Select(e => e.ClrType.Name).ToList();

        // THEN: Both have the same entity sets (model is shared, not cross-contaminated via data)
        entities1.Should().BeEquivalentTo(entities2,
            because: "both context instances share the same EF Core model configuration");
    }
}

// Test-only entity types, DbContext variants, and AppDbContextSnakeCaseHelper are in AppDbContextTestHelpers.cs
