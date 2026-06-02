using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// RED-phase API integration tests covering Story 1.3 AC #5 — EF Core DI wiring.
///
/// Verifies that <c>AppDbContext</c> is registered exactly once via
/// <c>builder.Services.AddDbContext&lt;AppDbContext&gt;(options =&gt;
///   options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")))</c>
/// inside <c>Program.cs</c>.
///
/// RED until that <c>AddDbContext</c> call lands in <c>Program.cs</c> (Story Task 3).
/// </summary>
[Trait("Category", "Api")]
public class EfCoreDiRegistrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public EfCoreDiRegistrationTests(WebApplicationFactory<Program> factory)
    {
        // GIVEN: a dev-environment test host so the Development connection string resolves.
        _factory = factory.WithWebHostBuilder(b => b.UseEnvironment("Development"));
    }

    [Fact]
    public void AppDbContext_IsResolvableFromRootServiceProvider()
    {
        // GIVEN: the API host's DI container
        using var scope = _factory.Services.CreateScope();

        // WHEN: we resolve AppDbContext from a request scope
        var ctx = scope.ServiceProvider.GetService<AppDbContext>();

        // THEN: AddDbContext<AppDbContext>(...) MUST have registered the context (AC #5).
        Assert.NotNull(ctx);
    }

    [Fact]
    public void AppDbContext_IsConfiguredWithNpgsqlProvider()
    {
        // GIVEN: the API host's DI container
        using var scope = _factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // WHEN: we read the provider name from the materialized DbContext
        var providerName = ctx.Database.ProviderName;

        // THEN: the registered provider MUST be Npgsql (AC #5 — UseNpgsql, NOT UseSqlite/UseInMemory).
        Assert.Equal("Npgsql.EntityFrameworkCore.PostgreSQL", providerName);
    }
}
