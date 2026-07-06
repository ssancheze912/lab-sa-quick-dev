using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Boots the SiesaAgents.API host in the "Testing" hosting environment so guarded
/// test-only endpoints (e.g. GET /api/v1/test-error, see Program.cs) are mapped for
/// integration tests, while remaining absent in Development and Production.
/// </summary>
public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
    }
}
