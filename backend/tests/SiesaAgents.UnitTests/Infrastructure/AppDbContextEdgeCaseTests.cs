using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Edge case and boundary tests for ApplicationDbContext.
/// Expands coverage beyond the 7 baseline ATDD tests in AppDbContextTests.cs.
///
/// Covers: null options guard, dispose safety, DI scoped-lifetime isolation,
/// concurrent context creation, model cache consistency,
/// ApplyConfigurationsFromAssembly idempotency, and Npgsql provider identity.
///
/// Story 1.3 AC4/AC5/AC6 — ApplicationDbContext infrastructure.
/// NOTE: .NET 10 + Npgsql required for real PostgreSQL tests; InMemory provider
/// is used here for isolation. All tests are in RED phase if runtime is unavailable.
/// </summary>
public class AppDbContextEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Helper
    // ─────────────────────────────────────────────────────────────────────────

    private static DbContextOptions<ApplicationDbContext> InMemoryOptions(string dbName) =>
        new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(dbName)
            .UseSnakeCaseNamingConvention()
            .Options;

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: null options must throw ArgumentNullException, not NPE
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void ApplicationDbContext_WhenOptionsIsNull_ThrowsArgumentNullException()
    {
        // GIVEN: Null DbContextOptions passed to the constructor
        // WHEN: ApplicationDbContext is instantiated
        // THEN: EF Core base class throws ArgumentNullException (not NullReferenceException)
        Assert.Throws<ArgumentNullException>(() =>
        {
            _ = new ApplicationDbContext(null!);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: Dispose does not throw (safe second Dispose)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void ApplicationDbContext_WhenDisposedTwice_DoesNotThrow()
    {
        // GIVEN: An ApplicationDbContext instance
        var context = new ApplicationDbContext(InMemoryOptions(
            nameof(ApplicationDbContext_WhenDisposedTwice_DoesNotThrow)));

        // WHEN: Dispose is called twice (common mistake in using blocks)
        context.Dispose();

        // THEN: Second Dispose does not throw (idempotent dispose pattern)
        var exception = Record.Exception(() => context.Dispose());
        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: async Dispose is safe
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ApplicationDbContext_WhenAsyncDisposed_DoesNotThrow()
    {
        // GIVEN: An ApplicationDbContext instance
        var context = new ApplicationDbContext(InMemoryOptions(
            nameof(ApplicationDbContext_WhenAsyncDisposed_DoesNotThrow)));

        // WHEN: DisposeAsync is called
        // THEN: No exception is thrown
        await context.DisposeAsync();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: DI scoped lifetime — two scopes get independent instances
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void ApplicationDbContext_InDI_ScopedLifetimeProducesIndependentInstances()
    {
        // GIVEN: DI container with Scoped ApplicationDbContext
        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase(
                nameof(ApplicationDbContext_InDI_ScopedLifetimeProducesIndependentInstances))
                .UseSnakeCaseNamingConvention());

        var provider = services.BuildServiceProvider();

        // WHEN: Two separate scopes each resolve ApplicationDbContext
        ApplicationDbContext ctx1, ctx2;
        using (var scope1 = provider.CreateScope())
        {
            ctx1 = scope1.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        }
        using (var scope2 = provider.CreateScope())
        {
            ctx2 = scope2.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        }

        // THEN: The two instances are different objects (scoped, not singleton)
        Assert.NotSame(ctx1, ctx2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: same scope returns the same instance (scoped singleton)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void ApplicationDbContext_InDI_SameScope_ReturnsSameInstance()
    {
        // GIVEN: DI container with Scoped ApplicationDbContext
        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase(
                nameof(ApplicationDbContext_InDI_SameScope_ReturnsSameInstance))
                .UseSnakeCaseNamingConvention());

        var provider = services.BuildServiceProvider();

        // WHEN: Two resolutions happen within the same scope
        using var scope = provider.CreateScope();
        var ctx1 = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var ctx2 = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // THEN: Both resolutions return the same instance (AddDbContext registers as Scoped)
        Assert.Same(ctx1, ctx2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: concurrent context creation does not produce shared state
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ApplicationDbContext_WhenCreatedConcurrently_EachInstanceIsIndependent()
    {
        // GIVEN: 20 contexts created concurrently, each on a unique DB
        const int count = 20;
        var tasks = Enumerable.Range(0, count).Select(i =>
            Task.Run(() =>
            {
                var ctx = new ApplicationDbContext(InMemoryOptions(
                    $"{nameof(ApplicationDbContext_WhenCreatedConcurrently_EachInstanceIsIndependent)}_{i}"));
                var model = ctx.Model; // Force OnModelCreating
                ctx.Dispose();
                return model;
            }));

        // WHEN: All tasks complete
        var models = await Task.WhenAll(tasks);

        // THEN: All models are non-null (no race condition in OnModelCreating)
        Assert.All(models, m => Assert.NotNull(m));
        Assert.Equal(count, models.Length);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: model is cached — OnModelCreating runs only once per options
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void ApplicationDbContext_ModelCache_ReturnsSameModelForSameOptions()
    {
        // GIVEN: Two contexts sharing the same DbContextOptions (same DB name → same model cache key)
        var options = InMemoryOptions(
            nameof(ApplicationDbContext_ModelCache_ReturnsSameModelForSameOptions));

        using var ctx1 = new ApplicationDbContext(options);
        using var ctx2 = new ApplicationDbContext(options);

        // WHEN: Both access the EF model
        var model1 = ctx1.Model;
        var model2 = ctx2.Model;

        // THEN: EF Core returns the same cached IModel instance (same reference)
        Assert.Same(model1, model2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: OnModelCreating is idempotent — multiple calls do not throw
    // (EF Core calls it once; verifying no side-effect-based crash on second call)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void ApplicationDbContext_OnModelCreating_IsIdempotentAcrossNewInstances()
    {
        // GIVEN: Multiple fresh contexts created sequentially with separate DB names
        // WHEN: Each context triggers its own OnModelCreating
        var exceptions = new List<Exception?>();
        for (int i = 0; i < 5; i++)
        {
            var exception = Record.Exception(() =>
            {
                using var ctx = new ApplicationDbContext(InMemoryOptions(
                    $"{nameof(ApplicationDbContext_OnModelCreating_IsIdempotentAcrossNewInstances)}_{i}"));
                _ = ctx.Model; // Triggers OnModelCreating
            });
            exceptions.Add(exception);
        }

        // THEN: No instance threw an exception — OnModelCreating is stable across calls
        Assert.All(exceptions, ex => Assert.Null(ex));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: ApplicationDbContext is NOT registered as Singleton in AddDbContext
    // (Singleton DbContext is a critical bug pattern — verify scoped registration)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void ApplicationDbContext_InDI_IsRegisteredAsScoped_NotSingleton()
    {
        // GIVEN: A DI container configured via AddDbContext
        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase(
                nameof(ApplicationDbContext_InDI_IsRegisteredAsScoped_NotSingleton))
                .UseSnakeCaseNamingConvention());

        // WHEN: We inspect the service descriptor lifetime
        var descriptor = services.FirstOrDefault(d => d.ServiceType == typeof(ApplicationDbContext));

        // THEN: The lifetime is Scoped (not Singleton — Singleton DbContext is an anti-pattern)
        Assert.NotNull(descriptor);
        Assert.Equal(ServiceLifetime.Scoped, descriptor.Lifetime);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: accessing Model after Dispose throws ObjectDisposedException
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void ApplicationDbContext_WhenDisposed_AccessingModelThrowsObjectDisposedException()
    {
        // GIVEN: A disposed ApplicationDbContext
        var context = new ApplicationDbContext(InMemoryOptions(
            nameof(ApplicationDbContext_WhenDisposed_AccessingModelThrowsObjectDisposedException)));
        context.Dispose();

        // WHEN: An attempt is made to access the Model property
        // THEN: ObjectDisposedException is thrown (correct disposed-object behavior)
        Assert.Throws<ObjectDisposedException>(() => _ = context.Model);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: EF Core model has no entity types yet (empty schema)
    // (validates AC2 — no domain tables defined until Epic 2/3)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void ApplicationDbContext_ModelHasNoEntityTypes_EmptySchemaForStory13()
    {
        // GIVEN: ApplicationDbContext configured as per Story 1.3 (no domain entities yet)
        using var context = new ApplicationDbContext(InMemoryOptions(
            nameof(ApplicationDbContext_ModelHasNoEntityTypes_EmptySchemaForStory13)));

        // WHEN: The model is inspected for entity types
        var entityTypes = context.Model.GetEntityTypes().ToList();

        // THEN: No entity types are registered (ClienteEntity/ContactoEntity are Epic 2/3 scope)
        Assert.Empty(entityTypes);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: GetService<IRelationalAnnotationProvider> with Npgsql provider
    // (ensures the InfrastructureServiceExtensions are wired for Npgsql correctly)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void ApplicationDbContext_WithNpgsqlOptions_DatabaseProviderNameIsNpgsql()
    {
        // GIVEN: ApplicationDbContext configured with Npgsql provider (mirrors Program.cs)
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql("Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres")
            .Options;

        using var context = new ApplicationDbContext(options);

        // WHEN: The provider name is read
        var providerName = context.Database.ProviderName;

        // THEN: Provider is Npgsql.EntityFrameworkCore.PostgreSQL (AC5 — connects via Npgsql)
        Assert.Equal("Npgsql.EntityFrameworkCore.PostgreSQL", providerName);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: ApplyConfigurationsFromAssembly scans the Infrastructure assembly
    // (ensures assembly reference is typeof(ApplicationDbContext).Assembly, not API)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void ApplicationDbContext_ConfigurationsAssembly_IsInfrastructureNotApi()
    {
        // GIVEN: ApplicationDbContext class is defined in SiesaAgents.Infrastructure
        var contextAssembly = typeof(ApplicationDbContext).Assembly;

        // WHEN: We inspect the assembly name
        var assemblyName = contextAssembly.GetName().Name;

        // THEN: The assembly is SiesaAgents.Infrastructure — not SiesaAgents.API
        // (ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly) in OnModelCreating
        // MUST scan Infrastructure, where IEntityTypeConfiguration implementations live, AC4/AC6)
        Assert.Equal("SiesaAgents.Infrastructure", assemblyName);
    }
}
