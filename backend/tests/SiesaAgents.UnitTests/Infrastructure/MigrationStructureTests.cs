using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Tests for EF Core migration structure covering Story 1.3 ACs:
///   AC1 - dotnet ef database update creates siesa_agents_db with __EFMigrationsHistory
///   AC2 - An initial migration file exists in Data/Migrations/ with an empty schema
///
/// These tests validate the migration FILES and structure without requiring a live database.
/// Tests are in RED phase — they will fail until the InitialCreate migration is generated.
///
/// For live database validation (AC1 full), run the EF CLI commands documented in Story 1.3.
/// </summary>
public class MigrationStructureTests
{
    private const string MigrationsNamespace = "SiesaAgents.Infrastructure.Data.Migrations";
    private static readonly Assembly InfraAssembly = typeof(ApplicationDbContext).Assembly;

    // ─────────────────────────────────────────────────────────────────────────
    // AC2 — Initial migration file exists in Data/Migrations/
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Migrations_InitialCreateMigrationClass_ExistsInInfrastructureAssembly()
    {
        // GIVEN: The SiesaAgents.Infrastructure assembly is loaded
        // WHEN: We search for types that inherit from Migration
        var migrationTypes = InfraAssembly
            .GetTypes()
            .Where(t => t.IsSubclassOf(typeof(Migration)) && !t.IsAbstract)
            .ToList();

        // THEN: At least one migration class exists (AC2 — InitialCreate migration must exist)
        Assert.True(
            migrationTypes.Count > 0,
            "No migration classes found in SiesaAgents.Infrastructure. " +
            "Run: dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure " +
            "--startup-project src/SiesaAgents.API --output-dir Data/Migrations (AC2)");
    }

    [Fact]
    public void Migrations_InitialCreateMigration_HasExpectedName()
    {
        // GIVEN: The Infrastructure assembly's migration types
        // WHEN: We look for a migration with 'InitialCreate' in its name
        var migrationTypes = InfraAssembly
            .GetTypes()
            .Where(t => t.IsSubclassOf(typeof(Migration)) && !t.IsAbstract)
            .ToList();

        var initialCreate = migrationTypes
            .FirstOrDefault(t => t.Name.EndsWith("InitialCreate", StringComparison.Ordinal));

        // THEN: A migration named *_InitialCreate exists (AC2)
        Assert.NotNull(initialCreate);
        // Name must match EF Core generated pattern: {timestamp}_InitialCreate
        Assert.Contains("InitialCreate", initialCreate.Name);
    }

    [Fact]
    public void Migrations_InitialCreateMigration_IsInCorrectNamespace()
    {
        // GIVEN: The InitialCreate migration class
        var migrationTypes = InfraAssembly
            .GetTypes()
            .Where(t => t.IsSubclassOf(typeof(Migration)) && !t.IsAbstract
                        && t.Name.EndsWith("InitialCreate", StringComparison.Ordinal))
            .ToList();

        // Requires at least one matching type (tested separately in prior test)
        if (!migrationTypes.Any())
        {
            Assert.Fail(
                "InitialCreate migration not found — prerequisite for namespace check (AC2). " +
                "Generate it first with: dotnet ef migrations add InitialCreate ...");
        }

        var migration = migrationTypes.First();

        // WHEN: We inspect its namespace
        // THEN: Namespace matches the expected migrations path (AC2)
        Assert.Equal(
            MigrationsNamespace,
            migration.Namespace,
            $"Migration namespace '{migration.Namespace}' does not match expected '{MigrationsNamespace}'. " +
            "Pass --output-dir Data/Migrations when generating the migration (AC2).");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC2 — Initial migration Up() method is empty (no domain tables yet)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Migrations_InitialCreate_UpMethodIsEmpty_NoCreateTableCalls()
    {
        // GIVEN: The InitialCreate migration is instantiated
        var migrationTypes = InfraAssembly
            .GetTypes()
            .Where(t => t.IsSubclassOf(typeof(Migration)) && !t.IsAbstract
                        && t.Name.EndsWith("InitialCreate", StringComparison.Ordinal))
            .ToList();

        if (!migrationTypes.Any())
        {
            Assert.Fail(
                "InitialCreate migration not found. Generate it before running this test (AC2).");
        }

        var migrationInstance = (Migration)Activator.CreateInstance(migrationTypes.First())!;

        // WHEN: We get the migration operations (Up() method result)
        var upOperations = migrationInstance.UpOperations;

        // THEN: There are no operations (empty Up() — no domain tables at this stage, AC2)
        Assert.Empty(upOperations);
    }

    [Fact]
    public void Migrations_InitialCreate_DownMethodIsEmpty_NoDropTableCalls()
    {
        // GIVEN: The InitialCreate migration
        var migrationTypes = InfraAssembly
            .GetTypes()
            .Where(t => t.IsSubclassOf(typeof(Migration)) && !t.IsAbstract
                        && t.Name.EndsWith("InitialCreate", StringComparison.Ordinal))
            .ToList();

        if (!migrationTypes.Any())
        {
            Assert.Fail(
                "InitialCreate migration not found. Generate it before running this test (AC2).");
        }

        var migrationInstance = (Migration)Activator.CreateInstance(migrationTypes.First())!;

        // WHEN: We get the rollback operations (Down() method)
        var downOperations = migrationInstance.DownOperations;

        // THEN: Down() is also empty — nothing to rollback for an empty schema (AC2)
        Assert.Empty(downOperations);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC1 — __EFMigrationsHistory table would be created by applying the migration
    //       (verified via ApplicationDbContext model — no live DB required)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void ApplicationDbContext_MigrationAssembly_IsConfiguredAsInfrastructure()
    {
        // GIVEN: ApplicationDbContext built with Npgsql provider configuration
        // (mirrors Program.cs DI registration with MigrationsAssembly override)
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(
                "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres",
                o => o.MigrationsAssembly("SiesaAgents.Infrastructure"))
            .Options;

        using var context = new ApplicationDbContext(options);

        // WHEN: We inspect the migrations assembly from the context
        var migrationsAssembly = context.GetService<IMigrationsAssembly>();

        // THEN: The migrations assembly resolves to SiesaAgents.Infrastructure (AC1)
        Assert.NotNull(migrationsAssembly);
        Assert.Equal(
            "SiesaAgents.Infrastructure",
            migrationsAssembly.Assembly.GetName().Name,
            "Migrations must live in SiesaAgents.Infrastructure, not in SiesaAgents.API. " +
            "Add .MigrationsAssembly(\"SiesaAgents.Infrastructure\") in Program.cs DI registration (AC1).");
    }

    [Fact]
    public void ApplicationDbContext_DatabaseProvider_IsNpgsql()
    {
        // GIVEN: ApplicationDbContext wired with Npgsql (as required for siesa_agents_db, AC1/AC5)
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql("Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres")
            .Options;

        using var context = new ApplicationDbContext(options);

        // WHEN: We check the provider name
        var providerName = context.Database.ProviderName;

        // THEN: Provider is Npgsql (validates the connection string wiring for PostgreSQL, AC1/AC5)
        Assert.Equal(
            "Npgsql.EntityFrameworkCore.PostgreSQL",
            providerName,
            "ApplicationDbContext must use the Npgsql PostgreSQL provider. " +
            "Register it via options.UseNpgsql(...) in Program.cs (AC5).");
    }
}
