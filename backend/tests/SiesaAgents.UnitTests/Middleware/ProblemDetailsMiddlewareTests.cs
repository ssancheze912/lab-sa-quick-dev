using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// Story 1.3 — AC #3, #4, #8 (RED phase).
///
/// Verifies the global <c>ExceptionHandlingMiddleware</c> (registered in
/// Program.cs from Story 1.1) returns a Problem Details (RFC 7807) response
/// on unhandled exceptions AND never leaks stack traces, exception type
/// names, or the raw exception message (NFR6).
///
/// The trigger is a Story-1.3-added minimal endpoint <c>GET /_test/throw</c>
/// that is registered ONLY when <c>ASPNETCORE_ENVIRONMENT == "Testing"</c>.
/// It must NOT be present in Development or Production.
///
/// SANDBOX NOTE: this test does not open a database connection.
/// </summary>
public sealed class ProblemDetailsMiddlewareTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _baseFactory;

    public ProblemDetailsMiddlewareTests(WebApplicationFactory<Program> factory)
    {
        _baseFactory = factory;
    }

    private WebApplicationFactory<Program> TestingFactory() =>
        _baseFactory.WithWebHostBuilder(b => b.UseEnvironment("Testing"));

    // ─────────────────────────────────────────────────────────────────────
    // AC #3, #4 — unhandled exception → RFC 7807 body with no leaked details
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UnhandledException_Returns_ProblemDetails_WithoutStackTrace()
    {
        // GIVEN: The application runs under the "Testing" environment so the
        //        /_test/throw endpoint is available.
        var client = TestingFactory().CreateClient();

        // WHEN: A request hits an endpoint that throws
        //       new InvalidOperationException("secret sauce").
        var response = await client.GetAsync("/_test/throw");

        // THEN #1: Status code is 500.
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);

        // THEN #2: The body deserializes to a valid ProblemDetails.
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(500, problem!.Status);
        Assert.Equal("An unexpected error occurred.", problem.Title);

        // THEN #3: Zero information leakage. NFR6 forbids stack traces,
        //         exception type names, or raw exception messages in the body.
        var body = await response.Content.ReadAsStringAsync();

        Assert.True(
            body.IndexOf("secret sauce", StringComparison.OrdinalIgnoreCase) < 0,
            "Response body must not contain the raw exception message 'secret sauce'.");
        Assert.True(
            body.IndexOf("InvalidOperationException", StringComparison.OrdinalIgnoreCase) < 0,
            "Response body must not contain the .NET exception type name.");
        Assert.True(
            body.IndexOf("stackTrace", StringComparison.OrdinalIgnoreCase) < 0,
            "Response body must not contain a stackTrace field.");
        Assert.True(
            body.IndexOf("innerException", StringComparison.OrdinalIgnoreCase) < 0,
            "Response body must not contain an innerException field.");
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC #3 — Content-Type is application/problem+json
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ProblemDetails_ContentType_Is_ApplicationProblemJson()
    {
        // GIVEN
        var client = TestingFactory().CreateClient();

        // WHEN
        var response = await client.GetAsync("/_test/throw");

        // THEN: media type is strictly application/problem+json (RFC 7807).
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC #4 (defence in depth) — endpoint is gated to the Testing environment
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task TestThrowEndpoint_IsNotExposed_InDevelopmentEnvironment()
    {
        // GIVEN: Default WebApplicationFactory boots with Development.
        var client = _baseFactory.CreateClient();

        // WHEN
        var response = await client.GetAsync("/_test/throw");

        // THEN: The endpoint must NOT be registered outside Testing. A 404
        // (handled by the Problem Details status-code-pages pipeline from
        // Story 1.1) is the expected outcome — never a 500 (would mean the
        // endpoint was reachable) and never a 200.
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
