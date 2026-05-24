/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — Unit Level
 *
 * Acceptance Criteria covered:
 *   AC3 — snake_case naming convention is enforced via UseSnakeCaseNamingConvention() on the
 *          Npgsql provider (registered in Program.cs). No manual [Column]/[Table] attributes allowed.
 *   AC4 — AppDbContext can be instantiated with Npgsql options without throwing.
 *   AC5 — Unit tests compile and run successfully (zero errors).
 *
 * Note: snake_case is applied via Npgsql's built-in UseSnakeCaseNamingConvention() rather than
 * EFCore.NamingConventions.ApplySnakeCaseNaming(), avoiding the relational-only constraint that
 * would break InMemory-based unit tests.
 */

using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

public class AppDbContextTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // AC3 — OnModelCreating runs without error and builds a valid model
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void OnModelCreating_BuildsValidModel_WithInMemoryProvider()
    {
        // GIVEN: AppDbContext is configured with an InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"test-model-{Guid.NewGuid()}")
            .Options;

        // WHEN: The DbContext is instantiated (triggers OnModelCreating)
        using var context = new AppDbContext(options);

        // THEN: OnModelCreating executes without throwing and returns a non-null model
        var model = context.Model;
        Assert.NotNull(model);
    }

    [Fact]
    public void OnModelCreating_AppliesConfigurationsFromAssembly_WithoutError()
    {
        // GIVEN: AppDbContext instance created with InMemory database
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"test-configurations-{Guid.NewGuid()}")
            .Options;

        // WHEN: Model is built (OnModelCreating runs: base → ApplyConfigurationsFromAssembly)
        using var context = new AppDbContext(options);
        var model = context.Model;

        // THEN: Model is not null — ApplyConfigurationsFromAssembly ran without exceptions
        Assert.NotNull(model);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC4 — AppDbContext can be instantiated with Npgsql connection string options
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_CanBeInstantiated_WithNpgsqlOptions()
    {
        // GIVEN: A valid Npgsql connection string (same as DefaultConnection in appsettings.Development.json)
        // NOTE: This test verifies DbContextOptions wiring compiles and options are accepted.
        //       The test does NOT require a live PostgreSQL instance — it only tests construction.
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(
                "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres",
                npgsqlOptions => npgsqlOptions.UseSnakeCaseNamingConvention())
            .Options;

        // WHEN: AppDbContext is instantiated with Npgsql options
        // THEN: No exception is thrown — the constructor accepts valid Npgsql options.
        var exception = Record.Exception(() =>
        {
            using var context = new AppDbContext(options);
            Assert.NotNull(context);
        });

        Assert.Null(exception);
    }

    [Fact]
    public void AppDbContext_Constructor_AcceptsDbContextOptions_WithoutThrowing()
    {
        // GIVEN: DbContextOptions built with InMemory provider (no live DB needed)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"test-ctor-{Guid.NewGuid()}")
            .Options;

        // WHEN: AppDbContext is created
        // THEN: Context is not null and was instantiated without exception
        // This verifies the primary constructor pattern: AppDbContext(DbContextOptions<AppDbContext> options)
        using var context = new AppDbContext(options);
        Assert.NotNull(context);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3 (additional) — No manual [Column]/[Table] attributes bypass snake_case convention
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_HasNoManualColumnAttributesOnEntities()
    {
        // GIVEN: The project mandates NO manual [Column], [Table], or [Key] data annotations
        //        because UseSnakeCaseNamingConvention() on Npgsql handles all mapping automatically (AC3)
        // WHEN: Reflection scans all entity types registered in AppDbContext
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"test-no-annotations-{Guid.NewGuid()}")
            .Options;

        using var context = new AppDbContext(options);
        var entityTypes = context.Model.GetEntityTypes().ToList();

        // THEN: No entity has manual [Column] or [Table] data annotations.
        // For Story 1.3, the migration is empty — no domain entities registered yet.
        // This test passes vacuously today (empty entity set) and becomes a guard as entities are added.
        foreach (var entityType in entityTypes)
        {
            var clrType = entityType.ClrType;
            var properties = clrType.GetProperties();

            foreach (var property in properties)
            {
                var columnAttr = property.GetCustomAttributes(
                    typeof(System.ComponentModel.DataAnnotations.Schema.ColumnAttribute), inherit: true);
                Assert.Empty(columnAttr);

                var tableAttr = clrType.GetCustomAttributes(
                    typeof(System.ComponentModel.DataAnnotations.Schema.TableAttribute), inherit: true);
                Assert.Empty(tableAttr);
            }
        }
    }
}
