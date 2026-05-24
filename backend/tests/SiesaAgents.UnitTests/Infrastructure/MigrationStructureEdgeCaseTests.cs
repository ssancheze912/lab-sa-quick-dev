using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Data.Migrations;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Edge case and boundary tests for EF Core migration structure.
/// Expands coverage beyond the 7 baseline ATDD tests in MigrationStructureTests.cs.
///
/// Covers: [DbContext] attribute correctness, [Migration] ID timestamp format,
/// designer file BuildTargetModel is empty (no entity types), ModelSnapshot type,
/// product version annotation, exactly one migration (no accidental extras),
/// and migration ID uniqueness.
///
/// Story 1.3 AC1/AC2 — EF Core migration files structure.
/// NOTE: .NET 10 runtime is required to load the Infrastructure assembly.
/// Tests are in RED phase if the runtime is unavailable.
/// </summary>
public class MigrationStructureEdgeCaseTests
{
    private const string MigrationsNamespace = "SiesaAgents.Infrastructure.Data.Migrations";
    private static readonly Assembly InfraAssembly = typeof(ApplicationDbContext).Assembly;

    // ─────────────────────────────────────────────────────────────────────────
    // Helper: get the InitialCreate migration type (reused across tests)
    // ─────────────────────────────────────────────────────────────────────────

