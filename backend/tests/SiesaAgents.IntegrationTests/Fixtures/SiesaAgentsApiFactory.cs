using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Hosting;

namespace SiesaAgents.IntegrationTests.Fixtures;

/// <summary>
/// WebApplicationFactory used by ATDD integration tests. Bootstraps the API in
/// the "Testing" environment.
///
/// In the "Testing" environment, Program.cs is expected (per Story 1.3 Task 7)
/// to expose a test-only endpoint <c>GET /__test/throw</c> that throws
/// <c>InvalidOperationException("forced")</c> so the ExceptionHandlingMiddleware
/// can be exercised end-to-end via WebApplicationFactory.
///
/// AUTO-CLEANUP: <see cref="WebApplicationFactory{TEntryPoint}"/> disposes the
/// host (and any DI-resolved services) automatically per test class instance.
/// </summary>
public class SiesaAgentsApiFactory : WebApplicationFactory<Program>
{
    protected override IHost CreateHost(IHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        return base.CreateHost(builder);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Bind to an ephemeral port to avoid colliding with a developer-run API.
        builder.UseSetting("urls", "http://127.0.0.1:0");

        // Provide a Testing-environment connection string so AddDbContext does
        // not throw at composition-root time. Tests that exercise actual SQL
        // against PostgreSQL set this connection string via environment
        // override or skip when PG is unreachable.
        builder.UseSetting(
            "ConnectionStrings:DefaultConnection",
            "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres");

        // The CORS fail-fast branch in Program.cs requires AllowedOrigins to be
        // set outside Development. Provide a value for the Testing environment.
        builder.UseSetting("AllowedOrigins:0", "http://localhost:5173");
    }
}
