using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Story 1.3 — Backend Database Foundation.
///
/// Failing acceptance tests (RED phase) covering DI wiring and startup regression:
///   - AC #3: <c>ExceptionHandlingMiddleware</c> remains registered BEFORE endpoint mapping
///           after Story 1.3 changes to <c>Program.cs</c>.
///   - AC #5: <c>AppDbContext</c> is registered by <c>AddDbContext</c> reading
///           <c>ConnectionStrings:DefaultConnection</c>; the app still starts and Scalar
///           is still reachable at <c>/scalar</c> (Story 1.1 behavior is not regressed).
///
/// These tests SHALL FAIL until <c>Program.cs</c> registers <c>AppDbContext</c> via
/// <c>AddDbContext&lt;AppDbContext&gt;(o =&gt; o.UseNpgsql(...).UseSnakeCaseNamingConvention())</c>
/// and the corresponding <c>using SiesaAgents.Infrastructure.Data;</c> is added.
/// </summary>
public class AppDbContextRegistrationTests : IClassFixture<TestExceptionAppFactory>
{
    private readonly TestExceptionAppFactory _factory;

    public AppDbContextRegistrationTests(TestExceptionAppFactory factory)
    {
        _factory = factory;
    }

    [Fact(DisplayName = "[P0] AC#5 — AppDbContext is registered in the DI container")]
    public void AppDbContext_IsResolvableFromDI()
    {
        // GIVEN the composed application host
        using var scope = _factory.Services.CreateScope();

        // WHEN resolving AppDbContext from the DI container
        var ctx = scope.ServiceProvider.GetService<AppDbContext>();

        // THEN the DbContext is resolvable — i.e. AddDbContext<AppDbContext>(...) was called in Program.cs
        Assert.NotNull(ctx);
    }

    [Fact(DisplayName = "[P0] AC#5 — AppDbContext is configured against Npgsql (PostgreSQL provider)")]
    public void AppDbContext_UsesNpgsqlProvider()
    {
        // GIVEN the composed application host
        using var scope = _factory.Services.CreateScope();

        // WHEN resolving AppDbContext and querying its provider
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var providerName = ctx.Database.ProviderName;

        // THEN Npgsql is the active EF Core provider
        Assert.NotNull(providerName);
        Assert.Contains("Npgsql", providerName!, StringComparison.Ordinal);
    }

    [Fact(DisplayName = "[P0] AC#5 — Connection string comes from ConnectionStrings:DefaultConnection")]
    public void AppDbContext_ConnectionString_ComesFromDefaultConnection()
    {
        // GIVEN Program.cs must read builder.Configuration.GetConnectionString("DefaultConnection")
        using var scope = _factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // WHEN inspecting the effective connection string
        var connString = ctx.Database.GetDbConnection().ConnectionString;

        // THEN it targets the configured database (siesa_agents_db) — sanity check that
        // configuration flowed from appsettings.Development.json into AddDbContext options
        Assert.False(string.IsNullOrWhiteSpace(connString));
        Assert.Contains("siesa_agents_db", connString, StringComparison.OrdinalIgnoreCase);
    }

    [Fact(DisplayName = "[P1] AC#5 — App still starts and /scalar responds (no Story 1.1 regression)")]
    public async Task ScalarEndpoint_StillReachableAfterDbContextRegistration()
    {
        // GIVEN the full application pipeline (with AppDbContext DI wiring added by Story 1.3)
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });

        // WHEN requesting /scalar (documented endpoint from Story 1.1)
        var response = await client.GetAsync("/scalar");

        // THEN Scalar still responds with 200 or a 3xx redirect to /scalar/
        Assert.True(
            (int)response.StatusCode == 200 ||
            ((int)response.StatusCode >= 300 && (int)response.StatusCode < 400),
            $"Expected 200 or 3xx from /scalar, got {(int)response.StatusCode}");
    }

    [Fact(DisplayName = "[P0] AC#3 — ExceptionHandlingMiddleware still returns RFC 7807 after Program.cs changes")]
    public async Task ExceptionHandlingMiddleware_Ordering_PreservedAfterDbContextWiring()
    {
        // GIVEN the app after Story 1.3 modifications
        var client = _factory.CreateClient();

        // WHEN a downstream endpoint throws
        var response = await client.GetAsync("/test-error");

        // THEN the middleware still intercepts (proves ordering preserved:
        //       UseMiddleware<ExceptionHandlingMiddleware> is BEFORE endpoint mapping)
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("SECRET-INTERNAL-DETAIL", body);
        Assert.DoesNotContain("stackTrace", body, StringComparison.OrdinalIgnoreCase);
    }
}
