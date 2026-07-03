using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// TC-E1-P0-05 — Unhandled exceptions must surface as RFC 7807 Problem Details
/// with no leakage of stack traces / raw exception messages.
///
/// This test EXTENDS the Story 1.1 pipeline (does NOT replace it): a test-only
/// endpoint `/api/v1/test-error` is appended by `WithWebHostBuilder` so the
/// existing `ExceptionHandlingMiddleware` (Story 1.1) is exercised as-is.
///
/// RED-phase expectation for Story 1.3:
///   Fails to compile until `public partial class Program {}` is appended to
///   `SiesaAgents.API/Program.cs` (Task 6 of Story 1.3). Once compilable, the
///   assertions themselves already pass against the Story 1.1 middleware — the
///   test's job here is to LOCK the RFC 7807 contract so future DI changes
///   cannot regress it.
/// </summary>
public class ProblemDetailsMiddlewareTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ProblemDetailsMiddlewareTests(WebApplicationFactory<Program> factory)
    {
        // Extend the existing pipeline — do NOT replace it. Registering the
        // test endpoint via `Configure` on the SAME builder keeps Story 1.1's
        // middleware order intact (ExceptionHandling → StatusCodePages →
        // CORS → OpenApi → Scalar), which is what TC-E1-P0-05 asserts.
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.Use(async (ctx, next) =>
                {
                    if (ctx.Request.Path == "/api/v1/test-error")
                    {
                        throw new InvalidOperationException("boom");
                    }

                    await next();
                });
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
}
