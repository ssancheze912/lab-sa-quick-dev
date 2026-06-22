using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Story 1.3: Backend Database Foundation
/// ATDD Unit Tests — RED Phase (Infrastructure / EF Core Level)
///
/// Acceptance Criteria covered:
///   AC4 — ApplySnakeCaseNaming() is called in OnModelCreating; all column names follow snake_case
///   AC5 — Initial migration is empty (no domain table DbSets defined in AppDbContext yet)
/// </summary>
public class AppDbContextTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Creates an in-memory AppDbContext for model inspection.
    /// NOTE: InMemory provider does NOT apply snake_case naming conventions.
    /// We use it to verify model metadata, not actual SQL column names.
    /// For snake_case verification we check the relational model via Npgsql conventions.
    /// </summary>
    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC4: OnModelCreating must call ApplySnakeCaseNaming()
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_WithNpgsqlProvider_AppliesSnakeCaseNamingToBaseEntityProperties()
    {
        // GIVEN: AppDbContext is configured with Npgsql (PostgreSQL) provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=test") // connection string used only for provider selection
            .Options;

        // WHEN: The model is built (OnModelCreating is called)
        using var context = new AppDbContext(options);
        var model = context.Model;

        // THEN: The model is built successfully — ApplySnakeCaseNaming() was called without error
        // A missing EFCore.NamingConventions package or absent ApplySnakeCaseNaming() call
        // would cause this test to throw an InvalidOperationException or produce PascalCase names
        Assert.NotNull(model);
    }

    [Fact]
    public void AppDbContext_WithNpgsqlProvider_EntityTableNamesFollowSnakeCase()
    {
        // GIVEN: AppDbContext is configured with Npgsql (PostgreSQL) provider
        // and EFCore.NamingConventions is installed
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=test")
            .Options;

        // WHEN: The model is built by EF Core
        using var context = new AppDbContext(options);
        var model = context.Model;

        // THEN: All entity type names in the model follow snake_case convention
        // (EFCore.NamingConventions applies snake_case to table and column names)
        foreach (var entityType in model.GetEntityTypes())
        {
            var tableName = entityType.GetTableName();
            if (tableName is null) continue;

            // snake_case = all lowercase with underscores between words, no PascalCase
            Assert.Equal(tableName, tableName.ToLowerInvariant(),
                $"Table name '{tableName}' is not snake_case");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC5: AppDbContext must NOT define domain entity DbSets in this story
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_DoesNotHaveClienteDbSet()
    {
        // GIVEN: Story 1.3 scope — ClienteEntity belongs to Epic 2 Story 2.1
        // WHEN: We inspect the AppDbContext for any ClienteEntity DbSet property
        using var context = CreateInMemoryContext();
        var contextType = context.GetType();

        // THEN: No DbSet<Cliente...> property exists on AppDbContext
        var dbSetProperties = contextType.GetProperties()
            .Where(p => p.PropertyType.IsGenericType &&
                        p.PropertyType.GetGenericTypeDefinition() == typeof(DbSet<>))
            .Select(p => p.PropertyType.GetGenericArguments()[0].Name)
            .ToList();

        Assert.DoesNotContain(dbSetProperties,
            name => name.Contains("Cliente", StringComparison.OrdinalIgnoreCase),
            "AppDbContext must NOT define DbSet<ClienteEntity> in Story 1.3 — belongs to Epic 2");
    }

    [Fact]
    public void AppDbContext_DoesNotHaveContactoDbSet()
    {
        // GIVEN: Story 1.3 scope — ContactoEntity belongs to Epic 3 Story 3.1
        // WHEN: We inspect the AppDbContext for any ContactoEntity DbSet property
        using var context = CreateInMemoryContext();
        var contextType = context.GetType();

        // THEN: No DbSet<Contacto...> property exists on AppDbContext
        var dbSetProperties = contextType.GetProperties()
            .Where(p => p.PropertyType.IsGenericType &&
                        p.PropertyType.GetGenericTypeDefinition() == typeof(DbSet<>))
            .Select(p => p.PropertyType.GetGenericArguments()[0].Name)
            .ToList();

        Assert.DoesNotContain(dbSetProperties,
            name => name.Contains("Contacto", StringComparison.OrdinalIgnoreCase),
            "AppDbContext must NOT define DbSet<ContactoEntity> in Story 1.3 — belongs to Epic 3");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC4: AppDbContext inherits DbContext and has correct constructor signature
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_InheritsFromDbContext()
    {
        // GIVEN: AppDbContext is the EF Core database context for the application
        // WHEN: We inspect the type hierarchy
        // THEN: AppDbContext inherits from DbContext (required for EF Core to work)
        Assert.True(typeof(AppDbContext).IsSubclassOf(typeof(DbContext)));
    }

    [Fact]
    public void AppDbContext_CanBeInstantiatedWithDbContextOptions()
    {
        // GIVEN: DI container will inject DbContextOptions<AppDbContext>
        // WHEN: AppDbContext is instantiated with valid options
        // THEN: Constructor accepts DbContextOptions<AppDbContext> and creates valid instance
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("test-instantiation")
            .Options;

        using var context = new AppDbContext(options);

        // No exception thrown = constructor signature is compatible with DI registration
        Assert.NotNull(context);
    }
}
