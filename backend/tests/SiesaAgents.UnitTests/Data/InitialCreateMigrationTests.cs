using System.Reflection;
using Microsoft.EntityFrameworkCore.Migrations;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Data;

/// <summary>
/// Story 1.3 — Backend Database Foundation.
///
/// Postgres-independent structural guards on the shipped <c>InitialCreate</c> migration:
///   - AC #1/#2 — <c>Up()</c> emits ZERO migration operations (empty migration).
///   - AC #1/#2 — <c>Down()</c> emits ZERO migration operations.
///   - AC #1    — Migration class exists in the correct namespace.
///
/// These tests reflect over the compiled Infrastructure assembly. They cannot be spoofed by
/// accidentally adding a <c>DbSet&lt;&gt;</c> (which would cause EF to emit CreateTableOperation
/// entries into <c>Up()</c> at scaffold time).
/// </summary>
public class InitialCreateMigrationTests
{
    // ---------------------------------------------------------------------
    // AC #1/#2 — The initial migration must be empty.
    // ---------------------------------------------------------------------

    [Fact(DisplayName = "[P1][unit] AC#1/#2 — InitialCreate.Up() emits zero migration operations")]
    public void InitialCreate_Up_ProducesZeroOperations()
    {
        var migration = InstantiateInitialCreate();

        // WHEN the migration is materialised into MigrationOperations
        var ops = migration.UpOperations;

        // THEN no CreateTable, AddColumn, etc. is emitted (guards against accidental DbSet<> being added)
        Assert.Empty(ops);
    }

    [Fact(DisplayName = "[P1][unit] AC#1/#2 — InitialCreate.Down() emits zero migration operations")]
    public void InitialCreate_Down_ProducesZeroOperations()
    {
        var migration = InstantiateInitialCreate();

        var ops = migration.DownOperations;

        Assert.Empty(ops);
    }

    // ---------------------------------------------------------------------
    // AC #1 — Migration class is properly declared in the Infrastructure assembly.
    // ---------------------------------------------------------------------

    [Fact(DisplayName = "[P2][unit] AC#1 — InitialCreate migration type lives in Infrastructure.Data.Migrations")]
    public void InitialCreate_Type_LivesInExpectedNamespace()
    {
        var type = ResolveInitialCreateType();

        Assert.Equal("SiesaAgents.Infrastructure.Data.Migrations", type.Namespace);
        Assert.True(typeof(Migration).IsAssignableFrom(type),
            "InitialCreate must inherit from Microsoft.EntityFrameworkCore.Migrations.Migration.");
    }

    [Fact(DisplayName = "[P2][unit] AC#1 — InitialCreate migration is decorated with [Migration] and matches the AppDbContext")]
    public void InitialCreate_HasMigrationAttribute_TargetingAppDbContext()
    {
        var type = ResolveInitialCreateType();

        // MigrationAttribute stamps the migration identifier onto the class
        var migrationAttr = type.GetCustomAttributes()
            .SingleOrDefault(a => a.GetType().Name == "MigrationAttribute");
        Assert.NotNull(migrationAttr);

        // The generated snapshot pairs the migration with AppDbContext via DbContextAttribute
        var designerType = type.Assembly.GetTypes()
            .SingleOrDefault(t => t.Name == "AppDbContextModelSnapshot");
        Assert.NotNull(designerType);

        var dbContextAttr = designerType!.GetCustomAttributes()
            .SingleOrDefault(a => a.GetType().Name == "DbContextAttribute");
        Assert.NotNull(dbContextAttr);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private static Migration InstantiateInitialCreate()
    {
        var type = ResolveInitialCreateType();
        var instance = Activator.CreateInstance(type)
            ?? throw new InvalidOperationException("Failed to instantiate InitialCreate migration.");
        return (Migration)instance;
    }

    private static Type ResolveInitialCreateType()
    {
        var assembly = typeof(AppDbContext).Assembly;
        var type = assembly.GetTypes()
            .SingleOrDefault(t =>
                t.Namespace == "SiesaAgents.Infrastructure.Data.Migrations" &&
                t.Name == "InitialCreate")
            ?? throw new InvalidOperationException(
                "InitialCreate migration type not found in SiesaAgents.Infrastructure assembly.");
        return type;
    }
}
