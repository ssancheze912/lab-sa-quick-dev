using System.Net;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.IntegrationTests.Fixtures;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// ATDD - RED phase tests for Story 1.3 (Backend Database Foundation).
///
/// Covers:
///   AC #5 — <c>AppDbContext</c> + <c>DbContextOptions</c> are registered via
///           <c>builder.Services.AddDbContext&lt;AppDbContext&gt;(...)</c> in
///           <c>Program.cs</c> reading the connection string from
///           <c>Configuration.GetConnectionString("DefaultConnection")</c> and
///           using <c>UseNpgsql(...)</c>; the API still starts and
///           <c>GET /health</c> returns 200.
///
/// These tests are expected to FAIL until:
///   1. AppDbContext type is wired into DI.
///   2. The API boots in "Testing" environment without DI resolution errors.
/// </summary>
public class DbContextWiringTests : IClassFixture<SiesaAgentsApiFactory>
{
    private readonly SiesaAgentsApiFactory _factory;

    public DbContextWiringTests(SiesaAgentsApiFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// AC #5 — AppDbContext is resolvable via DI after the API boots.
    ///
    /// GIVEN the API is bootstrapped with Program.cs as-shipped.
    /// WHEN  we resolve <c>AppDbContext</c> from the service provider.
    /// THEN  resolution succeeds with a non-null instance.
    /// </summary>
    [Fact]
    public void DbContext_IsResolvableFromDi()
    {
        // GIVEN
        using var scope = _factory.Services.CreateScope();

        // WHEN
        var ctx = scope.ServiceProvider.GetService<AppDbContext>();

        // THEN
        Assert.NotNull(ctx);
    }

    /// <summary>
    /// AC #5 — Health endpoint still returns 200 after AppDbContext is wired
    /// (no behavioural regression on startup).
    ///
    /// GIVEN the API is bootstrapped.
    /// WHEN  <c>GET /health</c> is invoked.
    /// THEN  the response status is 200 OK.
    /// </summary>
    [Fact]
    public async Task Health_ReturnsOk_AfterDbContextWired()
    {
        // GIVEN
        using var client = _factory.CreateClient();

        // WHEN
        var response = await client.GetAsync("/health");

        // THEN
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
