/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE — Unit/Integration Edge Cases for ExceptionHandlingMiddleware
 * Expands ATDD coverage for ExceptionHandlingMiddleware beyond the happy-path
 * tests in ExceptionMiddlewareTests.cs.
 *
 * Coverage added (not in ATDD ExceptionMiddlewareTests.cs):
 *   EC-MID-1  — Response body is valid JSON (parseable, not truncated)
 *   EC-MID-2  — Response body does NOT contain "exceptionType" key (NFR6)
 *   EC-MID-3  — status field value is numeric (integer), not a string
 *   EC-MID-4  — title field is a non-empty string
 *   EC-MID-5  — detail field is a non-empty string and does NOT echo ex.Message
 *   EC-MID-6  — Multiple sequential error requests are all handled correctly (idempotency)
 *   EC-MID-7  — 404 path (routing miss) also returns application/problem+json
 *   EC-MID-8  — 404 path body contains "status" field (middleware handles routing 404s)
 *   EC-MID-9  — Problem Details body contains NO additional debug fields beyond RFC 7807 required set
 *   EC-MID-10 — Content-Type header includes charset (UTF-8) or is exact application/problem+json
 */

using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Api;

/// <summary>
/// Reuses ExceptionMiddlewareTestFactory from ExceptionMiddlewareTests.cs for edge case tests.
/// </summary>
public class ExceptionMiddlewareEdgeCaseTests : IClassFixture<ExceptionMiddlewareTestFactory>
{
    private readonly HttpClient _client;

