using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Story 1.3: Backend Database Foundation
/// ATDD Unit Tests — RED Phase
/// These tests are intentionally FAILING until AppDbContext is implemented.
///
/// Acceptance Criteria covered:
///   AC1 — AppDbContext can be instantiated; EF Core InMemory provider works
///   AC2 — OnModelCreating calls ApplySnakeCaseNaming() (snake_case convention)
///   AC4 — AppDbContext construction succeeds with valid DbContextOptions
///   AC5 — Initial migration is empty (no domain entity tables)
/// </summary>
public class AppDbContextTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // AC1 / AC4 — AppDbContext can be instantiated with InMemory database
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_CanBeInstantiated_WithInMemoryDatabase()
    {
        // GIVEN: Valid DbContextOptions using EF Core InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"test_db_{Guid.NewGuid()}")
            .Options;

        // WHEN: AppDbContext is instantiated with those options
        using var context = new AppDbContext(options);

        // THEN: Context is not null — construction succeeded
        Assert.NotNull(context);
    }

    [Fact]
    public void AppDbContext_AcceptsDbContextOptions_ViaConstructor()
    {
        // GIVEN: Standard EF Core constructor pattern (DbContextOptions<AppDbContext>)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"test_db_{Guid.NewGuid()}")
            .Options;

        // WHEN: AppDbContext is created — verifies constructor signature is correct
        Action act = () =>
        {
            using var context = new AppDbContext(options);
        };

        // THEN: No exception is thrown — constructor accepts DbContextOptions<AppDbContext>
        var exception = Record.Exception(act);
        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC2 — OnModelCreating configures snake_case naming convention
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_OnModelCreating_DoesNotThrow()
    {
        // GIVEN: AppDbContext with InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"test_db_{Guid.NewGuid()}")
            .Options;

        // WHEN: OnModelCreating is triggered by accessing Model (implicit call)
        Action act = () =>
        {
            using var context = new AppDbContext(options);
            // Accessing Model triggers OnModelCreating internally
            _ = context.Model;
        };

        // THEN: OnModelCreating does not throw (ApplySnakeCaseNaming is called successfully)
        var exception = Record.Exception(act);
        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC5 — Initial migration is empty (no domain entity tables)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_HasNoEntityTypes_InThisStory()
    {
        // GIVEN: Story 1.3 scope: No domain entities (ClienteEntity, ContactoEntity are out of scope)
        //        The AppDbContext must have ZERO DbSet<> properties at this stage
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"test_db_{Guid.NewGuid()}")
            .Options;

        // WHEN: The model is built and entity types are inspected
        using var context = new AppDbContext(options);
        var entityTypes = context.Model.GetEntityTypes().ToList();

        // THEN: No application domain entity types exist (empty migration)
        // Note: EF Core may include its own internal types — we check for domain entities specifically
        var domainEntityNames = entityTypes
            .Select(e => e.ClrType.Name)
            .Where(name => name != "__EFMigrationsHistory")
            .ToList();

        Assert.Empty(domainEntityNames);
    }

    [Fact]
    public void AppDbContext_DoesNotContain_ClienteEntity()
    {
        // GIVEN: ClienteEntity belongs to Epic 2 / Story 2.1 — out of scope for Story 1.3
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"test_db_{Guid.NewGuid()}")
            .Options;

        // WHEN: The model entity types are inspected
        using var context = new AppDbContext(options);
        var entityTypeNames = context.Model.GetEntityTypes()
            .Select(e => e.ClrType.Name)
            .ToList();

        // THEN: "ClienteEntity" is NOT registered in this context
        Assert.DoesNotContain("ClienteEntity", entityTypeNames);
    }

    [Fact]
    public void AppDbContext_DoesNotContain_ContactoEntity()
    {
        // GIVEN: ContactoEntity belongs to Epic 3 / Story 3.1 — out of scope for Story 1.3
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"test_db_{Guid.NewGuid()}")
            .Options;

        // WHEN: The model entity types are inspected
        using var context = new AppDbContext(options);
        var entityTypeNames = context.Model.GetEntityTypes()
            .Select(e => e.ClrType.Name)
            .ToList();

        // THEN: "ContactoEntity" is NOT registered in this context
        Assert.DoesNotContain("ContactoEntity", entityTypeNames);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC4 — AppDbContext DI registration with Npgsql connection string
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_CanBeConfigured_WithNpgsqlProvider()
    {
        // GIVEN: Program.cs registers AppDbContext with UseNpgsql and DefaultConnection string
        //        This test verifies the connection string is accepted without throwing
        var connectionString = "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        // WHEN: AppDbContext is instantiated with Npgsql provider options
        Action act = () =>
        {
            using var context = new AppDbContext(options);
        };

        // THEN: No exception thrown — Npgsql configuration is valid
        // Note: Actual database connection is NOT made here (no OpenConnection call)
        var exception = Record.Exception(act);
        Assert.Null(exception);
    }
}
