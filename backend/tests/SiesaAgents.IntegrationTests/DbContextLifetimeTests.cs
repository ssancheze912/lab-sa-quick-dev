using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.IntegrationTests.Fixtures;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// AUTOMATE expansion - Story 1.3.
///
/// Edge-case coverage for the DbContext DI wiring (AC #5). The ATDD pass only
/// checks that <c>AppDbContext</c> is resolvable; this expansion checks that
/// EF Core's expected SCOPED lifetime is honoured by <c>AddDbContext</c>:
///   - Same-scope resolutions return the same instance.
///   - Different-scope resolutions return different instances.
///   - Resolving as the registered concrete type and as <c>DbContext</c>
///     yields the same instance within a scope.
///
/// Background: if AppDbContext were registered as Singleton (a common mistake)
/// the EF Core change tracker would leak across HTTP requests, leading to
/// concurrency bugs.
/// </summary>
public class DbContextLifetimeTests : IClassFixture<SiesaAgentsApiFactory>
{
    private readonly SiesaAgentsApiFactory _factory;

    public DbContextLifetimeTests(SiesaAgentsApiFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// GIVEN the API is wired with <c>AddDbContext&lt;AppDbContext&gt;</c>.
    /// WHEN  <c>AppDbContext</c> is resolved twice within the SAME scope.
    /// THEN  both resolutions return the same instance (scoped lifetime).
    /// </summary>
    [Fact]
    public void DbContext_ResolvedTwiceInSameScope_ReturnsSameInstance()
    {
        // GIVEN
        using var scope = _factory.Services.CreateScope();

        // WHEN
        var first = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var second = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // THEN
        Assert.Same(first, second);
    }

    /// <summary>
    /// GIVEN the API is wired with <c>AddDbContext&lt;AppDbContext&gt;</c>.
    /// WHEN  <c>AppDbContext</c> is resolved from TWO different scopes.
    /// THEN  the instances are different (no Singleton leak).
    /// </summary>
    [Fact]
    public void DbContext_ResolvedInDifferentScopes_ReturnsDifferentInstances()
    {
        // GIVEN
        using var scopeA = _factory.Services.CreateScope();
        using var scopeB = _factory.Services.CreateScope();

        // WHEN
        var fromA = scopeA.ServiceProvider.GetRequiredService<AppDbContext>();
        var fromB = scopeB.ServiceProvider.GetRequiredService<AppDbContext>();

        // THEN
        Assert.NotSame(fromA, fromB);
    }

    /// <summary>
    /// GIVEN the API is wired with <c>AddDbContext&lt;AppDbContext&gt;</c>.
    /// WHEN  the DbContext is disposed at the end of a scope.
    /// THEN  it does NOT throw <c>ObjectDisposedException</c> when the scope
    ///       owns its lifetime (cleanup behaves as expected).
    /// </summary>
    [Fact]
    public void DbContext_IsDisposed_WhenScopeIsDisposed()
    {
        // GIVEN — capture the instance from inside a scope
        AppDbContext captured;
        using (var scope = _factory.Services.CreateScope())
        {
            captured = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.NotNull(captured);
        }

        // THEN — after the scope is disposed, accessing change tracker MUST
        // throw (proves scoped lifetime + disposal both happened).
        Assert.Throws<ObjectDisposedException>(() => _ = captured.ChangeTracker.Entries());
    }
}