    public ExceptionMiddlewareEdgeCaseTests(ExceptionMiddlewareTestFactory factory)
    {
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-MID-1: Response body is valid, parseable JSON
    // Edge case: Ensures no partial write or encoding corruption in error path
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExceptionMiddleware_ErrorResponse_BodyIsValidJson()
    {
        // GIVEN: An error endpoint that throws an unhandled exception
        // WHEN: The endpoint is called
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: The response body is valid JSON (no truncation or encoding errors)
        var exception = Record.Exception(() => JsonDocument.Parse(body));
        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-MID-2: Response body does NOT expose "exceptionType" key
    // Edge case: NFR6 — additional debug leak vector beyond the ones in ATDD tests
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExceptionMiddleware_ErrorResponse_DoesNotContainExceptionTypeKey()
    {
        // GIVEN: An unhandled exception scenario
        // WHEN: The test-error endpoint is triggered
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

        // THEN: "exceptionType" key is absent (NFR6 compliance)
        Assert.False(
            json.RootElement.TryGetProperty("exceptionType", out _),
            $"'exceptionType' MUST NOT be present in Problem Details response. Actual body: {body}"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-MID-3: status field is a numeric integer, not a string
    // Edge case: RFC 7807 requires status to be an integer member
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExceptionMiddleware_ErrorResponse_StatusFieldIsInteger()
    {
        // GIVEN: An unhandled exception scenario
        // WHEN: The test-error endpoint is triggered
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

        // THEN: The "status" field is of JSON kind Number (not a String)
        Assert.True(
            json.RootElement.TryGetProperty("status", out var statusElement),
            $"Expected 'status' field to exist. Body: {body}"
        );
        Assert.Equal(JsonValueKind.Number, statusElement.ValueKind);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-MID-4: title field is a non-empty string
    // Edge case: Middleware must set a non-null, non-empty title per RFC 7807
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExceptionMiddleware_ErrorResponse_TitleFieldIsNonEmptyString()
    {
        // GIVEN: An unhandled exception scenario
        // WHEN: The test-error endpoint is triggered
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

        // THEN: "title" exists, is a string kind, and is not empty
        Assert.True(
            json.RootElement.TryGetProperty("title", out var titleElement),
            $"Expected 'title' field. Body: {body}"
        );
        Assert.Equal(JsonValueKind.String, titleElement.ValueKind);
        Assert.NotEmpty(titleElement.GetString() ?? string.Empty);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-MID-5: detail field does NOT echo the raw exception message
    // Edge case: NFR6 — ex.Message must not appear verbatim in the response
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExceptionMiddleware_ErrorResponse_DetailDoesNotContainRawExceptionMessage()
    {
        // GIVEN: The test-error endpoint throws new Exception("internal test — unhandled exception for ATDD")
        // WHEN: That endpoint is triggered
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

        // THEN: The "detail" field does NOT contain the raw exception message text
        if (json.RootElement.TryGetProperty("detail", out var detailElement))
        {
            var detail = detailElement.GetString() ?? string.Empty;

            // Raw exception message from TestErrorEndpointStartupFilter must not appear
            Assert.DoesNotContain("internal test", detail, StringComparison.OrdinalIgnoreCase);
            // Stack traces from .NET must not appear
            Assert.DoesNotMatch(@"at SiesaAgents\.", detail);
        }
        // If detail field is absent, this is also acceptable (RFC 7807 — detail is optional)
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-MID-6: Multiple sequential error requests are all handled correctly
    // Edge case: Idempotency — middleware does not accumulate state between requests
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExceptionMiddleware_MultipleSequentialErrorRequests_AllReturn500()
    {
        // GIVEN: An error endpoint
        // WHEN: The same endpoint is called 3 times in sequence
        for (int i = 0; i < 3; i++)
        {
            var response = await _client.GetAsync("/api/v1/test-error");

            // THEN: Each request returns HTTP 500 (no state contamination between requests)
            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);

            var body = await response.Content.ReadAsStringAsync();
            var json = JsonDocument.Parse(body);
            Assert.True(json.RootElement.TryGetProperty("status", out _));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-MID-7: 404 routing miss also returns application/problem+json
    // Edge case: Middleware handles both exception path AND routing 404 path
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExceptionMiddleware_RoutingMiss_Returns404WithProblemJsonContentType()
    {
        // GIVEN: A request to an endpoint that does not exist (no throw — routing 404)
        // WHEN: The request is made
        var response = await _client.GetAsync("/api/v1/does-not-exist-edge-case-1-3");
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;

        // THEN: HTTP 404 is returned
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // AND: Content-Type is application/problem+json (middleware intercepts 404s)
        Assert.Contains("application/problem+json", contentType);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-MID-8: 404 path body contains "status" field set to 404
    // Edge case: Routing 404 must produce a well-formed Problem Details body
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExceptionMiddleware_RoutingMiss_ResponseBodyContainsStatus404()
    {
        // GIVEN: A request to a non-existent endpoint
        // WHEN: The request is made
        var response = await _client.GetAsync("/api/v1/does-not-exist-edge-case-status");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

        // THEN: The "status" field equals 404
        Assert.True(
            json.RootElement.TryGetProperty("status", out var statusElement),
            $"Expected 'status' field for 404 response. Body: {body}"
        );
        Assert.Equal(404, statusElement.GetInt32());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-MID-9: Problem Details body contains ONLY the expected RFC 7807 fields
    // Edge case: No accidental debug fields (traceId from .NET diagnostics, requestId, etc.)
    // NOTE: RFC 7807 allows extension members; this test checks against sensitive debug keys only
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExceptionMiddleware_ErrorResponse_DoesNotContainSensitiveDebugKeys()
    {
        // GIVEN: An unhandled exception scenario
        // WHEN: The test-error endpoint is triggered
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

        // THEN: None of the forbidden sensitive debug keys are present
        var forbiddenKeys = new[]
        {
            "stackTrace", "exception", "innerException", "exceptionType",
            "exceptionMessage", "source", "targetSite", "hResult",
            "innerExceptions"
        };

        foreach (var key in forbiddenKeys)
        {
            Assert.False(
                json.RootElement.TryGetProperty(key, out _),
                $"Forbidden key '{key}' found in Problem Details response. Body: {body}"
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EC-MID-10: Content-Type does not contain "text/html"
    // Edge case: Ensures the middleware truly overrides any default ASP.NET HTML error pages
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExceptionMiddleware_ErrorResponse_ContentTypeIsNotHtml()
    {
        // GIVEN: An unhandled exception scenario
        // WHEN: The test-error endpoint is triggered
        var response = await _client.GetAsync("/api/v1/test-error");
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;

        // THEN: Content-Type is NOT text/html (middleware must not fall through to HTML error page)
        Assert.DoesNotContain("text/html", contentType, StringComparison.OrdinalIgnoreCase);
    }
}
