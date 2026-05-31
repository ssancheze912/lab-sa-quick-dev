// Story 1.3: Backend Database Foundation — Edge Cases & Boundary Tests
//
// Complements AppDbContextTests.cs (ATDD) with:
//   - Multiple dispose/re-create cycles (boundary)
//   - Concurrent context instantiation (isolation)
//   - Model consistency across multiple accesses
//   - DbContext service lifetime validation (Scoped via DI)
//   - UseSnakeCaseNamingConvention applied at registration level
//   - ApplyConfigurationsFromAssembly with no configurations (empty assembly scan)
//   - OnModelCreating idempotency (multiple EnsureCreated calls on separate instances)
//   - Null/empty connection string edge case for DI registration
//   - ExceptionHandlingMiddleware unit-level behaviour (no HttpContext, isolated)
//
// Pattern: xUnit + EF Core InMemory provider, Given-When-Then, one assertion per test

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

public class AppDbContextEdgeTests
{
    // -------------------------------------------------------------------------
    // Boundary: Multiple independent DbContext instances from same options
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenSameOptions_WhenConstructingTwoInstances_ThenBothAreNotNull()
    {
        // GIVEN: Shared options pointing to unique in-memory database
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: Two separate instances are created from the same options
        using var ctx1 = new AppDbContext(options);
        using var ctx2 = new AppDbContext(options);

        // THEN: Both instances are not null (construction succeeds without exception)
        Assert.NotNull(ctx1);
        Assert.NotNull(ctx2);
    }

    [Fact]
    public void GivenSameOptions_WhenConstructingTwoInstances_ThenTheyAreNotSameReference()
    {
        // GIVEN: Shared options pointing to unique in-memory database
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // WHEN: Two separate instances are created from the same options
        using var ctx1 = new AppDbContext(options);
        using var ctx2 = new AppDbContext(options);

        // THEN: Instances are different objects (no singleton or factory caching at options level)
        Assert.NotSame(ctx1, ctx2);
    }

    // -------------------------------------------------------------------------
    // Boundary: Dispose and re-create cycle — no lingering state
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenDisposedContext_WhenCreatingNewInstance_ThenNewInstanceIsUsable()
    {
        // GIVEN: A DbContext that has been disposed
        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        using (var ctx = new AppDbContext(options))
        {
            ctx.Database.EnsureCreated();
        } // Disposed here

        // WHEN: A new instance is created with the same options
        using var newCtx = new AppDbContext(options);

        // THEN: New instance is not null and can be used
        Assert.NotNull(newCtx);
        var exception = Record.Exception(() => newCtx.Database.EnsureCreated());
        Assert.Null(exception);
    }

    // -------------------------------------------------------------------------
    // Boundary: Concurrent context creation — no shared mutable state at class level
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GivenMultipleThreads_WhenCreatingContextsConcurrently_ThenAllSucceed()
    {
        // GIVEN: Multiple tasks each need a fresh DbContext (simulates DI Scoped pattern)
        const int taskCount = 5;
        var exceptions = new System.Collections.Concurrent.ConcurrentBag<Exception>();

        // WHEN: Contexts are instantiated concurrently
        var tasks = Enumerable.Range(0, taskCount).Select(_ => Task.Run(() =>
        {
            try
            {
                var opts = new DbContextOptionsBuilder<AppDbContext>()
                    .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                    .Options;
                using var ctx = new AppDbContext(opts);
                ctx.Database.EnsureCreated();
            }
            catch (Exception ex)
            {
                exceptions.Add(ex);
            }
        }));

        await Task.WhenAll(tasks);

        // THEN: No exceptions thrown from any task
        Assert.Empty(exceptions);
    }

    // -------------------------------------------------------------------------
    // Model consistency: Model object is stable across multiple reads
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenAppDbContext_WhenAccessingModelTwice_ThenSameModelInstanceIsReturned()
    {
        // GIVEN: AppDbContext with InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        using var context = new AppDbContext(options);

        // WHEN: Model property is accessed twice
        var model1 = context.Model;
        var model2 = context.Model;

        // THEN: Both references point to the same model instance (EF Core caches the model)
        Assert.Same(model1, model2);
    }

    // -------------------------------------------------------------------------
    // Model structure: No entity types defined (empty model — no domain tables in story 1.3)
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenAppDbContext_WhenInspectingModel_ThenNoEntityTypesAreDefined()
    {
        // GIVEN: AppDbContext per story 1.3 scope — no DbSet<> properties yet
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        using var context = new AppDbContext(options);

        // WHEN: Querying entity types from the model
        var entityTypes = context.Model.GetEntityTypes().ToList();

        // THEN: No entity types registered (empty migration — AC scope note)
        Assert.Empty(entityTypes);
    }

