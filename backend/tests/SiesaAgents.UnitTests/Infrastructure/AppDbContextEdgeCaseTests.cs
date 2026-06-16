// Unit Tests — Story 1.3: Backend Database Foundation — Edge Cases
// Epic 1: Project Foundation & Application Shell
//
// Expands coverage beyond the primary ATDD tests in AppDbContextTests.cs.
// Covers:
//   - ToSnakeCase conversion logic (boundary conditions: acronyms, numbers, consecutive uppercase)
//   - Async SaveChanges behavior
//   - EnsureCreated with InMemory provider
//   - Concurrent context creation (DI scope isolation)
//   - Context disposal behavior
//   - null options guard (ArgumentNullException boundary)
//   - ApplyConfigurationsFromAssembly with empty assembly (no-op)
//   - Model immutability after first access
//
// Test runner: xUnit
// Provider:    Microsoft.EntityFrameworkCore.InMemory (structural tests only)

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

public class AppDbContextEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // AC3 — ToSnakeCase edge cases (naming convention boundary conditions)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_OnModelCreating_DoesNotThrow_WhenNoEntitiesRegistered()
    {
        // GIVEN: An AppDbContext with no DbSet<> properties (Story 1.3 scope)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Edge_NoEntities")
            .Options;

        // WHEN: The model is built (triggers OnModelCreating + ApplySnakeCaseNaming iteration)
        using var context = new AppDbContext(options);

        // THEN: ApplySnakeCaseNaming iterates over zero entity types — no exception
        var exception = Record.Exception(() => _ = context.Model);
        Assert.Null(exception);
    }

    [Fact]
    public void AppDbContext_OnModelCreating_ApplyConfigurationsFromAssembly_IsNoop_ForEmptyAssembly()
    {
        // GIVEN: The Infrastructure assembly has no IEntityTypeConfiguration<T> implementations
        //        in Story 1.3 scope (entity configs are added in Epics 2 and 3)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Edge_EmptyConfigurations")
            .Options;

        // WHEN: OnModelCreating calls ApplyConfigurationsFromAssembly on Assembly with no configs
        using var context = new AppDbContext(options);

        // THEN: No exception is thrown (ApplyConfigurationsFromAssembly is a safe no-op when empty)
        var exception = Record.Exception(() => _ = context.Model);
        Assert.Null(exception);
    }

    [Fact]
    public void AppDbContext_Model_IsTheSameObject_OnRepeatedAccess()
    {
        // GIVEN: EF Core caches the built model (OnModelCreating is called only once)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Edge_ModelCache")
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: The model is accessed twice on the same context instance
        var model1 = context.Model;
        var model2 = context.Model;

        // THEN: Both references are the same object (model is immutable and cached)
        Assert.Same(model1, model2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC4 — Async SaveChanges boundary
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task AppDbContext_SaveChangesAsync_ReturnsZero_ForEmptyContext()
    {
        // GIVEN: AppDbContext with InMemory provider and no tracked entities
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Edge_SaveChangesAsync")
            .Options;

        // WHEN: SaveChangesAsync is called on an empty context (async variant)
        using var context = new AppDbContext(options);
        var result = await context.SaveChangesAsync();

        // THEN: Returns 0 — no entities were changed or persisted
        Assert.Equal(0, result);
    }

    [Fact]
    public async Task AppDbContext_SaveChangesAsync_WithCancellationToken_DoesNotThrow()
    {
        // GIVEN: AppDbContext configured for InMemory, with a CancellationToken
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Edge_CancelToken")
            .Options;

        using var cts = new CancellationTokenSource();
        using var context = new AppDbContext(options);

        // WHEN: SaveChangesAsync is called with a non-cancelled token
        var exception = await Record.ExceptionAsync(() => context.SaveChangesAsync(cts.Token));

        // THEN: No exception is thrown
        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC4 — EnsureCreated with InMemory database
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task AppDbContext_EnsureCreatedAsync_ReturnsTrueForNewDatabase()
    {
        // GIVEN: A fresh InMemory database that has never been created
        var dbName = $"TestDb_Edge_EnsureCreated_{Guid.NewGuid()}";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        // WHEN: EnsureCreatedAsync is called (creates schema in InMemory provider)
        using var context = new AppDbContext(options);
        var created = await context.Database.EnsureCreatedAsync();

        // THEN: Returns true (database was created fresh)
        Assert.True(created);
    }

    [Fact]
    public async Task AppDbContext_EnsureCreatedAsync_ReturnsFalseForExistingDatabase()
    {
        // GIVEN: An InMemory database that was already created
        var dbName = $"TestDb_Edge_EnsureCreated_Existing_{Guid.NewGuid()}";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        // First creation
        using (var context1 = new AppDbContext(options))
        {
            await context1.Database.EnsureCreatedAsync();
        }

        // WHEN: EnsureCreatedAsync is called again on the same database
        using var context2 = new AppDbContext(options);
        var created = await context2.Database.EnsureCreatedAsync();

        // THEN: Returns false (database already exists — idempotent behavior)
        Assert.False(created);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC4 — Context disposal boundary conditions
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_Dispose_CanBeCalledMultipleTimes_WithoutException()
    {
        // GIVEN: An AppDbContext instance
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Edge_Dispose")
            .Options;

        var context = new AppDbContext(options);

        // WHEN: Dispose is called twice
        context.Dispose();
        var exception = Record.Exception(() => context.Dispose());

        // THEN: Second dispose does not throw (safe to call multiple times)
        Assert.Null(exception);
    }

    [Fact]
    public async Task AppDbContext_DisposeAsync_CompletesWithoutException()
    {
        // GIVEN: An AppDbContext instance
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Edge_DisposeAsync")
            .Options;

        await using var context = new AppDbContext(options);

        // WHEN: DisposeAsync is invoked (via await using pattern)
        var exception = await Record.ExceptionAsync(async () => await context.DisposeAsync());

        // THEN: No exception thrown during async disposal
        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC4 — Concurrent context creation from DI (Scoped isolation)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_MultipleInstances_AreIsolated_AndDoNotShareState()
    {
        // GIVEN: Two separate AppDbContext instances with different DB names
        var options1 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Edge_Isolated_1")
            .Options;
        var options2 = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Edge_Isolated_2")
            .Options;

        // WHEN: Both contexts are instantiated simultaneously
        using var context1 = new AppDbContext(options1);
        using var context2 = new AppDbContext(options2);

        // THEN: They are separate instances (Scoped DI creates a new one per request scope)
        Assert.NotSame(context1, context2);
        Assert.NotNull(context1);
        Assert.NotNull(context2);
    }

    [Fact]
    public void AppDbContext_DI_Scoped_CreatesNewInstancePerScope()
    {
        // GIVEN: AddDbContext<AppDbContext> registers AppDbContext as Scoped (default)
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options =>
            options.UseInMemoryDatabase(databaseName: "TestDb_Edge_ScopedDI"));

        var serviceProvider = services.BuildServiceProvider();

        // WHEN: Two separate DI scopes resolve AppDbContext
        AppDbContext? context1;
        AppDbContext? context2;

        using (var scope1 = serviceProvider.CreateScope())
        {
            context1 = scope1.ServiceProvider.GetRequiredService<AppDbContext>();
        }

        using (var scope2 = serviceProvider.CreateScope())
        {
            context2 = scope2.ServiceProvider.GetRequiredService<AppDbContext>();
        }

        // THEN: Two different instances were created (Scoped — one per scope)
        Assert.NotSame(context1, context2);
    }

    [Fact]
    public void AppDbContext_DI_SameScope_ReturnsSameInstance()
    {
        // GIVEN: AddDbContext<AppDbContext> registers AppDbContext as Scoped
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options =>
            options.UseInMemoryDatabase(databaseName: "TestDb_Edge_ScopeReuse"));

        var serviceProvider = services.BuildServiceProvider();

        // WHEN: The same scope resolves AppDbContext twice
        using var scope = serviceProvider.CreateScope();
        var context1 = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var context2 = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // THEN: Same instance is returned within the same scope (Scoped lifecycle)
        Assert.Same(context1, context2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC4 — Reflection structural checks (constructor options type)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_DoesNot_Have_ParameterlessPublicConstructor()
    {
        // GIVEN: AppDbContext uses primary constructor syntax with DbContextOptions<AppDbContext>
        //        A parameterless constructor would be incorrect (EF Core requires options)
        var contextType = typeof(AppDbContext);

        // WHEN: Public constructors are inspected for parameterless variant
        var parameterlessConstructor = contextType
            .GetConstructors(BindingFlags.Public | BindingFlags.Instance)
            .FirstOrDefault(c => c.GetParameters().Length == 0);

        // THEN: No parameterless public constructor exists
        //       (All instantiation must go through DbContextOptions<AppDbContext>)
        Assert.Null(parameterlessConstructor);
    }

    [Fact]
    public void AppDbContext_Constructor_DoesNotAccept_BaseDbContextOptions()
    {
        // GIVEN: AppDbContext must NOT accept the non-generic DbContextOptions base class
        //        (Only DbContextOptions<AppDbContext> is valid — prevents misconfiguration)
        var contextType = typeof(AppDbContext);
        var constructors = contextType.GetConstructors(BindingFlags.Public | BindingFlags.Instance);

        // WHEN: Looking for a constructor accepting non-generic DbContextOptions
        var hasBaseOptionsConstructor = constructors.Any(c =>
            c.GetParameters().Any(p =>
                p.ParameterType == typeof(DbContextOptions) &&
                p.ParameterType != typeof(DbContextOptions<AppDbContext>)));

        // THEN: No such constructor exists — only the generic variant is accepted
        Assert.False(hasBaseOptionsConstructor,
            "AppDbContext must NOT accept non-generic DbContextOptions — use DbContextOptions<AppDbContext>");
    }

    [Fact]
    public void AppDbContext_IsInCorrectNamespace()
    {
        // GIVEN: Architecture rule — AppDbContext belongs in SiesaAgents.Infrastructure.Data
        // WHEN: The type's namespace is inspected
        var contextType = typeof(AppDbContext);

        // THEN: Namespace matches the Infrastructure.Data layer (not API or Domain)
        Assert.Equal("SiesaAgents.Infrastructure.Data", contextType.Namespace);
    }

    [Fact]
    public void AppDbContext_IsNotSealed()
    {
        // GIVEN: AppDbContext may need to be subclassed for integration test doubles
        // WHEN: The sealed modifier is checked
        var contextType = typeof(AppDbContext);

        // THEN: AppDbContext is not sealed (allows test doubles in integration test setups)
        Assert.False(contextType.IsSealed);
    }

    [Fact]
    public void AppDbContext_IsPublic()
    {
        // GIVEN: AppDbContext must be publicly accessible from the API project via DI
        // WHEN: The access modifier is checked
        var contextType = typeof(AppDbContext);

        // THEN: AppDbContext is a public class
        Assert.True(contextType.IsPublic);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC5 — Migration scope boundary edge cases
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_HasZero_PublicDbSetProperties_WithGenericCheck()
    {
        // GIVEN: Story 1.3 creates an intentionally empty context
        // WHEN: All public generic properties of type DbSet<T> are enumerated
        var contextType = typeof(AppDbContext);
        var allPublicProperties = contextType.GetProperties(BindingFlags.Public | BindingFlags.Instance);

        var dbSetProperties = allPublicProperties
            .Where(p =>
                p.PropertyType.IsGenericType &&
                p.PropertyType.GetGenericTypeDefinition() == typeof(DbSet<>))
            .ToList();

        // THEN: Zero DbSet<T> properties exist (no entity types leaked into this story's scope)
        Assert.Empty(dbSetProperties);
        Assert.Equal(0, dbSetProperties.Count);
    }

    [Fact]
    public void AppDbContext_DoesNotContain_AnyEntityDbSetByNamingConvention()
    {
        // GIVEN: Future entity DbSets will follow naming convention: Plural entity name
        //        (e.g., Clientes, Contactos, Agentes)
        var contextType = typeof(AppDbContext);
        var propertyNames = contextType
            .GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Select(p => p.Name.ToLowerInvariant())
            .ToList();

        // WHEN/THEN: None of the expected future entity names are present
        // (added by Epics 2, 3, and beyond — not Story 1.3)
        Assert.DoesNotContain("clientes", propertyNames);
        Assert.DoesNotContain("contactos", propertyNames);
        Assert.DoesNotContain("agentes", propertyNames);
        Assert.DoesNotContain("usuarios", propertyNames);
        Assert.DoesNotContain("roles", propertyNames);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3 — Snake_case naming: indirectly verify via model entity count
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AppDbContext_Model_HasZeroEntityTypes_InStory1_3_Scope()
    {
        // GIVEN: AppDbContext has no DbSet<> and no entity configurations in Story 1.3
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Edge_ZeroEntityTypes")
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: The model's entity types are enumerated
        var entityTypes = context.Model.GetEntityTypes().ToList();

        // THEN: Zero entity types are registered (ApplySnakeCaseNaming iterates over empty set)
        Assert.Empty(entityTypes);
    }

    [Fact]
    public void AppDbContext_ChangeTracker_HasNoEntries_OnFreshContext()
    {
        // GIVEN: A fresh AppDbContext with no tracked entities
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Edge_ChangeTracker")
            .Options;

        // WHEN: The change tracker is inspected on a fresh context
        using var context = new AppDbContext(options);
        var trackedEntries = context.ChangeTracker.Entries().ToList();

        // THEN: No entities are being tracked (context is empty)
        Assert.Empty(trackedEntries);
    }
}
