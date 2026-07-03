using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// TC-E1-P0-05 — Unhandled exceptions must surface as RFC 7807 Problem Details
/// with no leakage of stack traces / raw exception messages.
///
/// This test EXTENDS the Story 1.1 pipeline (does NOT replace it): a test-only
/// endpoint <c>/api/v1/test-error</c> is appended via an
/// <see cref="IStartupFilter"/> so the existing
/// <c>ExceptionHandlingMiddleware</c> (Story 1.1) is exercised as-is.
///
/// Rationale for <c>IStartupFilter</c> instead of
/// <c>WithWebHostBuilder(b =&gt; b.Configure(...))</c>: the WebHost
/// <c>Configure</c> overload REPLACES the entire pipeline, which dodges the
/// very middleware we're asserting. <c>IStartupFilter</c> injects our probe
/// AFTER the production pipeline has been assembled, preserving Story 1.1's
/// middleware order (ExceptionHandling → StatusCodePages → CORS → OpenApi →
/// Scalar). See Story 1.3 Task 6 implementation note.
/// </summary>
public class ProblemDetailsMiddlewareTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ProblemDetailsMiddlewareTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.AddTransient<IStartupFilter, TestErrorEndpointStartupFilter>();
            });
        });
    }

    [Fact]
    public async Task Unhandled_exception_returns_problem_details_rfc7807()
    {
        // GIVEN: the API is running with the Story 1.1 exception-handling
        //        middleware AND a test-only endpoint that throws.
        var client = _factory.CreateClient();

        // WHEN: an HTTP client calls the throwing endpoint.
        var response = await client.GetAsync("/api/v1/test-error");

        // THEN: the response is 500 with application/problem+json content-type
        //       and NO leaked exception information.
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var body = await response.Content.ReadAsStringAsync();

        using var json = JsonDocument.Parse(body);
        Assert.True(
            json.RootElement.TryGetProperty("status", out _),
            "Problem Details body must contain a 'status' property (RFC 7807).");
        Assert.True(
            json.RootElement.TryGetProperty("title", out _),
            "Problem Details body must contain a 'title' property (RFC 7807).");
        Assert.True(
            json.RootElement.TryGetProperty("type", out _),
            "Problem Details body must contain a 'type' property (RFC 7807).");

        // Zero-tolerance: never leak internals.
        Assert.False(
            json.RootElement.TryGetProperty("stackTrace", out _),
            "Problem Details body must NOT contain a 'stackTrace' property.");
        Assert.False(
            json.RootElement.TryGetProperty("exception", out _),
            "Problem Details body must NOT contain an 'exception' property.");
        Assert.False(
            json.RootElement.TryGetProperty("innerException", out _),
            "Problem Details body must NOT contain an 'innerException' property.");
        Assert.DoesNotContain("boom", body, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Appends a test-only middleware to the END of the production pipeline
    /// (which means it sits INSIDE the try/catch of ExceptionHandlingMiddleware
    /// registered at the TOP of Program.cs). Requests for <c>/api/v1/test-error</c>
    /// throw here; every other request falls through to the real endpoints.
    /// </summary>
    private sealed class TestErrorEndpointStartupFilter : IStartupFilter
    {
        public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
        {
            return app =>
            {
                // Run production Configure FIRST — assembles ExceptionHandling → ... → Scalar.
                next(app);

                // Then append the throwing probe AT THE END. It runs inside
                // ExceptionHandlingMiddleware's try/catch scope.
                app.Use(async (ctx, del_next) =>
                {
                    if (ctx.Request.Path == "/api/v1/test-error")
                    {
                        throw new InvalidOperationException("boom");
                    }

                    await del_next();
                });
            };
        }
    }
}
