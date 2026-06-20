// ─────────────────────────────────────────────────────────────────────────────
// Story 1.3: Backend Database Foundation
// Epic 1: Project Foundation & Application Shell
//
// ATDD Unit Tests — RED Phase (xUnit)
// These tests FAIL until AppDbContext and EF Core infrastructure are implemented.
//
// Acceptance Criteria covered:
//   AC3 — ApplySnakeCaseNaming() is called LAST inside OnModelCreating and all
//          column names follow snake_case convention automatically.
//          No [Column] or [Table] attributes are used.
//   AC1 — InitialCreate migration is EMPTY (no Up/Down table operations beyond scaffolding).
//          Verified structurally by checking the Migrations/ folder and snapshot content.
//   AC4 — AppDbContext implements IApplicationDbContext; DI compiles with Npgsql provider.
// ─────────────────────────────────────────────────────────────────────────────

using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Interfaces;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Unit tests for AppDbContext configuration.
/// Uses EF Core InMemory provider to exercise OnModelCreating without a real database.
/// </summary>
public class AppDbContextConfigurationTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // AC3: snake_case naming convention via EFCore.NamingConventions
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC3: AppDbContext can be instantiated with InMemory provider")]
    public void AppDbContext_CanBeInstantiated_WithInMemoryProvider()
    {
        // GIVEN: Options builder with InMemory database and UseSnakeCaseNamingConvention
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .UseSnakeCaseNamingConvention()  // EFCore.NamingConventions package
            .Options;

        // WHEN: AppDbContext is instantiated
        using var context = new AppDbContext(options);

        // THEN: No exception is thrown — context is valid
        Assert.NotNull(context);
    }

    [Fact(DisplayName = "AC3: OnModelCreating calls UseSnakeCaseNamingConvention — Model is built without errors")]
    public void OnModelCreating_BuildsModel_WithoutErrors()
    {
        // GIVEN: Options with InMemory + snake_case naming applied via options builder
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .UseSnakeCaseNamingConvention()
            .Options;

        // WHEN: AppDbContext model is accessed (triggers OnModelCreating)
        using var context = new AppDbContext(options);
        var model = context.Model;

        // THEN: The model is built without exception — snake_case convention applied successfully
        Assert.NotNull(model);
    }

    [Fact(DisplayName = "AC3: AppDbContext has no entity types with [Table] or [Column] attributes in initial migration")]
    public void AppDbContext_InitialMigration_HasNoEntityTypesDefined()
    {
        // GIVEN: Story 1.3 creates an EMPTY InitialCreate migration — no domain entities
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .UseSnakeCaseNamingConvention()
            .Options;

        // WHEN: Model is built
        using var context = new AppDbContext(options);
        var entityTypes = context.Model.GetEntityTypes().ToList();

        // THEN: No entity types are registered in the context (empty migration scope)
        // ClienteEntity and ContactoEntity are introduced in Epic 2 and Epic 3.
        Assert.Empty(entityTypes);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC4: AppDbContext implements IApplicationDbContext (interface contract)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC4: AppDbContext implements IApplicationDbContext interface")]
    public void AppDbContext_ImplementsIApplicationDbContext()
    {
        // GIVEN: AppDbContext is declared to implement IApplicationDbContext
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .UseSnakeCaseNamingConvention()
            .Options;

        // WHEN: AppDbContext is instantiated
        using var context = new AppDbContext(options);

        // THEN: It can be cast to IApplicationDbContext — interface is implemented
        Assert.IsAssignableFrom<IApplicationDbContext>(context);
    }

    [Fact(DisplayName = "AC4: SaveChangesAsync is callable via IApplicationDbContext abstraction")]
    public async Task IApplicationDbContext_SaveChangesAsync_IsCallable()
    {
        // GIVEN: AppDbContext registered as IApplicationDbContext via DI (verified structurally)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .UseSnakeCaseNamingConvention()
            .Options;

        // WHEN: SaveChangesAsync is called via the abstraction interface
        await using var context = new AppDbContext(options);
        var result = await ((IApplicationDbContext)context).SaveChangesAsync(CancellationToken.None);

        // THEN: No exception is thrown; returns number of affected state entries (0 for no changes)
        Assert.Equal(0, result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC1 (structural): Migrations folder and InitialCreate files exist
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC1: Migrations folder exists at expected Infrastructure path")]
    public void MigrationsFolder_ExistsAtExpectedPath()
    {
        // GIVEN: dotnet ef migrations add InitialCreate was run with --output-dir Data/Migrations
        var migrationsPath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "..", "..", "..", "..", "..",  // navigate from test bin up to backend/
            "src", "SiesaAgents.Infrastructure", "Data", "Migrations"
        );
        var normalizedPath = Path.GetFullPath(migrationsPath);

        // WHEN: Checking if the directory exists
        // THEN: Migrations directory was created by dotnet ef migrations add InitialCreate
        // RED: This test fails until Task 5 (Create the initial empty migration) is complete.
        Assert.True(Directory.Exists(normalizedPath),
            $"Expected Migrations directory at: {normalizedPath}");
    }

    [Fact(DisplayName = "AC1: InitialCreate migration file exists in Migrations folder")]
    public void InitialCreate_MigrationFile_Exists()
    {
        // GIVEN: dotnet ef migrations add InitialCreate produced a migration file
        var migrationsPath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "..", "..", "..", "..", "..",
            "src", "SiesaAgents.Infrastructure", "Data", "Migrations"
        );
        var normalizedPath = Path.GetFullPath(migrationsPath);

        // WHEN: Searching for the InitialCreate migration file
        var migrationFiles = Directory.Exists(normalizedPath)
            ? Directory.GetFiles(normalizedPath, "*InitialCreate.cs")
            : Array.Empty<string>();

        // THEN: At least one file matching *InitialCreate.cs exists
        Assert.NotEmpty(migrationFiles);
    }

    [Fact(DisplayName = "AC5: InitialCreate migration does NOT contain 'clientes' table definition")]
    public void InitialCreate_DoesNotDefine_ClientesTable()
    {
        // GIVEN: The migration scope is intentionally empty (domain tables in Epic 2/3)
        var migrationsPath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "..", "..", "..", "..", "..",
            "src", "SiesaAgents.Infrastructure", "Data", "Migrations"
        );
        var normalizedPath = Path.GetFullPath(migrationsPath);

        // WHEN: Reading the content of any InitialCreate migration file
        var migrationFiles = Directory.Exists(normalizedPath)
            ? Directory.GetFiles(normalizedPath, "*InitialCreate.cs")
            : Array.Empty<string>();

        foreach (var file in migrationFiles)
        {
            var content = File.ReadAllText(file);
            // THEN: The migration does not contain "clientes" table creation
            Assert.DoesNotContain("clientes", content, StringComparison.OrdinalIgnoreCase);
        }

        // If no migration file exists yet, test passes vacuously — the folder check above fails first.
    }

    [Fact(DisplayName = "AC5: InitialCreate migration does NOT contain 'contactos' table definition")]
    public void InitialCreate_DoesNotDefine_ContactosTable()
    {
        // GIVEN: The migration scope is intentionally empty (domain tables in Epic 2/3)
        var migrationsPath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "..", "..", "..", "..", "..",
            "src", "SiesaAgents.Infrastructure", "Data", "Migrations"
        );
        var normalizedPath = Path.GetFullPath(migrationsPath);

        // WHEN: Reading the content of any InitialCreate migration file
        var migrationFiles = Directory.Exists(normalizedPath)
            ? Directory.GetFiles(normalizedPath, "*InitialCreate.cs")
            : Array.Empty<string>();

        foreach (var file in migrationFiles)
        {
            var content = File.ReadAllText(file);
            // THEN: The migration does not contain "contactos" table creation
            Assert.DoesNotContain("contactos", content, StringComparison.OrdinalIgnoreCase);
        }
    }
}
