using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Test-host factory for Story 1.3 acceptance tests.
///
/// Boots SiesaAgents.API in the Development environment so:
///   * The /api/v1/test-error endpoint is mapped (AC #3).
///   * appsettings.Development.json is loaded (provides ConnectionStrings:DefaultConnection — AC #6).
///
/// REQUIRES (RED phase):
///   * Program.cs must expose `public partial class Program;` so WebApplicationFactory&lt;Program&gt; can find it.
///   * AddInfrastructure(...) must register AppDbContext in DI.
/// </summary>
public class SiesaAgentsWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
    }
}