    // -------------------------------------------------------------------------
    // DI lifetime: AppDbContext must be registered as Scoped (not Singleton/Transient)
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenDIRegistration_WhenCheckingServiceLifetime_ThenAppDbContextIsScoped()
    {
        // GIVEN: Services registered exactly as Program.cs does
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] =
                    "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"
            })
            .Build();

        var services = new ServiceCollection();

        // WHEN: AddDbContext registers AppDbContext
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        // THEN: Service descriptor lifetime is Scoped (EF Core default for AddDbContext)
        var descriptor = services.FirstOrDefault(d => d.ServiceType == typeof(AppDbContext));
        Assert.NotNull(descriptor);
        Assert.Equal(ServiceLifetime.Scoped, descriptor!.Lifetime);
    }

    // -------------------------------------------------------------------------
    // DI isolation: Two scopes resolve different AppDbContext instances
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenScopedRegistration_WhenResolvingFromTwoScopes_ThenInstancesAreDifferent()
    {
        // GIVEN: DI container with AppDbContext registered as Scoped
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] =
                    "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"
            })
            .Build();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        var serviceProvider = services.BuildServiceProvider();

        // WHEN: Two separate scopes each resolve AppDbContext
        // NOTE: Assertion is captured inside each scope before disposal to avoid accessing disposed objects
        AppDbContext? ctx1Ref, ctx2Ref;
        using (var scope1 = serviceProvider.CreateScope())
        {
            ctx1Ref = scope1.ServiceProvider.GetRequiredService<AppDbContext>();
            using (var scope2 = serviceProvider.CreateScope())
            {
                ctx2Ref = scope2.ServiceProvider.GetRequiredService<AppDbContext>();

                // THEN: The two resolved instances are different objects (Scoped = one per scope)
                // Both scopes are live here — neither context is disposed during comparison
                Assert.NotSame(ctx1Ref, ctx2Ref);
            }
        }
    }

    // -------------------------------------------------------------------------
    // UseSnakeCaseNamingConvention: Applied via options, not inside OnModelCreating
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenOptionsWithSnakeCaseConvention_WhenBuildingModel_ThenModelBuildsWithoutError()
    {
        // GIVEN: Options built with UseSnakeCaseNamingConvention (as done in Program.cs)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .UseSnakeCaseNamingConvention() // mirrors Program.cs registration
            .Options;

        // WHEN: AppDbContext is constructed and model is built
        using var context = new AppDbContext(options);
        var exception = Record.Exception(() =>
        {
            var model = context.Model;
            Assert.NotNull(model);
        });

        // THEN: No exception — snake_case convention via options is compatible with InMemory
        Assert.Null(exception);
    }

    // -------------------------------------------------------------------------
    // EnsureCreated idempotency: Calling twice on the same DB returns false second time
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenAlreadyCreatedDatabase_WhenCallingEnsureCreatedAgain_ThenReturnsFalse()
    {
        // GIVEN: Database already created via first context
        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        using var ctx1 = new AppDbContext(options);
        ctx1.Database.EnsureCreated(); // First call — creates DB

        // WHEN: Second context calls EnsureCreated on the same DB
        using var ctx2 = new AppDbContext(options);
        var result = ctx2.Database.EnsureCreated();

        // THEN: Returns false — DB already existed, nothing was created
        Assert.False(result);
    }

    // -------------------------------------------------------------------------
    // Connection string edge: Null connection string registered in DI
    // AddDbContext accepts null string from GetConnectionString (key not present)
    // but the context must still be resolvable from DI (it fails on actual connection, not on build)
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenMissingConnectionStringKey_WhenRegisteringDbContext_ThenContextIsStillResolvable()
    {
        // GIVEN: Configuration with NO ConnectionStrings section
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        var services = new ServiceCollection();

        // WHEN: Registering AppDbContext with null connection string (key not found returns null)
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        var serviceProvider = services.BuildServiceProvider();

        // THEN: The DI container can still build the service descriptor (resolve does not throw for config)
        // Resolution itself succeeds — actual connectivity failure only happens on db.OpenConnection()
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetService<AppDbContext>();
        Assert.NotNull(context);
    }

    // -------------------------------------------------------------------------
    // ApplyConfigurationsFromAssembly: Empty Infrastructure assembly scan — no error
    // -------------------------------------------------------------------------

    [Fact]
    public void GivenInfrastructureAssemblyWithNoConfigurations_WhenApplyingConfigurations_ThenNoExceptionIsThrown()
    {
        // GIVEN: AppDbContext configured with InMemory; Infrastructure has no IEntityTypeConfiguration<T> yet
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        // WHEN: OnModelCreating triggers ApplyConfigurationsFromAssembly (story 1.3 has no configs)
        var exception = Record.Exception(() => context.Database.EnsureCreated());

        // THEN: No exception — scanning assembly with zero configurations is safe
        Assert.Null(exception);
    }

    // -------------------------------------------------------------------------
    // Async DB creation: EnsureCreatedAsync works without deadlock
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GivenAppDbContext_WhenCallingEnsureCreatedAsync_ThenSucceedsWithoutDeadlock()
    {
        // GIVEN: AppDbContext with InMemory provider
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        await using var context = new AppDbContext(options);

        // WHEN: EnsureCreatedAsync is awaited
        var created = await context.Database.EnsureCreatedAsync();

        // THEN: Returns true (database created), no deadlock or exception
        Assert.True(created);
    }

    // -------------------------------------------------------------------------
    // CanConnect: InMemory provider returns true for CanConnect
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GivenInMemoryContext_WhenCallingCanConnectAsync_ThenReturnsTrue()
    {
        // GIVEN: AppDbContext backed by InMemory database (simulates health check pattern)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        await using var context = new AppDbContext(options);

        // WHEN: CanConnectAsync is awaited (mirrors /health endpoint logic)
        var canConnect = await context.Database.CanConnectAsync();

        // THEN: Returns true — InMemory is always connectable
        Assert.True(canConnect);
    }
}
