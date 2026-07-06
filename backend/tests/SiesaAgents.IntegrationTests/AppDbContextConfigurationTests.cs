using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Story 1.3 AC #1 — expands ATDD coverage for <c>AppDbContext</c> DI registration and
/// connection configuration. These checks are pure DI-container/config inspection (they do
/// not query the database), so — unlike <c>AppDbContextMigrationTests</c> — they never need
/// a soft-skip guard and always run, even when PostgreSQL is unreachable.
///
/// Motivation: the original ATDD suite only verifies the resolved <c>AppDbContext</c> can
/// connect and that the migrations history table is snake_case. It never verifies *how*
/// the context is registered — a regression that accidentally registered it as Singleton
/// (a common and serious DbContext misconfiguration bug causing thread-safety issues and
/// stale connections across requests) would not be caught by any existing test.
/// </summary>
public class AppDbContextConfigurationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public AppDbContextConfigurationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public void AppDbContext_IsRegisteredWithScopedLifetime()
    {
        // GIVEN the API host's configured service collection
        // WHEN the AppDbContext service descriptor is located
        var descriptor = _factory.Services.GetRequiredService<IServiceScopeFactory>();
        using var scope = descriptor.CreateScope();
        var first = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var second = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // THEN resolving twice within the same scope returns the same instance (Scoped, not Transient)
        Assert.Same(first, second);
    }

    [Fact]
    public void AppDbContext_ResolvedFromDifferentScopes_ReturnsDifferentInstances()
    {
        // GIVEN two independent DI scopes (simulating two separate HTTP requests)
        using var scopeA = _factory.Services.CreateScope();
        using var scopeB = _factory.Services.CreateScope();

        // WHEN AppDbContext is resolved from each scope
        var contextA = scopeA.ServiceProvider.GetRequiredService<AppDbContext>();
        var contextB = scopeB.ServiceProvider.GetRequiredService<AppDbContext>();

        // THEN each scope gets its own instance (Scoped, not Singleton) — prevents connection/thread-safety bugs
        Assert.NotSame(contextA, contextB);
    }

    [Fact]
    public void AppDbContext_ConnectionString_TargetsExpectedDatabaseName()
    {
        // GIVEN AppDbContext resolved from the test host's DI container
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // WHEN the underlying connection string is inspected
        var connectionString = dbContext.Database.GetConnectionString();

        // THEN it targets "siesa_agents_db" per Story 1.1's appsettings.Development.json (AC #1 scope)
        Assert.Contains("siesa_agents_db", connectionString);
    }

    [Fact]
    public void AppDbContext_UsesNpgsqlProvider()
    {
        // GIVEN AppDbContext resolved from the test host's DI container
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // WHEN the active provider name is inspected
        var providerName = dbContext.Database.ProviderName;

        // THEN it is the Npgsql provider (not SqlServer/Sqlite/InMemory)
        Assert.Equal("Npgsql.EntityFrameworkCore.PostgreSQL", providerName);
    }
}
