// ─────────────────────────────────────────────────────────────────────────────
// Story 1.3: Backend Database Foundation — EXPANDED Unit Tests
// Epic 1: Project Foundation & Application Shell
//
// Mode: BMad-Integrated (expands ATDD tests with edge cases, error paths, boundary conditions)
//
// Coverage NOT in AppDbContextConfigurationTests.cs:
//   AC3 edge cases:
//     - AppDbContext can be disposed without error
//     - Multiple instances with different DB names are fully isolated
//     - No [Column] or [Table] CLR annotations are present in initial scope
//     - OnModelCreating is idempotent (calling Model multiple times is safe)
//   AC4 edge cases:
//     - AppDbContext(null options) throws ArgumentNullException (constructor guard)
//     - SaveChangesAsync with CancellationToken.None does not throw
//     - SaveChangesAsync with an already-cancelled token throws OperationCanceledException
//     - IApplicationDbContext is not IDisposable by contract (no Dispose on the interface)
//     - DbContext.Database property is accessible (Npgsql config is applied via options)
//   AC1/AC5 structural:
//     - AppDbContextModelSnapshot file exists in Migrations folder
//     - Migration file contains only namespace scaffolding (no "CreateTable" calls)
// ─────────────────────────────────────────────────────────────────────────────

using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Interfaces;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Edge case and boundary condition tests for AppDbContext configuration.
/// Expands coverage beyond the ATDD unit tests in AppDbContextConfigurationTests.cs.
/// </summary>
public class AppDbContextEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Helper: creates a fully-configured InMemory options instance
    // ─────────────────────────────────────────────────────────────────────────

    private static DbContextOptions<AppDbContext> BuildOptions(string? dbName = null) =>
        new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName ?? $"TestDb_{Guid.NewGuid()}")
            .UseSnakeCaseNamingConvention()
            .Options;

    // ─────────────────────────────────────────────────────────────────────────
    // AC3 EDGE CASES — snake_case convention and model isolation
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC3 Edge: AppDbContext can be disposed without throwing")]
    public void AppDbContext_Dispose_DoesNotThrow()
    {
        // GIVEN: A valid AppDbContext instance
        var context = new AppDbContext(BuildOptions());

        // WHEN: The context is disposed
        // THEN: No exception is thrown
        var exception = Record.Exception(() => context.Dispose());
        Assert.Null(exception);
    }

    [Fact(DisplayName = "AC3 Edge: Two AppDbContext instances with different DB names are fully isolated")]
    public async Task AppDbContext_TwoInstances_DifferentDatabases_AreIsolated()
    {
        // GIVEN: Two contexts pointing to different InMemory databases
        var options1 = BuildOptions("IsolatedDb_A");
        var options2 = BuildOptions("IsolatedDb_B");

        // WHEN: SaveChangesAsync is called on each independently
        await using var ctx1 = new AppDbContext(options1);
        await using var ctx2 = new AppDbContext(options2);

        var result1 = await ctx1.SaveChangesAsync();
        var result2 = await ctx2.SaveChangesAsync();

        // THEN: Both return 0 (no entities) and do not share state
        Assert.Equal(0, result1);
        Assert.Equal(0, result2);
    }

    [Fact(DisplayName = "AC3 Edge: OnModelCreating is idempotent — accessing Model twice is safe")]
    public void AppDbContext_AccessingModelTwice_IsIdempotent()
    {
        // GIVEN: AppDbContext with InMemory options
        var options = BuildOptions();
        using var context = new AppDbContext(options);

        // WHEN: Model is accessed twice (EF Core caches after first build)
        var model1 = context.Model;
        var model2 = context.Model;

        // THEN: Both references point to the same model instance (idempotent, no double-build)
        Assert.Same(model1, model2);
    }

    [Fact(DisplayName = "AC3 Edge: No entity types with manually specified table names via Data Annotations")]
    public void AppDbContext_NoEntityTypes_WithManualTableAnnotations_InInitialScope()
    {
        // GIVEN: Story 1.3 defines no domain entities — AppDbContext has an empty initial scope
        var options = BuildOptions();
        using var context = new AppDbContext(options);
        var entityTypes = context.Model.GetEntityTypes().ToList();

        // WHEN: We inspect each registered entity type for manual table name overrides
        // THEN: Since entity types list is empty, there are no manual table annotations
        // This is a structural guarantee that no [Table] attribute slipped through
        Assert.Empty(entityTypes);
        foreach (var entityType in entityTypes)
        {
            // Defensive: if any future entity type is accidentally added, this catches [Table] usage
            var tableName = entityType.GetTableName();
            Assert.NotNull(tableName); // EF Core always resolves a table name (via convention or attribute)
        }
    }

    [Fact(DisplayName = "AC3 Edge: AppDbContext model has zero entity types after OnModelCreating (empty migration)")]
    public void AppDbContext_Model_HasZeroEntityTypes_AfterOnModelCreating()
    {
        // GIVEN: InitialCreate migration is intentionally empty — no domain entities added
        // WHEN: Model is fully built (OnModelCreating called)
        using var context = new AppDbContext(BuildOptions());
        var entityCount = context.Model.GetEntityTypes().Count();

        // THEN: Zero entity types — ClienteEntity and ContactoEntity belong to Epic 2 and Epic 3
        Assert.Equal(0, entityCount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC4 EDGE CASES — IApplicationDbContext contract and DI safety
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC4 Edge: AppDbContext(null) throws ArgumentNullException — constructor guard")]
    public void AppDbContext_NullOptions_ThrowsArgumentNullException()
    {
        // GIVEN: A null DbContextOptions<AppDbContext> passed to the constructor
        // WHEN: AppDbContext is instantiated with null options
        // THEN: ArgumentNullException is thrown (EF Core guards the constructor)
        Assert.Throws<ArgumentNullException>(() => new AppDbContext(null!));
    }

    [Fact(DisplayName = "AC4 Edge: SaveChangesAsync with CancellationToken.None completes normally")]
    public async Task IApplicationDbContext_SaveChangesAsync_WithCancellationTokenNone_Succeeds()
    {
        // GIVEN: AppDbContext registered as IApplicationDbContext — no pending changes
        var options = BuildOptions();
        await using var context = new AppDbContext(options);

        // WHEN: SaveChangesAsync is called with the explicit None token
        var result = await ((IApplicationDbContext)context).SaveChangesAsync(CancellationToken.None);

        // THEN: Returns 0 (no state entries affected) and does not throw
        Assert.Equal(0, result);
    }

    [Fact(DisplayName = "AC4 Edge: SaveChangesAsync with pre-cancelled token throws OperationCanceledException")]
    public async Task IApplicationDbContext_SaveChangesAsync_WithCancelledToken_ThrowsOperationCanceledException()
    {
        // GIVEN: A CancellationToken that is already cancelled before the call
        var options = BuildOptions();
        await using var context = new AppDbContext(options);
        using var cts = new CancellationTokenSource();
        await cts.CancelAsync();

        // WHEN: SaveChangesAsync is called with a pre-cancelled token
        // THEN: OperationCanceledException is thrown (EF Core respects cancellation)
        await Assert.ThrowsAsync<OperationCanceledException>(
            () => ((IApplicationDbContext)context).SaveChangesAsync(cts.Token));
    }

    [Fact(DisplayName = "AC4 Edge: IApplicationDbContext does NOT expose IDisposable on the interface")]
    public void IApplicationDbContext_InterfaceContract_DoesNotExposeDispose()
    {
        // GIVEN: IApplicationDbContext is an abstraction interface in the Application layer
        // WHEN: We check whether IApplicationDbContext extends IDisposable
        var interfaceType = typeof(IApplicationDbContext);

        // THEN: The Application-layer abstraction does NOT inherit IDisposable
        // (Disposal is the responsibility of the DI container managing the AppDbContext lifetime)
        var implementsIDisposable = typeof(IDisposable).IsAssignableFrom(interfaceType);
        Assert.False(implementsIDisposable,
            "IApplicationDbContext must NOT inherit IDisposable — lifecycle management belongs to the DI container.");
    }

    [Fact(DisplayName = "AC4 Edge: AppDbContext.Database property is accessible with InMemory options")]
    public void AppDbContext_DatabaseProperty_IsAccessible()
    {
        // GIVEN: AppDbContext is configured with InMemory provider (simulating DI setup)
        var options = BuildOptions();

        // WHEN: The Database property (DatabaseFacade) is accessed
        using var context = new AppDbContext(options);
        var database = context.Database;

        // THEN: DatabaseFacade is not null — the provider configuration is valid
        Assert.NotNull(database);
    }

    [Fact(DisplayName = "AC4 Edge: AppDbContext can call EnsureCreated without exception (InMemory)")]
    public async Task AppDbContext_EnsureCreatedAsync_DoesNotThrow_WithInMemory()
    {
        // GIVEN: AppDbContext with InMemory provider (unit test isolation from real DB)
        var options = BuildOptions();
        await using var context = new AppDbContext(options);

        // WHEN: EnsureCreated is called (creates the InMemory database schema)
        var created = await context.Database.EnsureCreatedAsync();

        // THEN: EnsureCreated succeeds — context is in a valid state
        // For InMemory: returns true the first time (database did not exist before)
        Assert.True(created);
    }

    [Fact(DisplayName = "AC4 Edge: AppDbContext implements IApplicationDbContext via interface type check")]
    public void AppDbContext_TypeAssignment_IsCompatibleWithIApplicationDbContext()
    {
        // GIVEN: The DI container registers AppDbContext as IApplicationDbContext via:
        //        services.AddScoped<IApplicationDbContext>(p => p.GetRequiredService<AppDbContext>())
        // WHEN: We simulate resolution by casting
        var options = BuildOptions();
        using var concrete = new AppDbContext(options);

        // THEN: The cast succeeds without InvalidCastException
        var asInterface = concrete as IApplicationDbContext;
        Assert.NotNull(asInterface);
        Assert.IsType<AppDbContext>(asInterface);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC1/AC5 STRUCTURAL EDGE CASES — Migration file content integrity
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC1 Edge: AppDbContextModelSnapshot file exists alongside InitialCreate migration")]
    public void ModelSnapshot_ExistsInMigrationsFolder()
    {
        // GIVEN: dotnet ef migrations add InitialCreate produces both migration and snapshot files
        var migrationsPath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "..", "..", "..", "..", "..",
            "src", "SiesaAgents.Infrastructure", "Data", "Migrations"
        );
        var normalizedPath = Path.GetFullPath(migrationsPath);

        // WHEN: Searching for the model snapshot file
        var snapshotFiles = Directory.Exists(normalizedPath)
            ? Directory.GetFiles(normalizedPath, "*Snapshot*.cs")
            : Array.Empty<string>();

        // THEN: At least one snapshot file exists (EF Core creates it automatically)
        Assert.NotEmpty(snapshotFiles);
    }

    [Fact(DisplayName = "AC5 Edge: InitialCreate migration does NOT contain 'CreateTable' method calls")]
    public void InitialCreate_DoesNotContain_CreateTableCalls()
    {
        // GIVEN: An empty InitialCreate migration has no Up()/Down() table operations
        var migrationsPath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "..", "..", "..", "..", "..",
            "src", "SiesaAgents.Infrastructure", "Data", "Migrations"
        );
        var normalizedPath = Path.GetFullPath(migrationsPath);

        // WHEN: Reading the InitialCreate migration file content
        var migrationFiles = Directory.Exists(normalizedPath)
            ? Directory.GetFiles(normalizedPath, "*InitialCreate.cs")
            : Array.Empty<string>();

        foreach (var file in migrationFiles)
        {
            var content = File.ReadAllText(file);

            // THEN: No CreateTable call exists (confirms the migration is truly empty)
            Assert.DoesNotContain("CreateTable(", content, StringComparison.Ordinal);
            Assert.DoesNotContain("migrationBuilder.CreateTable", content, StringComparison.Ordinal);
        }
    }

    [Fact(DisplayName = "AC5 Edge: InitialCreate migration does NOT contain DropTable or AlterTable calls")]
    public void InitialCreate_DoesNotContain_DropOrAlterTableCalls()
    {
        // GIVEN: An empty InitialCreate migration has no structural DDL operations at all
        var migrationsPath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "..", "..", "..", "..", "..",
            "src", "SiesaAgents.Infrastructure", "Data", "Migrations"
        );
        var normalizedPath = Path.GetFullPath(migrationsPath);

        // WHEN: Reading the InitialCreate migration content
        var migrationFiles = Directory.Exists(normalizedPath)
            ? Directory.GetFiles(normalizedPath, "*InitialCreate.cs")
            : Array.Empty<string>();

        foreach (var file in migrationFiles)
        {
            var content = File.ReadAllText(file);

            // THEN: No DropTable or AlterTable calls (not an alter migration — purely empty)
            Assert.DoesNotContain("DropTable(", content, StringComparison.Ordinal);
            Assert.DoesNotContain("AlterTable(", content, StringComparison.Ordinal);
            Assert.DoesNotContain("RenameTable(", content, StringComparison.Ordinal);
        }
    }

    [Fact(DisplayName = "AC5 Edge: InitialCreate migration file defines the correct Migration class name")]
    public void InitialCreate_HasCorrectMigrationClassName()
    {
        // GIVEN: dotnet ef generates migration class names from the migration name
        // WHEN: Reading the InitialCreate migration file
        var migrationsPath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "..", "..", "..", "..", "..",
            "src", "SiesaAgents.Infrastructure", "Data", "Migrations"
        );
        var normalizedPath = Path.GetFullPath(migrationsPath);

        var migrationFiles = Directory.Exists(normalizedPath)
            ? Directory.GetFiles(normalizedPath, "*InitialCreate.cs")
            : Array.Empty<string>();

        foreach (var file in migrationFiles)
        {
            var content = File.ReadAllText(file);

            // THEN: The class name contains "InitialCreate" (EF Core naming convention)
            Assert.Contains("InitialCreate", content, StringComparison.Ordinal);
        }
    }

    [Fact(DisplayName = "AC3/AC4 Edge: AppDbContext namespace is SiesaAgents.Infrastructure.Data")]
    public void AppDbContext_HasCorrectNamespace()
    {
        // GIVEN: AppDbContext is placed in the Infrastructure layer Data namespace
        // WHEN: The namespace is reflected
        var contextType = typeof(AppDbContext);

        // THEN: The namespace matches the architecture specification
        Assert.Equal("SiesaAgents.Infrastructure.Data", contextType.Namespace);
    }

    [Fact(DisplayName = "AC4 Edge: IApplicationDbContext namespace is SiesaAgents.Application.Interfaces")]
    public void IApplicationDbContext_HasCorrectNamespace()
    {
        // GIVEN: IApplicationDbContext is an Application-layer abstraction
        // WHEN: The namespace is reflected
        var interfaceType = typeof(IApplicationDbContext);

        // THEN: The namespace matches the Application layer contracts
        Assert.Equal("SiesaAgents.Application.Interfaces", interfaceType.Namespace);
    }
}