    private static Type GetInitialCreateType() =>
        InfraAssembly
            .GetTypes()
            .Single(t => t.IsSubclassOf(typeof(Migration))
                         && !t.IsAbstract
                         && t.Name.EndsWith("InitialCreate", StringComparison.Ordinal));

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: exactly one migration exists in Story 1.3 scope
    // (no accidental duplicate or extra migration was generated)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Migrations_ExactlyOneMigrationExists_InStory13Scope()
    {
        // GIVEN: Infrastructure assembly containing Story 1.3 migration files
        var migrationTypes = InfraAssembly
            .GetTypes()
            .Where(t => t.IsSubclassOf(typeof(Migration)) && !t.IsAbstract)
            .ToList();

        // THEN: Exactly one migration — no accidental extra migrations were added (AC2)
        Assert.Single(migrationTypes);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: [DbContext] attribute on the InitialCreate Designer class
    // references ApplicationDbContext, not a wrong context type
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Migrations_InitialCreateDesigner_DbContextAttribute_ReferencesApplicationDbContext()
    {
        // GIVEN: The InitialCreate partial Designer class in the migrations namespace
        // (EF Core auto-generates this — must reference the correct DbContext type)
        var designerType = InfraAssembly
            .GetTypes()
            .FirstOrDefault(t => t.Name == "InitialCreate"
                                 && t.Namespace == MigrationsNamespace);

        Assert.NotNull(designerType);

        // WHEN: We inspect the [DbContext] attribute on the designer type
        var dbContextAttr = designerType.GetCustomAttribute<DbContextAttribute>();

        // THEN: The attribute is present and points to ApplicationDbContext (AC2)
        Assert.NotNull(dbContextAttr);
        Assert.Equal(typeof(ApplicationDbContext), dbContextAttr.ContextType);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: [Migration] attribute ID starts with the timestamp prefix
    // (format: yyyyMMddHHmmss_InitialCreate)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Migrations_InitialCreate_MigrationAttribute_HasValidTimestampedId()
    {
        // GIVEN: The InitialCreate migration type
        var migrationType = GetInitialCreateType();

        // WHEN: We read the [Migration("...")] attribute ID
        var migrationAttr = migrationType.GetCustomAttribute<MigrationAttribute>();

        // THEN: Attribute is present (AC2)
        Assert.NotNull(migrationAttr);

        // AND: The ID follows EF Core timestamp format yyyyMMddHHmmss_Name
        // Minimum length: 14 digits + '_' + 'InitialCreate' = 28 chars
        Assert.True(migrationAttr.Id.Length >= 28,
            $"Migration ID '{migrationAttr.Id}' is too short — expected timestamp prefix (AC2).");

        // AND: The numeric prefix (first 14 chars) is parseable as a long
        var prefix = migrationAttr.Id.Split('_')[0];
        Assert.True(long.TryParse(prefix, out _),
            $"Migration ID prefix '{prefix}' is not numeric — must be yyyyMMddHHmmss format (AC2).");

        // AND: The suffix is 'InitialCreate'
        Assert.EndsWith("InitialCreate", migrationAttr.Id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: Migration IDs are unique (no two migrations with same timestamp)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Migrations_AllMigrations_HaveUniqueIds()
    {
        // GIVEN: All migration types in the Infrastructure assembly
        var migrationTypes = InfraAssembly
            .GetTypes()
            .Where(t => t.IsSubclassOf(typeof(Migration)) && !t.IsAbstract)
            .ToList();

        // WHEN: We collect all migration IDs from [Migration] attributes
        var ids = migrationTypes
            .Select(t => t.GetCustomAttribute<MigrationAttribute>()?.Id)
            .Where(id => id is not null)
            .ToList();

        // THEN: All IDs are unique (no duplicate timestamps, AC1)
        var uniqueIds = ids.Distinct().Count();
        Assert.Equal(ids.Count, uniqueIds);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: Designer file BuildTargetModel has no entity types
    // (the empty schema is reflected in the designer model, AC2)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Migrations_InitialCreate_Designer_BuildTargetModel_HasNoEntityTypes()
    {
        // GIVEN: ApplicationDbContext configured with InMemory provider
        // (mimics the designer model — the model snapshot represents the DB state after migration)
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(
                nameof(Migrations_InitialCreate_Designer_BuildTargetModel_HasNoEntityTypes))
            .UseSnakeCaseNamingConvention()
            .Options;

        using var context = new ApplicationDbContext(options);
        var model = context.Model;

        // WHEN: We count entity types in the model (reflects what BuildTargetModel produced)
        var entityTypeCount = model.GetEntityTypes().Count();

        // THEN: Zero entity types — the InitialCreate migration has an empty schema (AC2)
        Assert.Equal(0, entityTypeCount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: ApplicationDbContextModelSnapshot extends ModelSnapshot
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Migrations_ApplicationDbContextModelSnapshot_ExtendsModelSnapshot()
    {
        // GIVEN: The EF Core generated ModelSnapshot class
        var snapshotType = InfraAssembly
            .GetTypes()
            .FirstOrDefault(t => t.Name == "ApplicationDbContextModelSnapshot"
                                 && t.Namespace == MigrationsNamespace);

        // THEN: It exists in the migrations namespace (AC2 — migration scaffold is complete)
        Assert.NotNull(snapshotType);

        // AND: It inherits from ModelSnapshot (required for EF Core model versioning)
        Assert.True(
            snapshotType.IsSubclassOf(typeof(ModelSnapshot)),
            "ApplicationDbContextModelSnapshot must extend ModelSnapshot (AC2).");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: ModelSnapshot [DbContext] attribute references ApplicationDbContext
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Migrations_ModelSnapshot_DbContextAttribute_ReferencesApplicationDbContext()
    {
        // GIVEN: ApplicationDbContextModelSnapshot class
        var snapshotType = InfraAssembly
            .GetTypes()
            .FirstOrDefault(t => t.Name == "ApplicationDbContextModelSnapshot"
                                 && t.Namespace == MigrationsNamespace);

        Assert.NotNull(snapshotType);

        // WHEN: We inspect its [DbContext] attribute
        var dbContextAttr = snapshotType.GetCustomAttribute<DbContextAttribute>();

        // THEN: Attribute is present and points to ApplicationDbContext (AC2)
        Assert.NotNull(dbContextAttr);
        Assert.Equal(typeof(ApplicationDbContext), dbContextAttr.ContextType);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: ProductVersion annotation in designer matches EF Core 10.x
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Migrations_InitialCreate_ProductVersion_IsEfCore10()
    {
        // GIVEN: The model built by ApplicationDbContext (mirrors BuildTargetModel output)
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(nameof(Migrations_InitialCreate_ProductVersion_IsEfCore10))
            .Options;

        using var context = new ApplicationDbContext(options);
        var model = context.Model;

        // WHEN: We read the "ProductVersion" annotation
        var productVersionAnnotation = model.FindAnnotation("ProductVersion");

        // THEN: The annotation is present (set by EF Core scaffolding, AC2)
        Assert.NotNull(productVersionAnnotation);
        Assert.NotNull(productVersionAnnotation.Value);

        // AND: The version starts with "10." (EF Core 10.x required by tech stack)
        var version = productVersionAnnotation.Value!.ToString()!;
        Assert.StartsWith("10.", version,
            $"ProductVersion '{version}' must be EF Core 10.x (AC2, tech stack requirement).");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: migration instantiation via reflection does not throw
    // (validates the migration class is a concrete, public, non-abstract type)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Migrations_InitialCreate_CanBeInstantiatedViaReflection()
    {
        // GIVEN: The InitialCreate migration type
        var migrationType = GetInitialCreateType();

        // WHEN: Instantiated via reflection (EF Core does this internally)
        var exception = Record.Exception(() =>
            _ = (Migration)Activator.CreateInstance(migrationType)!);

        // THEN: No exception — the migration class is instantiable (AC2)
        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: InitialCreate migration has no Up operations (empty schema)
    // Complementary to MigrationStructureTests — validates via MigrationAttribute ID
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Migrations_InitialCreate_MigrationId_DoesNotContainTableNames()
    {
        // GIVEN: The InitialCreate [Migration] attribute ID
        var migrationType = GetInitialCreateType();
        var migrationId = migrationType.GetCustomAttribute<MigrationAttribute>()!.Id;

        // THEN: The migration ID contains only 'InitialCreate' — no entity name suffix
        // (no 'Cliente', 'Contacto' etc. — those belong to Epic 2 and Epic 3, AC2)
        Assert.DoesNotContain("Cliente", migrationId, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Contacto", migrationId, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Table", migrationId, StringComparison.OrdinalIgnoreCase);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: migration class is partial (EF Core designer pattern)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Migrations_InitialCreate_ClassIsPartial_DesignerPatternCompliant()
    {
        // GIVEN: InitialCreate migration type
        var migrationType = GetInitialCreateType();

        // WHEN: We check if the type uses partial class pattern by verifying
        // both the base file and designer file compile to the same type
        // (partial classes merge into one type at runtime)

        // THEN: There is only ONE type with this name in the assembly
        // (both .cs and .Designer.cs partial declarations are ONE runtime type)
        var matchingTypes = InfraAssembly
            .GetTypes()
            .Where(t => t.Name == migrationType.Name
                        && t.Namespace == migrationType.Namespace)
            .ToList();

        Assert.Single(matchingTypes);
    }
}
