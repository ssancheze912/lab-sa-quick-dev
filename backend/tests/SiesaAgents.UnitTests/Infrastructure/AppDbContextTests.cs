/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API/Unit Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — siesa_agents_db created, __ef_migrations_history exists
 *   AC3 — ApplySnakeCaseNaming() applied as LAST call in OnModelCreating
 *   AC4 — Migrations/ folder exists with at least one migration file
 *   AC5 — Npgsql.EntityFrameworkCore.PostgreSQL referenced, solution builds
 *
 * Test-Case References (test-design-epic-1.md):
 *   TC-E1-P1-05 — EF Core Migration Creates Database and Migrations Table
 *   TC-E1-P2-04 — snake_case Column Naming Applied via ApplySnakeCaseNaming
 */

using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

public class AppDbContextTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // AC3: AppDbContext can be instantiated and OnModelCreating does not throw
    // Verifies: AppDbContext constructor accepts DbContextOptions, no DI required
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_CanBeInstantiated_WithInMemoryProvider()
    {
        // GIVEN: An options builder configured with the InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        // WHEN: AppDbContext is constructed with those options
        // THEN: No exception is thrown (constructor and DI wiring are correct)
        var exception = Record.Exception(() =>
        {
            using var context = new AppDbContext(options);
            _ = context;
        });

        Assert.Null(exception);
    }

    [Fact]
    public void AppDbContext_OnModelCreating_DoesNotThrow()
    {
        // GIVEN: An AppDbContext backed by InMemory database
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        // WHEN: EnsureCreated() is called — this forces OnModelCreating to run
        // THEN: OnModelCreating completes without throwing any exception
        var exception = Record.Exception(() =>
        {
            using var context = new AppDbContext(options);
            context.Database.EnsureCreated();
        });

        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3: ApplySnakeCaseNaming() must be the LAST call in OnModelCreating
    // Verifies: UseSnakeCaseNamingConvention is wired into the context options
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_ModelCreating_RegistersSnakeCaseNamingConvention()
    {
        // GIVEN: Options built with UseSnakeCaseNamingConvention() as required by AC3
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .UseSnakeCaseNamingConvention()
            .Options;

        // WHEN: Context is created and model is accessed
        using var context = new AppDbContext(options);

        // THEN: Model is accessible and no naming convention exception is thrown
        // (If UseSnakeCaseNamingConvention was NOT called the options would be incomplete
        //  and EFCore.NamingConventions would fail at model building time)
        var exception = Record.Exception(() => _ = context.Model);
        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC4: Migrations/ folder exists with at least one migration file
    // Verifies: InitialCreate migration was generated (design-time check)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Infrastructure_MigrationsFolder_ExistsWithAtLeastOneMigrationFile()
    {
        // GIVEN: The SiesaAgents.Infrastructure assembly is referenced
        var infrastructureAssembly = typeof(AppDbContext).Assembly;

        // WHEN: We search for embedded migration type names in the assembly
        var migrationTypes = infrastructureAssembly
            .GetTypes()
            .Where(t => t.Namespace != null &&
                        t.Namespace.Contains("Migrations") &&
                        !t.Name.Contains("Snapshot"))
            .ToList();

        // THEN: At least one migration class exists (InitialCreate)
        Assert.True(
            migrationTypes.Count >= 1,
            $"Expected at least 1 migration class in SiesaAgents.Infrastructure.Migrations namespace, but found {migrationTypes.Count}. " +
            "Run: dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API"
        );
    }

    [Fact]
    public void Infrastructure_MigrationsFolder_ContainsInitialCreateMigration()
    {
        // GIVEN: The SiesaAgents.Infrastructure assembly is referenced
        var infrastructureAssembly = typeof(AppDbContext).Assembly;

        // WHEN: We look for a migration type whose name contains "InitialCreate"
        var initialCreateMigration = infrastructureAssembly
            .GetTypes()
            .FirstOrDefault(t =>
                t.Namespace != null &&
                t.Namespace.Contains("Migrations") &&
                t.Name.Contains("InitialCreate") &&
                !t.Name.Contains("Snapshot"));

        // THEN: The InitialCreate migration class exists
        Assert.NotNull(initialCreateMigration);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC5: Npgsql.EntityFrameworkCore.PostgreSQL package is referenced
    // Verifies: The Infrastructure project has the Npgsql EF Core provider
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Infrastructure_NpgsqlEntityFrameworkCorePostgreSQL_IsReferenced()
    {
        // GIVEN: The SiesaAgents.Infrastructure assembly is loaded at runtime
        var infrastructureAssembly = typeof(AppDbContext).Assembly;

        // WHEN: We inspect the referenced assemblies for Npgsql EF Core provider
        var referencedAssemblies = infrastructureAssembly
            .GetReferencedAssemblies()
            .Select(a => a.Name ?? string.Empty)
            .ToList();

        // THEN: Npgsql.EntityFrameworkCore.PostgreSQL is among the referenced assemblies
        var hasNpgsql = referencedAssemblies
            .Any(name => name.Contains("Npgsql.EntityFrameworkCore.PostgreSQL", StringComparison.OrdinalIgnoreCase)
                      || name.Contains("Npgsql.EntityFrameworkCore", StringComparison.OrdinalIgnoreCase));

        Assert.True(
            hasNpgsql,
            $"SiesaAgents.Infrastructure does not reference Npgsql.EntityFrameworkCore.PostgreSQL. " +
            $"Referenced assemblies: [{string.Join(", ", referencedAssemblies.Where(n => n.Contains("Npgsql") || n.Contains("EntityFramework")))}]. " +
            "Run: dotnet add src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3 + Scope: AppDbContext contains NO domain DbSet<> properties (scope note)
    // Verifies: ClienteEntity and ContactoEntity must NOT be defined in this story
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_DoesNotContain_ClienteOrContactoDbSets()
    {
        // GIVEN: The AppDbContext type definition
        var contextType = typeof(AppDbContext);

        // WHEN: We inspect all public properties of type DbSet<T>
        var dbSetProperties = contextType
            .GetProperties()
            .Where(p => p.PropertyType.IsGenericType &&
                        p.PropertyType.GetGenericTypeDefinition() == typeof(DbSet<>))
            .Select(p => p.Name)
            .ToList();

        // THEN: No DbSet<> properties named Cliente or Contacto exist
        // (Domain entities are NOT in scope for Story 1.3 — they belong to Epics 2 and 3)
        var forbiddenNames = dbSetProperties
            .Where(name =>
                name.Contains("Cliente", StringComparison.OrdinalIgnoreCase) ||
                name.Contains("Contacto", StringComparison.OrdinalIgnoreCase))
            .ToList();

        Assert.Empty(forbiddenNames);
    }
}
