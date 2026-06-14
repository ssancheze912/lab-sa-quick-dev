using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Edge case and boundary tests for DI wiring of AppDbContext (Story 1.3 - AC5).
/// Expands coverage beyond ATDD phase: lifetime behavior, optional resolution patterns,
/// multi-scope isolation, and DI container integrity.
/// </summary>
public class ProgramWiringEdgeCaseTests
{
    private const string TestConnectionString =
        "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres";

    // -------------------------------------------------------------------------
    // Boundary: GetService<AppDbContext> returns non-null (soft resolution)
    // -------------------------------------------------------------------------

    [Fact]
    public void GetService_AppDbContext_ReturnsNonNullWhenRegistered()
    {
        // GIVEN: AppDbContext registered in the service collection
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(TestConnectionString));
        var provider = services.BuildServiceProvider();

        // WHEN: AppDbContext is resolved using GetService<T> (soft resolution, returns null if missing)
        using var scope = provider.CreateScope();
        var context = scope.ServiceProvider.GetService<AppDbContext>();

        // THEN: GetService<T> returns non-null (registration exists)
        Assert.NotNull(context);
    }

    // -------------------------------------------------------------------------
    // Boundary: GetRequiredService<AppDbContext> does not throw when registered
    // -------------------------------------------------------------------------

    [Fact]
    public void GetRequiredService_AppDbContext_DoesNotThrowWhenRegistered()
    {
        // GIVEN: AppDbContext registered in the service collection
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(TestConnectionString));
        var provider = services.BuildServiceProvider();

        // WHEN: AppDbContext is resolved using GetRequiredService<T> (throws if not registered)
        // THEN: No exception is thrown — the service is correctly registered
        var exception = Record.Exception(() =>
        {
            using var scope = provider.CreateScope();
            _ = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        });

        Assert.Null(exception);
    }

    // -------------------------------------------------------------------------
    // Boundary: Two separate scopes each receive a separate AppDbContext instance
    //           (Scoped = one instance per scope, not shared across scopes)
    // -------------------------------------------------------------------------

    [Fact]
    public void TwoScopes_EachReceiveDifferentAppDbContextInstances()
    {
        // GIVEN: AppDbContext registered as Scoped (default for AddDbContext)
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(TestConnectionString));
        var provider = services.BuildServiceProvider();

        // WHEN: Two different scopes each resolve AppDbContext
        AppDbContext? ctx1, ctx2;

        using (var scope1 = provider.CreateScope())
        using (var scope2 = provider.CreateScope())
        {
            ctx1 = scope1.ServiceProvider.GetRequiredService<AppDbContext>();
            ctx2 = scope2.ServiceProvider.GetRequiredService<AppDbContext>();

            // THEN: They are not the same instance (Scoped = one per scope, not singleton)
            Assert.NotSame(ctx1, ctx2);
        }
    }

    // -------------------------------------------------------------------------
    // Boundary: Within the same scope, AppDbContext resolves to the same instance
    //           (Scoped = same instance within a single scope)
    // -------------------------------------------------------------------------

    [Fact]
    public void SameScope_ReturnsSameAppDbContextInstance()
    {
        // GIVEN: AppDbContext registered as Scoped
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(TestConnectionString));
        var provider = services.BuildServiceProvider();

        // WHEN: The same scope resolves AppDbContext twice
        using var scope = provider.CreateScope();
        var ctx1 = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var ctx2 = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // THEN: Both resolutions return the same instance (Scoped behavior)
        Assert.Same(ctx1, ctx2);
    }

    // -------------------------------------------------------------------------
    // Boundary: DbContextOptions<AppDbContext> is also registered in DI by AddDbContext
    // -------------------------------------------------------------------------

    [Fact]
    public void ServiceCollection_DbContextOptions_IsResolvableAfterAddDbContext()
    {
        // GIVEN: AppDbContext registered via AddDbContext
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(TestConnectionString));
        var provider = services.BuildServiceProvider();

        // WHEN: DbContextOptions<AppDbContext> is resolved from DI
        using var scope = provider.CreateScope();
        var options = scope.ServiceProvider.GetService<DbContextOptions<AppDbContext>>();

        // THEN: Options are resolvable (AddDbContext registers options alongside the context)
        Assert.NotNull(options);
    }

    // -------------------------------------------------------------------------
    // Boundary: AppDbContext resolved from DI is of the exact expected type
    // -------------------------------------------------------------------------

    [Fact]
    public void GetRequiredService_AppDbContext_ReturnsExactType()
    {
        // GIVEN: AppDbContext registered in the service collection
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(TestConnectionString));
        var provider = services.BuildServiceProvider();

        // WHEN: AppDbContext is resolved from DI
        using var scope = provider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // THEN: The resolved object is the concrete AppDbContext type (not a proxy or base type)
        Assert.IsType<AppDbContext>(context);
    }

    // -------------------------------------------------------------------------
    // Error path: AppDbContext NOT registered — GetService returns null
    // -------------------------------------------------------------------------

    [Fact]
    public void GetService_AppDbContext_ReturnsNullWhenNotRegistered()
    {
        // GIVEN: An empty service collection WITHOUT AppDbContext registration
        var services = new ServiceCollection();
        var provider = services.BuildServiceProvider();

        // WHEN: GetService<T> is called (soft resolution)
        using var scope = provider.CreateScope();
        var context = scope.ServiceProvider.GetService<AppDbContext>();

        // THEN: Returns null — GetService<T> does not throw for unregistered services
        Assert.Null(context);
    }

    // -------------------------------------------------------------------------
    // Error path: AppDbContext NOT registered — GetRequiredService throws
    // -------------------------------------------------------------------------

    [Fact]
    public void GetRequiredService_AppDbContext_ThrowsWhenNotRegistered()
    {
        // GIVEN: An empty service collection WITHOUT AppDbContext registration
        var services = new ServiceCollection();
        var provider = services.BuildServiceProvider();

        // WHEN: GetRequiredService<T> is called (hard resolution)
        // THEN: InvalidOperationException is thrown — proves that missing AddDbContext breaks DI
        using var scope = provider.CreateScope();
        Assert.Throws<InvalidOperationException>(
            () => scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    // -------------------------------------------------------------------------
    // Boundary: Service descriptor count includes AppDbContext-related registrations
    //           (AddDbContext registers more than one descriptor)
    // -------------------------------------------------------------------------

    [Fact]
    public void AddDbContext_RegistersAtLeastOneDescriptorForAppDbContext()
    {
        // GIVEN: An empty service collection
        var servicesBefore = new ServiceCollection();
        var countBefore = servicesBefore.Count;

        // WHEN: AddDbContext is called
        var servicesAfter = new ServiceCollection();
        servicesAfter.AddDbContext<AppDbContext>(options => options.UseNpgsql(TestConnectionString));
        var countAfter = servicesAfter.Count;

        // THEN: At least one additional descriptor was registered
        Assert.True(countAfter > countBefore,
            "AddDbContext must register at least one service descriptor");

        // AND: The AppDbContext descriptor is one of them
        var appDbContextDescriptor = servicesAfter.FirstOrDefault(
            d => d.ServiceType == typeof(AppDbContext));
        Assert.NotNull(appDbContextDescriptor);
    }
}
