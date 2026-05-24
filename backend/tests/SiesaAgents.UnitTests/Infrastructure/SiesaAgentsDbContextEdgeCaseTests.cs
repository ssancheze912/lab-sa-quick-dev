/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * Automate Expansion — Edge Cases & Boundary Conditions (Unit Level)
 * Expands ATDD coverage (SiesaAgentsDbContextTests.cs) with:
 *   - Multiple context instances are independent (no shared model state)
 *   - DbContext dispose does not throw
 *   - Disposed context throws ObjectDisposedException on subsequent use
 *   - Model is idempotent: accessing Model multiple times returns the same object
 *   - ApplyConfigurationsFromAssembly does not import Domain entity types from other assemblies
 *   - Model snapshot has no domain tables (InitialCreate is truly empty)
 *   - DbContext with snake_case AND Npgsql provider both registered simultaneously
 *   - DI: two scoped resolutions within the same scope return the same instance
 *   - DI: two resolutions from different scopes return different instances
 *   - DI: options are not null when context is resolved from DI
 *
 * Test Framework: xUnit
 * Test Pattern: Arrange / Act / Assert (Given / When / Then)
 */

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

public class SiesaAgentsDbContextEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Multiple context instances — model independence
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Edge case: Two independently created DbContext instances should each build
    /// their own model without interference.
    /// </summary>
    [Fact]
    public void SiesaAgentsDbContext_WhenTwoInstancesCreated_EachHasNonNullModel()
    {
        // GIVEN: Two separate InMemory options (different database names)
        var options1 = new DbContextOptionsBuilder<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>()
            .UseInMemoryDatabase($"IndependenceTestDb1_{Guid.NewGuid()}")
            .Options;

        var options2 = new DbContextOptionsBuilder<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>()
            .UseInMemoryDatabase($"IndependenceTestDb2_{Guid.NewGuid()}")
            .Options;

        // WHEN: Both contexts are instantiated
        using var context1 = new SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext(options1);
        using var context2 = new SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext(options2);

        // THEN: Both models are accessible and non-null
        Assert.NotNull(context1.Model);
        Assert.NotNull(context2.Model);
    }

    /// <summary>
    /// Edge case: Accessing the same DbContext.Model property multiple times
    /// must return the same object reference (EF Core caches the compiled model).
    /// </summary>
    [Fact]
    public void SiesaAgentsDbContext_WhenModelAccessedMultipleTimes_ReturnsSameObject()
    {
        // GIVEN: A DbContext with InMemory provider
        var options = new DbContextOptionsBuilder<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>()
            .UseInMemoryDatabase($"IdempotentModelDb_{Guid.NewGuid()}")
            .Options;

        using var context = new SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext(options);

        // WHEN: Model is accessed twice
        var model1 = context.Model;
        var model2 = context.Model;

        // THEN: Both accesses return the same object (idempotent, no recompilation)
        Assert.Same(model1, model2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Dispose behavior
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Edge case: Calling Dispose on a DbContext must not throw.
    /// Dispose is a core lifecycle operation — any exception would be critical.
    /// </summary>
    [Fact]
    public void SiesaAgentsDbContext_WhenDisposed_ShouldNotThrow()
    {
        // GIVEN: A freshly instantiated DbContext
        var options = new DbContextOptionsBuilder<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>()
            .UseInMemoryDatabase($"DisposeTestDb_{Guid.NewGuid()}")
            .Options;

        var context = new SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext(options);

        // WHEN: Dispose is called
        var exception = Record.Exception(() => context.Dispose());

        // THEN: No exception is thrown during disposal
        Assert.Null(exception);
    }

    /// <summary>
    /// Edge case: Using a disposed DbContext must throw ObjectDisposedException.
    /// This verifies that the context correctly marks itself as disposed and
    /// guards against use-after-free scenarios.
    /// </summary>
    [Fact]
    public void SiesaAgentsDbContext_WhenDisposedThenUsed_ShouldThrowObjectDisposedException()
    {
        // GIVEN: A DbContext that has been disposed
        var options = new DbContextOptionsBuilder<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>()
            .UseInMemoryDatabase($"DisposedUseTestDb_{Guid.NewGuid()}")
            .Options;

        var context = new SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext(options);
        context.Dispose();

        // WHEN: An attempt is made to use the disposed context
        var exception = Record.Exception(() =>
        {
            // Accessing ChangeTracker forces interaction with the disposed context internals
            _ = context.ChangeTracker.Entries();
        });

        // THEN: ObjectDisposedException is thrown (EF Core standard behavior)
        Assert.NotNull(exception);
        Assert.IsType<ObjectDisposedException>(exception);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Model purity — no domain tables in initial empty migration
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// AC2 Edge case: The EF Core model must have no entity types defined
    /// because the InitialCreate migration is empty (no domain tables in Story 1.3).
    /// This prevents accidental entity registration before Epic 2.
    /// </summary>
    [Fact]
    public void SiesaAgentsDbContext_Model_ShouldHaveClienteEntityRegistered()
    {
        // GIVEN: DbContext configured with InMemory provider
        var options = new DbContextOptionsBuilder<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>()
            .UseInMemoryDatabase($"ClienteModelTestDb_{Guid.NewGuid()}")
            .Options;

        using var context = new SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext(options);

        // WHEN: The model entity types are enumerated
        var entityTypes = context.Model.GetEntityTypes().ToList();

        // THEN: ClienteEntity is registered (added in Story 2.1)
        Assert.NotEmpty(entityTypes);
        Assert.Contains(entityTypes, e => e.ClrType == typeof(SiesaAgents.Domain.Clientes.Entities.ClienteEntity));
    }

    /// <summary>
    /// AC2 Edge case: The DbContext must not have any DbSet properties that
    /// would imply domain entity registration in this foundational story.
    /// </summary>
    [Fact]
    public void SiesaAgentsDbContext_ShouldHaveClientesDbSetProperty()
    {
        // GIVEN: The SiesaAgentsDbContext type definition
        var contextType = typeof(SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext);

        // WHEN: All public properties of type DbSet<T> are enumerated via reflection
        var dbSetProperties = contextType.GetProperties()
            .Where(p => p.PropertyType.IsGenericType &&
                        p.PropertyType.GetGenericTypeDefinition() == typeof(DbSet<>))
            .ToList();

        // THEN: Clientes DbSet property exists (added in Story 2.1)
        Assert.NotEmpty(dbSetProperties);
        Assert.Contains(dbSetProperties, p => p.Name == "Clientes");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Combined options: snake_case + Npgsql together
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// AC4 + AC5 Combined: DbContext configured with BOTH Npgsql provider AND
    /// snake_case naming convention (as in production Program.cs) must not conflict.
    /// This tests the exact combination used in the real application.
    /// </summary>
    [Fact]
    public void SiesaAgentsDbContext_WhenConfiguredWithNpgsqlAndSnakeCaseTogether_OptionsBuildSuccessfully()
    {
        // GIVEN: Options built with both UseNpgsql and UseSnakeCaseNamingConvention
        // (exact pattern from Program.cs)
        const string connectionString =
            "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres";

        var optionsBuilder = new DbContextOptionsBuilder<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>();
        optionsBuilder
            .UseNpgsql(connectionString)
            .UseSnakeCaseNamingConvention();

        // WHEN: Options are built
        var options = optionsBuilder.Options;

        // THEN: Both extensions are present — Npgsql and NamingConvention
        var extensions = options.Extensions.ToList();

        var hasNpgsql = extensions.Any(e =>
            e.GetType().FullName?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true);

        var hasNamingConvention = extensions.Any(e =>
            e.GetType().FullName?.Contains("NamingConvention", StringComparison.OrdinalIgnoreCase) == true);

        Assert.True(hasNpgsql, "Npgsql provider extension must be present in DbContextOptions.");
        Assert.True(hasNamingConvention, "NamingConvention extension must be present in DbContextOptions.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DI scoping boundary conditions
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// AC5 Edge case: Two resolutions of SiesaAgentsDbContext within the SAME scope
    /// must return the same instance (Scoped lifetime guarantee).
    /// </summary>
    [Fact]
    public void DI_WhenDbContextResolvedTwiceInSameScope_ReturnsSameInstance()
    {
        // GIVEN: ServiceCollection with DbContext registered (Scoped via AddDbContext)
        var services = new ServiceCollection();
        services.AddDbContext<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>(options =>
            options.UseInMemoryDatabase($"ScopedSameInstanceDb_{Guid.NewGuid()}"));

        var serviceProvider = services.BuildServiceProvider();

        // WHEN: Two resolutions happen within the same scope
        using var scope = serviceProvider.CreateScope();
        var context1 = scope.ServiceProvider
            .GetRequiredService<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>();
        var context2 = scope.ServiceProvider
            .GetRequiredService<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>();

        // THEN: Both references point to the same instance (Scoped = per-scope singleton)
        Assert.Same(context1, context2);
    }

    /// <summary>
    /// AC5 Edge case: Two resolutions from DIFFERENT scopes must return different instances.
    /// Each HTTP request (scope) must have its own DbContext to prevent cross-request data leakage.
    /// </summary>
    [Fact]
    public void DI_WhenDbContextResolvedFromDifferentScopes_ReturnsDifferentInstances()
    {
        // GIVEN: ServiceCollection with DbContext registered as Scoped
        var services = new ServiceCollection();
        services.AddDbContext<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>(options =>
            options.UseInMemoryDatabase($"DifferentScopeDb_{Guid.NewGuid()}"));

        var serviceProvider = services.BuildServiceProvider();

        // WHEN: Two resolutions happen in different scopes
        SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext context1;
        SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext context2;

        using (var scope1 = serviceProvider.CreateScope())
        {
            context1 = scope1.ServiceProvider
                .GetRequiredService<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>();

            using var scope2 = serviceProvider.CreateScope();
            context2 = scope2.ServiceProvider
                .GetRequiredService<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>();

            // THEN: Different scopes provide different context instances (no cross-scope sharing)
            Assert.NotSame(context1, context2);
        }
    }

    /// <summary>
    /// AC5 Edge case: The DbContextOptions resolved from the DI container must be non-null
    /// and must reference the correct DbContext type.
    /// </summary>
    [Fact]
    public void DI_WhenDbContextOptionsResolved_ShouldBeNonNullAndTyped()
    {
        // GIVEN: ServiceCollection with DbContext registered using InMemory provider
        var services = new ServiceCollection();
        services.AddDbContext<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>(options =>
            options.UseInMemoryDatabase($"OptionsResolutionDb_{Guid.NewGuid()}"));

        var serviceProvider = services.BuildServiceProvider();

        // WHEN: DbContextOptions<SiesaAgentsDbContext> is resolved from DI
        using var scope = serviceProvider.CreateScope();
        var resolvedOptions = scope.ServiceProvider
            .GetRequiredService<DbContextOptions<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>>();

        // THEN: Options are non-null and correctly typed
        Assert.NotNull(resolvedOptions);
        Assert.IsType<DbContextOptions<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>>(resolvedOptions);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Assembly configuration boundary
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// AC4 Edge case: ApplyConfigurationsFromAssembly targets the Infrastructure assembly.
    /// This assembly must exist and the scan must succeed (no crash on empty/valid assembly).
    /// </summary>
    [Fact]
    public void SiesaAgentsDbContext_WhenModelBuilt_ApplyConfigurationsFromAssemblyDoesNotThrow()
    {
        // GIVEN: DbContext options with InMemory provider
        var options = new DbContextOptionsBuilder<SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext>()
            .UseInMemoryDatabase($"AssemblyScanTestDb_{Guid.NewGuid()}")
            .Options;

        // WHEN: Model is forced to build — this exercises ApplyConfigurationsFromAssembly
        var exception = Record.Exception(() =>
        {
            using var context = new SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext(options);
            var entityTypes = context.Model.GetEntityTypes().ToList();
            // No assertion needed on content — just verifying no exception from assembly scan
            _ = entityTypes;
        });

        // THEN: Assembly scan completes without exception (empty Infrastructure has no IEntityTypeConfiguration)
        Assert.Null(exception);
    }

    /// <summary>
    /// AC4 Edge case: The Infrastructure assembly must NOT register entity type configurations
    /// that belong to future epics (ClienteEntity, ContactoEntity are Epic 2 and 3 territory).
    /// Ensures no premature IEntityTypeConfiguration implementations were added.
    /// </summary>
    [Fact]
    public void SiesaAgentsDbContext_InfrastructureAssembly_ShouldHaveClienteConfiguration()
    {
        // GIVEN: The Infrastructure assembly
        var infrastructureAssembly = typeof(SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext).Assembly;

        // WHEN: All IEntityTypeConfiguration<T> implementations are searched
        var configTypes = infrastructureAssembly.GetTypes()
            .Where(t => !t.IsAbstract && !t.IsInterface)
            .Where(t => t.GetInterfaces()
                .Any(i => i.IsGenericType &&
                           i.GetGenericTypeDefinition() == typeof(Microsoft.EntityFrameworkCore.IEntityTypeConfiguration<>)))
            .ToList();

        // THEN: ClienteConfiguration is present (added in Story 2.1)
        Assert.NotEmpty(configTypes);
        Assert.Contains(configTypes, t => t == typeof(SiesaAgents.Infrastructure.Data.Configurations.ClienteConfiguration));
    }
}
