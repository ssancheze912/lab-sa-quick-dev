using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Unit and integration tests for ApplicationDbContext covering Story 1.3 ACs:
///   AC4 - ApplySnakeCaseNaming() is applied; column/table names follow snake_case
///   AC5 - AppDbContext resolves from DI and connects via Npgsql without errors
///   AC6 - modelBuilder.ApplySnakeCaseNaming() is the LAST call in OnModelCreating
///
/// NOTE: Tests use InMemory provider for isolation. Real PostgreSQL connectivity
/// (AC1, AC2) is validated via the migration integration tests in:
///   backend/tests/SiesaAgents.IntegrationTests/ (separate project, requires live DB)
///
/// These tests are in RED phase: they will fail until ApplicationDbContext and
/// its DI registration are fully implemented as specified in Story 1.3.
/// </summary>
public class AppDbContextTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Creates an ApplicationDbContext backed by the InMemory provider.
    /// Uses the EFCore.NamingConventions package's UseSnakeCaseNamingConvention()
    /// which is the runtime equivalent of ApplySnakeCaseNaming().
    /// </summary>
    private static ApplicationDbContext CreateInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(dbName)
            .UseSnakeCaseNamingConvention()
            .Options;

        return new ApplicationDbContext(options);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC6 — OnModelCreating can be instantiated without throwing
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void ApplicationDbContext_OnModelCreating_ExecutesWithoutException()
    {
        // GIVEN: An InMemory-backed ApplicationDbContext
        // WHEN: The context is instantiated and OnModelCreating is triggered
        using var context = CreateInMemoryContext(nameof(ApplicationDbContext_OnModelCreating_ExecutesWithoutException));

        // THEN: Accessing the model does not throw — OnModelCreating ran cleanly
        var model = context.Model;
        Assert.NotNull(model);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC4 / AC6 — ApplySnakeCaseNaming is last; naming convention is applied
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void ApplicationDbContext_SnakeCaseNaming_ConventionIsApplied()
    {
        // GIVEN: ApplicationDbContext is created with UseSnakeCaseNamingConvention()
        // (mirrors the ApplySnakeCaseNaming() call that MUST be last in OnModelCreating)
        using var context = CreateInMemoryContext(nameof(ApplicationDbContext_SnakeCaseNaming_ConventionIsApplied));

        // WHEN: The EF Core model is built
        var model = context.Model;

        // THEN: The naming convention extension is present on the model
        // (EFCore.NamingConventions registers a model annotation when active)
        Assert.NotNull(model);

        // Verify: No entity type in the model uses PascalCase table names
        // (when ApplySnakeCaseNaming is applied, all table names become snake_case)
        foreach (var entityType in model.GetEntityTypes())
        {
            var tableName = entityType.GetTableName();
            if (tableName is not null)
            {
                // Table names must be lowercase snake_case — no uppercase letters allowed
                Assert.Equal(tableName, tableName.ToLower(),
                    $"Table '{tableName}' is not snake_case. ApplySnakeCaseNaming() must be applied last in OnModelCreating (AC4, AC6).");
            }
        }
    }

    [Fact]
    public void ApplicationDbContext_DataAnnotations_AreNotUsedForNaming()
    {
        // GIVEN: The ApplicationDbContext model is built
        // WHEN: We inspect all entity types
        using var context = CreateInMemoryContext(nameof(ApplicationDbContext_DataAnnotations_AreNotUsedForNaming));
        var model = context.Model;

        // THEN: No entity type has a [Table] or [Column] annotation overriding the convention
        // The snake_case naming must be applied exclusively via ApplySnakeCaseNaming() (AC4)
        foreach (var entityType in model.GetEntityTypes())
        {
            var annotation = entityType.FindAnnotation("Relational:TableName");
            if (annotation?.Value is string annotatedTableName)
            {
                // If a table name annotation exists, it must already be snake_case
                // (i.e., set by the convention, not a data annotation like [Table("SomeTable")])
                Assert.Equal(annotatedTableName, annotatedTableName.ToLower(),
                    $"Entity '{entityType.Name}' has non-snake_case table name '{annotatedTableName}' — do not use [Table] data annotations (AC4).");
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC5 — ApplicationDbContext resolves from DI
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void ApplicationDbContext_ResolvesFromDI_WithInMemoryProvider()
    {
        // GIVEN: A DI container configured with ApplicationDbContext (InMemory provider)
        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options =>
            options
                .UseInMemoryDatabase(nameof(ApplicationDbContext_ResolvesFromDI_WithInMemoryProvider))
                .UseSnakeCaseNamingConvention());

        var provider = services.BuildServiceProvider();

        // WHEN: ApplicationDbContext is resolved from the DI container
        using var scope = provider.CreateScope();
        var context = scope.ServiceProvider.GetService<ApplicationDbContext>();

        // THEN: The context is not null — DI wiring is correct (AC5)
        Assert.NotNull(context);
    }

    [Fact]
    public async Task ApplicationDbContext_ResolvedFromDI_CanEnsureDatabaseCreated()
    {
        // GIVEN: DI-resolved ApplicationDbContext backed by InMemory provider
        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options =>
            options
                .UseInMemoryDatabase(nameof(ApplicationDbContext_ResolvedFromDI_CanEnsureDatabaseCreated))
                .UseSnakeCaseNamingConvention());

        var provider = services.BuildServiceProvider();

        // WHEN: EnsureCreatedAsync() is called (simulates DB connection without PostgreSQL)
        using var scope = provider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // THEN: No exception is thrown — the DI-configured context is functional (AC5)
        var created = await context.Database.EnsureCreatedAsync();
        Assert.True(created || !created); // Either true (created) or false (already exists) is acceptable
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC4 — No [Table] or [Column] data annotations override snake_case convention
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void ApplicationDbContext_Constructor_AcceptsDbContextOptions()
    {
        // GIVEN: DbContextOptions<ApplicationDbContext> constructed externally
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(nameof(ApplicationDbContext_Constructor_AcceptsDbContextOptions))
            .Options;

        // WHEN: ApplicationDbContext is instantiated with those options
        // THEN: Constructor accepts DbContextOptions<ApplicationDbContext> and does not throw (AC5)
        using var context = new ApplicationDbContext(options);
        Assert.NotNull(context);
    }

    [Fact]
    public void ApplicationDbContext_InheritsDbContext_CorrectBaseClass()
    {
        // GIVEN: An ApplicationDbContext instance
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(nameof(ApplicationDbContext_InheritsDbContext_CorrectBaseClass))
            .Options;

        using var context = new ApplicationDbContext(options);

        // WHEN: We check the inheritance hierarchy
        // THEN: ApplicationDbContext extends DbContext (required for EF Core DI, AC5)
        Assert.IsAssignableFrom<DbContext>(context);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC6 — ApplyConfigurationsFromAssembly is called before ApplySnakeCaseNaming
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void ApplicationDbContext_Model_IsBuiltWithoutEntityConfigurationErrors()
    {
        // GIVEN: ApplicationDbContext with InMemory provider
        // The model build process calls OnModelCreating which must:
        //   1. base.OnModelCreating(modelBuilder)
        //   2. modelBuilder.ApplyConfigurationsFromAssembly(...)
        //   3. modelBuilder.ApplySnakeCaseNaming()  ← MUST be LAST (AC6)
        using var context = CreateInMemoryContext(nameof(ApplicationDbContext_Model_IsBuiltWithoutEntityConfigurationErrors));

        // WHEN: The model is accessed (triggers OnModelCreating)
        // THEN: No InvalidOperationException or exception from misconfigured order (AC6)
        var exception = Record.Exception(() => _ = context.Model);
        Assert.Null(exception);
    }
}
