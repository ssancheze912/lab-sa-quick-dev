using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using SiesaAgents.IntegrationTests.Fixtures;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// ATDD - RED phase tests for Story 1.3 (Backend Database Foundation).
///
/// Covers:
///   AC #4 — ExceptionHandlingMiddleware emits RFC 7807 Problem Details and
///           leaks NO stack trace / exception message / inner exception.
///   AC #7 — Integration test
///           <c>ExceptionMiddleware_OnUnhandledException_ReturnsProblemDetailsRfc7807</c>
///           passes (TC-E1-P0-05).
///   NFR6  — No raw .NET exception text in the response body.
///
/// These tests are expected to FAIL until:
///   1. The integration test project is wired into the solution.
///   2. Program.cs registers a test-only <c>GET /__test/throw</c> endpoint
///      under <c>ASPNETCORE_ENVIRONMENT=Testing</c>.
///   3. The middleware is confirmed to never serialize <c>Detail</c>,
///      <c>Exception.Message</c>, <c>StackTrace</c>, or <c>InnerException</c>.
/// </summary>
public class ExceptionMiddlewareTests : IClassFixture<SiesaAgentsApiFactory>
{
    private readonly SiesaAgentsApiFactory _factory;

    public ExceptionMiddlewareTests(SiesaAgentsApiFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// TC-E1-P0-05 — Problem Details middleware emits RFC 7807 and never leaks
    /// stack traces. Mapped from AC #4 and AC #7 of Story 1.3.
    ///
    /// GIVEN the API is running with ExceptionHandlingMiddleware registered as
    ///       the FIRST middleware in the pipeline.
    /// WHEN  a request hits an endpoint that throws an unhandled exception.
    /// THEN  the response has status 500, content-type application/problem+json,
    ///       a body conforming to RFC 7807 (status/title/type/instance keys),
    ///       and the body contains NONE of: stackTrace, exception, innerException,
    ///       "Message", raw .NET exception text.
    /// </summary>
    [Fact]
    public async Task ExceptionMiddleware_OnUnhandledException_ReturnsProblemDetailsRfc7807()
    {
        // GIVEN: API is bootstrapped in Testing environment with the throw endpoint.
        using var client = _factory.CreateClient();

        // WHEN: We hit the test-only endpoint that throws.
        var response = await client.GetAsync("/__test/throw");

        // THEN: status 500 + application/problem+json + RFC 7807 keys present.
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.NotNull(response.Content.Headers.ContentType);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType!.MediaType);

        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // RFC 7807 required-ish keys per architecture standard.
        Assert.True(root.TryGetProperty("status", out var statusProp), "RFC 7807 'status' missing");
        Assert.Equal(500, statusProp.GetInt32());
        Assert.True(root.TryGetProperty("title", out _), "RFC 7807 'title' missing");
        Assert.True(root.TryGetProperty("type", out _), "RFC 7807 'type' missing");
        Assert.True(root.TryGetProperty("instance", out _), "RFC 7807 'instance' missing");
    }

    /// <summary>
    /// THEN-only companion assertion (atomic): the response body MUST NOT leak
    /// the raw exception payload. Mapped to NFR6.
    ///
    /// GIVEN the API throws "InvalidOperationException('forced')" via the
    ///       test-only endpoint.
    /// WHEN  the response body is inspected.
    /// THEN  no stackTrace / exception / innerException / "forced" message
    ///       leaks to the client.
    /// </summary>
    [Fact]
    public async Task ExceptionMiddleware_OnUnhandledException_DoesNotLeakStackTraceOrExceptionMessage()
    {
        // GIVEN
        using var client = _factory.CreateClient();

        // WHEN
        var response = await client.GetAsync("/__test/throw");
        var body = await response.Content.ReadAsStringAsync();

        // THEN
        var forbiddenSubstrings = new[]
        {
            "stackTrace",
            "StackTrace",
            "exception",
            "Exception",
            "innerException",
            "InnerException",
            "forced",                // the raw exception message
            "InvalidOperationException",
            "at SiesaAgents",        // any .NET stack frame
        };

        foreach (var forbidden in forbiddenSubstrings)
        {
            Assert.DoesNotContain(forbidden, body);
        }
    }
}
