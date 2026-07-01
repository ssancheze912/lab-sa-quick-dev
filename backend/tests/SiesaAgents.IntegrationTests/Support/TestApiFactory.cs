using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace SiesaAgents.IntegrationTests.Support;

/// <summary>
/// Custom WebApplicationFactory used by every integration test in this project.
/// Injects a test-only endpoint (GET /api/v1/test-error) that intentionally throws,
/// so ExceptionHandlingMiddleware behavior can be verified (TC-E1-P0-05) without adding
/// test-only routes to production Program.cs. The real app pipeline (middleware,
/// DbContext registration, CORS, etc.) from Program.cs runs unmodified.
/// </summary>
public class TestApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("environment", "Development");

        builder.ConfigureServices(services =>
        {
            services.AddSingleton<IStartupFilter, TestErrorEndpointStartupFilter>();
        });
    }

    private sealed class TestErrorEndpointStartupFilter : IStartupFilter
    {
        public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next) =>
            app =>
            {
                app.UseEndpoints(endpoints =>
                {
                    endpoints.MapGet("/api/v1/test-error", () =>
                    {
                        throw new InvalidOperationException("internal test");
                    });
                });

                next(app);
            };
    }
}
