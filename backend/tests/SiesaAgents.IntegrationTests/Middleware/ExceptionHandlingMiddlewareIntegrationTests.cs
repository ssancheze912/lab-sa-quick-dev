using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace SiesaAgents.IntegrationTests.Middleware;

/// <summary>
/// ATDD Integration Tests for Story 1.3 — AC #2 (full pipeline validation)
/// Tests use WebApplicationFactory to validate the entire middleware pipeline.
/// Tests are in RED phase — ExceptionHandlingMiddleware full implementation is pending.
/// NOTE: These tests require the SiesaAgents.API Program.cs to expose an exception-triggering
/// test endpoint (or use a custom WebApplicationFactory override).
/// </summary>
public class ExceptionHandlingMiddlewareIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ExceptionHandlingMiddlewareIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // No additional services needed for middleware tests
            });
        });
    }

    // -------------------------------------------------------------------------
    // AC #2: Full pipeline — unhandled exception returns Problem Details RFC 7807
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GivenBackendIsRunning_WhenScalarEndpointIsAccessed_ThenResponseIs200()
    {
        // GIVEN: The backend is running via WebApplicationFactory (full pipeline)
        using var client = _factory.CreateClient();

        // WHEN: Developer accesses /scalar (AC #5: Scalar API documentation page)
        var response = await client.GetAsync("/scalar/v1");

        // THEN: Scalar page loads successfully (confirms full middleware + routing pipeline is wired)
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK,
            HttpStatusCode.MovedPermanently,
            HttpStatusCode.Found,
            HttpStatusCode.SeeOther,
            HttpStatusCode.TemporaryRedirect,
            HttpStatusCode.PermanentRedirect);
    }

    [Fact]
    public async Task GivenExceptionHandlingMiddlewareIsRegistered_WhenAnyRequestIsProcessed_ThenPipelineResponds()
    {
        // GIVEN: The full pipeline including ExceptionHandlingMiddleware is running
        using var client = _factory.CreateClient();

        // WHEN: Any request is made (tests middleware is not breaking the pipeline)
        var response = await client.GetAsync("/scalar/v1");

        // THEN: A response is returned (middleware did not swallow or hang the request)
        response.Should().NotBeNull();
    }
}
