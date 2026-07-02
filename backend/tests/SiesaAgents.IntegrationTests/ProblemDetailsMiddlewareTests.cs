// -----------------------------------------------------------------------------
//  Story 1.3 — Backend Database Foundation
//  RED-phase ATDD integration test for AC #3 / NFR6 / TC-E1-P0-05 / R3.
//
//  Verifies the ExceptionHandlingMiddleware returns an RFC 7807 Problem Details
//  payload for unhandled 500 exceptions AND does NOT leak stack traces, inner
//  exception messages, or the raw exception message ("integration-test-error").
//
//  Expected RED-phase failure reasons (before DEV team implements Story 1.3):
//    1. Task 4 not done: `public partial class Program;` sentinel missing →
//       CS0246 "The type or namespace name 'Program' could not be found".
//    2. Task 5 not done: /api/v1/test-error endpoint not mapped in Program.cs →
//       GET returns 404 with framework Problem Details, not 500 with our body.
//    3. Task 6 not done: ExceptionHandlingMiddleware still lacks the Detail
//       field, so `root.GetProperty("detail")` throws KeyNotFoundException.
//    4. Title still English ("An unexpected error occurred.") — AC #8 requires
//       Spanish ("Ocurrió un error inesperado.").
//  Every failure above corresponds to a missing acceptance-criterion behavior.
// -----------------------------------------------------------------------------
using System.Net;
using System.Text.Json;

namespace SiesaAgents.IntegrationTests;

[Trait("Category", "Integration")]
public class ProblemDetailsMiddlewareTests : IClassFixture<TestingEnvWebApplicationFactory>
{
    private readonly TestingEnvWebApplicationFactory _factory;

    public ProblemDetailsMiddlewareTests(TestingEnvWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GivenUnhandledException_WhenGetTestError_ThenReturns500WithProblemDetailsAndNoStackTraceLeakage()
    {
        // GIVEN: an application running in the "Testing" environment where
        //        GET /api/v1/test-error is wired to throw
        //        `new InvalidOperationException("integration-test-error")`.
        var client = _factory.CreateClient();

        // WHEN: the endpoint is invoked and the exception bubbles up through
        //       ExceptionHandlingMiddleware.
        var response = await client.GetAsync("/api/v1/test-error");

        // THEN: HTTP 500 with `application/problem+json` and an RFC 7807 body
        //       that contains ONLY the allow-listed fields.
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // AC #3 — RFC 7807 fields present with the mandated Spanish values (AC #8)
        Assert.Equal(500, root.GetProperty("status").GetInt32());
        Assert.Equal("Ocurrió un error inesperado.", root.GetProperty("title").GetString());
        Assert.Equal(
            "Contacta al administrador si el problema persiste.",
            root.GetProperty("detail").GetString());
        Assert.True(root.TryGetProperty("type", out _), "type MUST be present per RFC 7807");
        Assert.True(root.TryGetProperty("instance", out _), "instance MUST be present per RFC 7807");

        // NFR6 — no server-internal fields leaked to the client
        Assert.False(root.TryGetProperty("stackTrace", out _), "stackTrace MUST NOT be exposed");
        Assert.False(root.TryGetProperty("stack_trace", out _), "stack_trace MUST NOT be exposed");
        Assert.False(root.TryGetProperty("exception", out _), "exception MUST NOT be exposed");
        Assert.False(root.TryGetProperty("innerException", out _), "innerException MUST NOT be exposed");

        // AC #3 — the raw exception message must not appear anywhere in the body
        Assert.DoesNotContain("integration-test-error", body);
    }

    [Fact]
    public async Task GivenTestingEnvironment_WhenGetTestErrorEndpointExists_ThenItIsInvokable()
    {
        // GIVEN: the "Testing" environment is active (unlocks the endpoint)
        var client = _factory.CreateClient();

        // WHEN: hitting the diagnostic endpoint
        var response = await client.GetAsync("/api/v1/test-error");

        // THEN: it MUST hit the middleware path (500), NOT return 404.
        //       A 404 means Task 5 (endpoint registration) wasn't done.
        Assert.NotEqual(HttpStatusCode.NotFound, response.StatusCode);
    }
}
