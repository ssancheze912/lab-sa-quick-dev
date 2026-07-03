using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Story 1.3 AC #6 — validates that <c>AppDbContext</c> is registered in the
/// <c>WebApplication</c> DI container, uses the Npgsql provider (not SQLite /
/// InMemory), and has the expected <c>Scoped</c> lifetime.
///
/// These assertions were NOT in the ATDD test file — ATDD only inspected
/// <c>OnModelCreating</c> in isolation via a plain <c>DbContextOptionsBuilder</c>.
/// This suite proves the runtime wiring in <c>Program.cs</c> works.
/// </summary>
public class AppDbContextDependencyInjectionTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AppDbContextDependencyInjectionTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public void AppDbContext_is_resolvable_from_the_service_provider_P0()
    {
        // GIVEN: the API is booted through WebApplicationFactory
        // WHEN:  the container is asked for AppDbContext inside a scope
        // THEN:  a non-null instance is returned (proves AddDbContext registered it)
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetService<AppDbContext>();

        Assert.NotNull(dbContext);
    }

    [Fact]
    public void AppDbContext_uses_the_npgsql_provider_P0()
    {
        // The AC forbids SQLite/InMemory outside test projects — asserting the
        // real provider is wired keeps that regression proof automatic.
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var providerName = dbContext.Database.ProviderName;

        Assert.Equal("Npgsql.EntityFrameworkCore.PostgreSQL", providerName);
    }

    [Fact]
    public void AppDbContext_lifetime_is_scoped_P1()
    {
        // AddDbContext<T>() defaults to Scoped — two resolutions inside the same
        // scope must return the same instance, and two scopes must yield distinct instances.
        using var scopeA = _factory.Services.CreateScope();
        var firstFromA = scopeA.ServiceProvider.GetRequiredService<AppDbContext>();
        var secondFromA = scopeA.ServiceProvider.GetRequiredService<AppDbContext>();

        using var scopeB = _factory.Services.CreateScope();
        var fromB = scopeB.ServiceProvider.GetRequiredService<AppDbContext>();

        Assert.Same(firstFromA, secondFromA);        // same scope → same instance
        Assert.NotSame(firstFromA, fromB);           // different scope → different instance
    }

    [Fact]
    public void AppDbContext_connection_string_matches_configuration_P1()
    {
        // Sanity guard: the connection string wired into the DbContext must
        // reference the siesa_agents_db database — catches accidental appsettings
        // regressions that would otherwise only surface at `dotnet ef` time.
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var connectionString = dbContext.Database.GetConnectionString();

        Assert.NotNull(connectionString);
        Assert.Contains("Database=siesa_agents_db", connectionString!, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void AppDbContext_registers_only_expected_entity_types_in_current_scope_P1()
    {
        // Story 2.1 landed ClienteEntity. This guard now enforces the current
        // Epic 2 baseline: exactly the ClienteEntity is registered — no
        // premature ContactoEntity (Epic 3) leakage via
        // ApplyConfigurationsFromAssembly. Update this assertion as later epics
        // legitimately land new aggregates.
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var entityTypeNames = dbContext.Model
            .GetEntityTypes()
            .Select(e => e.ClrType.Name)
            .OrderBy(n => n)
            .ToList();

        Assert.Equal(new[] { "ClienteEntity" }, entityTypeNames);
    }
}
