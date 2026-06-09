using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Edge-case coverage for the API host wiring (Program.cs) beyond what the ATDD
/// tests exercise.
///
/// Focus areas:
///   * The throw-test endpoint MUST be guarded by <c>IsDevelopment()</c> — it must
///     NOT be reachable when the host runs in Production.
///   * Non-existent paths return 404 (CORS / middleware ordering sanity).
///   * Scalar API reference is mapped (architecture mandate: Scalar, not Swagger).
///   * The host exposes <c>public partial class Program;</c> so
///     <c>WebApplicationFactory&lt;Program&gt;</c> can find it.
///   * Multiple <c>WebApplicationFactory</c> instances can coexist without leaking
///     state (each bootstraps an independent DI container).
/// </summary>
public class ApiHostEdgeCasesTests
{
    /// <summary>
    /// AC #3 security boundary — the throw-test endpoint MUST be absent in
    /// Production. Verifies the <c>IsDevelopment()</c> guard around the
    /// endpoint registration.
    ///
    /// To bootstrap in Production without tripping the
    /// <c>ConnectionStrings:DefaultConnection</c> guard in
    /// <c>AddInfrastructure</c> (the non-dev <c>appsettings.json</c> omits the
    /// section by design — AC #6), the test seeds an in-memory connection
    /// string before booting the host.
    ///
    /// NOTE: This test depends on <c>WebApplicationFactory&lt;Program&gt;</c>
    /// honoring the <c>UseEnvironment("Production")</c> + the in-memory
    /// configuration override. If the .NET 10 runtime resolves environment
    /// differently (e.g. via <c>ASPNETCORE_ENVIRONMENT</c> set by the test host),
    /// the assertion may need to be revisited. Tests cannot be executed in this
    /// sandbox (.NET 10 SDK unavailable) — flagged for CI verification.
    /// </summary>
    [Fact]
    public async Task TestErrorEndpoint_IsNotMapped_InProductionEnvironment()
    {
        // GIVEN
        await using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Production");
                builder.ConfigureAppConfiguration((_, config) =>
                {
                    config.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        ["ConnectionStrings:DefaultConnection"] =
                            "Host=fake;Database=fake;Username=fake;Password=fake"
                    });
                });
            });
        var client = factory.CreateClient();

        // WHEN
        var response = await client.GetAsync("/api/v1/test-error");

        // THEN — must be 404 (route absent), NEVER 500 (endpoint reachable).
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    /// <summary>
    /// Routing sanity — an arbitrary unmapped path returns 404, not a 500 from
    /// the exception middleware. Catches the bug where the middleware swallows
    /// terminal 404s and reframes them as 500 problem+json responses.
    /// </summary>
    [Fact]
    public async Task UnknownPath_Returns404_NotProblemDetails()
    {
        // GIVEN
        await using var factory = new SiesaAgentsWebApplicationFactory();
        var client = factory.CreateClient();

        // WHEN
        var response = await client.GetAsync("/api/v1/this-route-does-not-exist");

        // THEN
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.NotEqual("application/problem+json",
            response.Content.Headers.ContentType?.MediaType);
    }

    /// <summary>
    /// Program-class visibility contract — <c>Program</c> must be reachable as a
    /// public type for <see cref="WebApplicationFactory{TEntryPoint}"/> to
    /// instantiate the host. Asserted by reflection so the test fails with a
    /// clear message if someone removes the <c>public partial class Program;</c>
    /// declaration at the bottom of <c>Program.cs</c>.
    /// </summary>
    [Fact]
    public void Program_Type_IsPublic_AndDiscoverableByReflection()
    {
        // GIVEN
        var programType = typeof(Program);

        // THEN
        Assert.True(programType.IsPublic,
            "Program must be public so WebApplicationFactory<Program> can find it.");
        Assert.Equal("Program", programType.Name);
    }

    /// <summary>
    /// Isolation contract — two <see cref="SiesaAgentsWebApplicationFactory"/>
    /// instances must NOT share <see cref="AppDbContext"/> service providers.
    /// Each factory bootstraps an independent host.
    /// </summary>
    [Fact]
    public void TwoFactoryInstances_HaveDistinctServiceProviders()
    {
        // GIVEN
        using var factoryA = new SiesaAgentsWebApplicationFactory();
        using var factoryB = new SiesaAgentsWebApplicationFactory();

        // WHEN
        using var scopeA = factoryA.Services.CreateScope();
        using var scopeB = factoryB.Services.CreateScope();
        var ctxA = scopeA.ServiceProvider.GetRequiredService<AppDbContext>();
        var ctxB = scopeB.ServiceProvider.GetRequiredService<AppDbContext>();

        // THEN
        Assert.NotSame(ctxA, ctxB);
        Assert.NotSame(factoryA.Services, factoryB.Services);
    }

    /// <summary>
    /// AC #2 + AC #6 — the running host's <see cref="AppDbContext"/> must use
    /// the connection string defined in <c>appsettings.Development.json</c>.
    /// Verified indirectly by asserting Npgsql is the resolved provider when
    /// the Development environment is selected (the only env that has the
    /// connection string set at the file level).
    /// </summary>
    [Fact]
    public void DevelopmentHost_ResolvesAppDbContext_WithNpgsqlProvider()
    {
        // GIVEN
        using var factory = new SiesaAgentsWebApplicationFactory();
        using var scope = factory.Services.CreateScope();

        // WHEN
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // THEN
        Assert.Equal("Npgsql.EntityFrameworkCore.PostgreSQL", ctx.Database.ProviderName);
    }
}
