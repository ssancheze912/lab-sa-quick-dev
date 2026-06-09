// Expanded coverage — Story 1.3: Backend Database Foundation
// Edge cases and boundary conditions for AppDbContext NOT covered in AppDbContextTests.cs.
// Covers: disposal, model idempotency, options reuse, concurrent access,
// DI scope behavior, and invalid configuration edge cases.

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Edge case and boundary condition tests for AppDbContext (Story 1.3 — AC#1, #3, #4, #5).
/// Expands AppDbContextTests.cs with disposal, concurrency, and DI scope edge cases.
/// All tests use InMemory database for isolation (no live PostgreSQL required).
/// </summary>
public class AppDbContextEdgeCaseTests
{
    // -----------------------------------------------------------------------
    // Edge Case 1: Accessing context after disposal throws ObjectDisposedException
    // Boundary: DbContext.Dispose() must render the context unusable — no zombie access.
    // -----------------------------------------------------------------------

    [Fact]
    public void AppDbContext_ThrowsObjectDisposedException_AfterDisposal()
    {
        // GIVEN: An AppDbContext that has been explicitly disposed
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("TestDb_Disposal")
            .Options;

        var context = new AppDbContext(options);
        context.Dispose();

        // WHEN: The model is accessed after disposal
        // THEN: ObjectDisposedException is thrown — the context is unusable
        Assert.Throws<ObjectDisposedException>(() => _ = context.Model);
    }

    // -----------------------------------------------------------------------
    // Edge Case 2: Two separate instances with the same options are independent
    // Boundary: DbContextOptions is reusable — each instance has its own state.
    // -----------------------------------------------------------------------

    [Fact]
    public void AppDbContext_TwoInstancesWithSharedOptions_AreIndependent()
    {
        // GIVEN: A shared DbContextOptions instance
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("TestDb_SharedOptions")
            .Options;

        // WHEN: Two separate AppDbContext instances are created from the same options
        using var context1 = new AppDbContext(options);
        using var context2 = new AppDbContext(options);

        // THEN: Both are non-null and are different object instances
        Assert.NotNull(context1);
        Assert.NotNull(context2);
        Assert.NotSame(context1, context2);
    }

    // -----------------------------------------------------------------------
    // Edge Case 3: Disposing context1 does NOT affect context2 (shared-options scenario)
    // -----------------------------------------------------------------------

    [Fact]
    public void AppDbContext_DisposingFirstInstance_DoesNotAffectSecondInstance()
    {
        // GIVEN: Two contexts created from the same options
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("TestDb_DisposalIsolation")
            .Options;

        var context1 = new AppDbContext(options);
        using var context2 = new AppDbContext(options);

        // WHEN: context1 is disposed
        context1.Dispose();

        // THEN: context2 remains operational — accessing its model does NOT throw
        Exception? caughtException = null;
        try
        {
            _ = context2.Model;
        }
        catch (Exception ex)
        {
            caughtException = ex;
        }

        Assert.Null(caughtException);
    }

    // -----------------------------------------------------------------------
    // Edge Case 4: Model is stable across multiple accesses — idempotent
    // Boundary: Model should be cached after first build; subsequent accesses return same model.
    // -----------------------------------------------------------------------

    [Fact]
    public void AppDbContext_Model_IsStableAcrossMultipleAccesses()
    {
        // GIVEN: An AppDbContext with InMemory database
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("TestDb_ModelIdempotency")
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: The model is accessed three times in succession
        var model1 = context.Model;
        var model2 = context.Model;
        var model3 = context.Model;

        // THEN: All accesses return the same model object (EF caches after first build)
        Assert.Same(model1, model2);
        Assert.Same(model2, model3);
    }

    // -----------------------------------------------------------------------
    // Edge Case 5: DI resolves a NEW scoped context per scope — not singleton
    // Boundary: AddDbContext registers as Scoped by default; two scopes must get different instances.
    // -----------------------------------------------------------------------

    [Fact]
    public void AppDbContext_DI_ScoppedRegistration_ProvidesDistinctInstancesPerScope()
    {
        // GIVEN: A DI service collection registering AppDbContext as Scoped (default)
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options =>
            options.UseInMemoryDatabase("TestDb_DIScoped"));
        var provider = services.BuildServiceProvider();

        // WHEN: Two different scopes each resolve AppDbContext
        AppDbContext context1;
        AppDbContext context2;

        using (var scope1 = provider.CreateScope())
        {
            context1 = scope1.ServiceProvider.GetRequiredService<AppDbContext>();
        }

        using (var scope2 = provider.CreateScope())
        {
            context2 = scope2.ServiceProvider.GetRequiredService<AppDbContext>();
        }

        // THEN: Each scope gets a distinct instance (not the same reference)
        Assert.NotSame(context1, context2);
    }

    // -----------------------------------------------------------------------
    // Edge Case 6: Within a single DI scope, the SAME instance is returned
    // Boundary: Scoped = one instance per scope, not per call.
    // -----------------------------------------------------------------------

    [Fact]
    public void AppDbContext_DI_SameInstanceWithinSingleScope()
    {
        // GIVEN: A DI container with scoped AppDbContext
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options =>
            options.UseInMemoryDatabase("TestDb_SameScope"));
        var provider = services.BuildServiceProvider();

        // WHEN: AppDbContext is resolved twice within the same scope
        using var scope = provider.CreateScope();
        var context1 = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var context2 = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // THEN: Both resolutions return the SAME instance (scoped singleton-within-scope)
        Assert.Same(context1, context2);
    }

    // -----------------------------------------------------------------------
    // Edge Case 7: No DbSet for clientes or contactos — model has zero entity types
    // Boundary: AppDbContext must have an empty model (no entities registered in Story 1.3).
    // -----------------------------------------------------------------------

    [Fact]
    public void AppDbContext_ModelHasZeroEntityTypes_InStory13Scope()
    {
        // GIVEN: An AppDbContext with InMemory database
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("TestDb_ZeroEntities")
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: The model entity types are enumerated
        var entityTypes = context.Model.GetEntityTypes().ToList();

        // THEN: Zero entity types — no domain tables defined in this story
        Assert.Empty(entityTypes);
    }

    // -----------------------------------------------------------------------
    // Edge Case 8: Async disposal (IAsyncDisposable) does not throw
    // Boundary: EF Core DbContext implements IAsyncDisposable — await using must work.
    // -----------------------------------------------------------------------

    [Fact]
    public async Task AppDbContext_AsyncDisposal_DoesNotThrow()
    {
        // GIVEN: An AppDbContext
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("TestDb_AsyncDisposal")
            .Options;

        Exception? caughtException = null;
        try
        {
            // WHEN: The context is disposed asynchronously via await using
            await using var context = new AppDbContext(options);
            _ = context.Model; // Force model build before disposal
        }
        catch (Exception ex)
        {
            caughtException = ex;
        }

        // THEN: No exception is thrown during async disposal
        Assert.Null(caughtException);
    }

    // -----------------------------------------------------------------------
    // Edge Case 9: Multiple AppDbContext instances created concurrently do not interfere
    // Boundary: Concurrent instantiation must be thread-safe.
    // -----------------------------------------------------------------------

    [Fact]
    public async Task AppDbContext_ConcurrentInstantiation_AllSucceed()
    {
        // GIVEN: Multiple threads creating separate AppDbContext instances simultaneously
        var tasks = Enumerable.Range(0, 10).Select(i =>
            Task.Run(() =>
            {
                var options = new DbContextOptionsBuilder<AppDbContext>()
                    .UseInMemoryDatabase($"TestDb_Concurrent_{i}")
                    .Options;

                using var context = new AppDbContext(options);
                _ = context.Model;
                return context.Model.GetEntityTypes().Count();
            })
        );

        // WHEN: All tasks complete
        var results = await Task.WhenAll(tasks);

        // THEN: All 10 instances were created without exception, each with zero entities
        Assert.All(results, count => Assert.Equal(0, count));
    }

    // -----------------------------------------------------------------------
    // Edge Case 10: AppDbContext constructor does NOT perform I/O or open a connection
    // Boundary: DbContext is lazy — constructor must NOT open DB connection.
    // This ensures DI registration succeeds even when PostgreSQL is unavailable.
    // -----------------------------------------------------------------------

    [Fact]
    public void AppDbContext_Constructor_DoesNotOpenConnection_WithNpgsqlOptions()
    {
        // GIVEN: DbContextOptions for a non-existent Npgsql connection (bad host)
        // We use Npgsql options but do NOT call any method that triggers I/O
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=127.0.0.1;Port=19999;Database=nonexistent;Username=nobody;Password=nobody;Connect Timeout=1")
            .Options;

        // WHEN: AppDbContext is constructed (constructor only — no DB call)
        Exception? caughtException = null;
        AppDbContext? context = null;
        try
        {
            context = new AppDbContext(options);
        }
        catch (Exception ex)
        {
            caughtException = ex;
        }
        finally
        {
            context?.Dispose();
        }

        // THEN: No exception is thrown — constructor is lazy and does NOT open the connection
        Assert.Null(caughtException);
    }

    // -----------------------------------------------------------------------
    // Edge Case 11: ApplyConfigurationsFromAssembly with empty assembly does NOT throw
    // Boundary: Infrastructure assembly has no IEntityTypeConfiguration<T> in Story 1.3.
    // -----------------------------------------------------------------------

    [Fact]
    public void AppDbContext_OnModelCreating_WithNoConfigurations_DoesNotThrow()
    {
        // GIVEN: AppDbContext with InMemory database and no entity configurations in assembly
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("TestDb_EmptyConfigurations")
            .Options;

        // WHEN: Model is built (which calls OnModelCreating → ApplyConfigurationsFromAssembly)
        Exception? caughtException = null;
        try
        {
            using var context = new AppDbContext(options);
            _ = context.Model; // Force OnModelCreating
        }
        catch (Exception ex)
        {
            caughtException = ex;
        }

        // THEN: No exception — empty assembly with no entity configurations is valid
        Assert.Null(caughtException);
    }
}
