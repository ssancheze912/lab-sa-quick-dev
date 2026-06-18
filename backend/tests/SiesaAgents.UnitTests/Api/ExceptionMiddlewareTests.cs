/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Integration Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC2 — ExceptionHandlingMiddleware returns Problem Details RFC 7807 format
 *          with Content-Type: application/problem+json, fields: status, title, detail
 *          and WITHOUT stackTrace, exception, or innerException keys (NFR6)
 *
 * Test-Case References (test-design-epic-1.md):
 *   TC-E1-P0-05 — ExceptionHandlingMiddleware Returns Problem Details RFC 7807
 *
 * Uses: WebApplicationFactory<Program> for in-process integration testing.
 * No live PostgreSQL required — AppDbContext is overridden with InMemory provider.
 */

using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace SiesaAgents.UnitTests.Api;

/// <summary>
/// Custom WebApplicationFactory that overrides the database and registers a
/// test-only endpoint that throws an unhandled exception.
/// </summary>
public class ExceptionMiddlewareTestFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Replace any registered DbContext with a noop to avoid PostgreSQL dependency
            // We use the ServiceCollection extension to remove and re-add if present
            var dbContextDescriptor = services.FirstOrDefault(
                d => d.ServiceType.Name.Contains("DbContext") ||
                     d.ServiceType.Name.Contains("AppDbContext"));

            if (dbContextDescriptor is not null)
            {
                services.Remove(dbContextDescriptor);
            }
        });

        builder.Configure(app =>
        {
            // Register the test-only error endpoint BEFORE other middlewares
            // The ExceptionHandlingMiddleware must already be registered in Program.cs
            // This endpoint triggers an unhandled exception to verify the middleware behavior
            app.Map("/api/v1/test-error", errorApp =>
            {
                errorApp.Run(async _ =>
                {
                    throw new Exception("internal test — unhandled exception for ATDD");
                    // ReSharper disable once FunctionNeverReturns
                });
            });
        });
    }
}

public class ExceptionMiddlewareTests : IClassFixture<ExceptionMiddlewareTestFactory>
{
    private readonly HttpClient _client;

    public ExceptionMiddlewareTests(ExceptionMiddlewareTestFactory factory)
    {
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC2: Unhandled exception returns HTTP 500
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExceptionMiddleware_UnhandledException_Returns500StatusCode()
    {
        // GIVEN: A test endpoint that throws an unhandled Exception
        // WHEN: The endpoint is called via HTTP GET

        var response = await _client.GetAsync("/api/v1/test-error");

        // THEN: The response status code is 500 Internal Server Error
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC2: Content-Type must be application/problem+json (RFC 7807)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExceptionMiddleware_UnhandledException_ReturnsProblemJsonContentType()
    {
        // GIVEN: A test endpoint that throws an unhandled Exception
        // WHEN: The endpoint is called via HTTP GET

        var response = await _client.GetAsync("/api/v1/test-error");
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;

        // THEN: Content-Type is application/problem+json (RFC 7807 requirement)
        Assert.Contains("application/problem+json", contentType);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC2: Response body must contain "status" field (RFC 7807)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExceptionMiddleware_UnhandledException_ResponseBodyContainsStatusField()
    {
        // GIVEN: A test endpoint that throws an unhandled Exception
        // WHEN: The endpoint is called and the response body is read

        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

        // THEN: The response JSON contains a "status" field
        Assert.True(
            json.RootElement.TryGetProperty("status", out _),
            $"Expected 'status' field in Problem Details response. Actual body: {body}"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC2: Response body must contain "title" field (RFC 7807)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExceptionMiddleware_UnhandledException_ResponseBodyContainsTitleField()
    {
        // GIVEN: A test endpoint that throws an unhandled Exception
        // WHEN: The endpoint is called and the response body is read

        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

        // THEN: The response JSON contains a "title" field
        Assert.True(
            json.RootElement.TryGetProperty("title", out _),
            $"Expected 'title' field in Problem Details response. Actual body: {body}"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC2: Response body must contain "detail" field (RFC 7807)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExceptionMiddleware_UnhandledException_ResponseBodyContainsDetailField()
    {
        // GIVEN: A test endpoint that throws an unhandled Exception
        // WHEN: The endpoint is called and the response body is read

        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

        // THEN: The response JSON contains a "detail" field
        Assert.True(
            json.RootElement.TryGetProperty("detail", out _),
            $"Expected 'detail' field in Problem Details response. Actual body: {body}"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC2 + NFR6: Response body must NOT expose stackTrace (security requirement)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExceptionMiddleware_UnhandledException_ResponseBodyDoesNotContainStackTrace()
    {
        // GIVEN: A test endpoint that throws an unhandled Exception
        // WHEN: The endpoint is called and the response body is read

        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

        // THEN: The response JSON does NOT contain a "stackTrace" key (NFR6 — no stack traces exposed)
        Assert.False(
            json.RootElement.TryGetProperty("stackTrace", out _),
            $"'stackTrace' key MUST NOT be present in Problem Details response (NFR6 violation). Actual body: {body}"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC2 + NFR6: Response body must NOT expose "exception" key
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExceptionMiddleware_UnhandledException_ResponseBodyDoesNotContainExceptionKey()
    {
        // GIVEN: A test endpoint that throws an unhandled Exception
        // WHEN: The endpoint is called and the response body is read

        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

        // THEN: The response JSON does NOT contain an "exception" key (NFR6)
        Assert.False(
            json.RootElement.TryGetProperty("exception", out _),
            $"'exception' key MUST NOT be present in Problem Details response (NFR6 violation). Actual body: {body}"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC2 + NFR6: Response body must NOT expose "innerException" key
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExceptionMiddleware_UnhandledException_ResponseBodyDoesNotContainInnerExceptionKey()
    {
        // GIVEN: A test endpoint that throws an unhandled Exception
        // WHEN: The endpoint is called and the response body is read

        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

        // THEN: The response JSON does NOT contain an "innerException" key (NFR6)
        Assert.False(
            json.RootElement.TryGetProperty("innerException", out _),
            $"'innerException' key MUST NOT be present in Problem Details response (NFR6 violation). Actual body: {body}"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC2: status field value must equal 500
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExceptionMiddleware_UnhandledException_StatusFieldValueIs500()
    {
        // GIVEN: A test endpoint that throws an unhandled Exception
        // WHEN: The endpoint is called and the status field is read

        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

        json.RootElement.TryGetProperty("status", out var statusElement);

        // THEN: The "status" field value is 500
        Assert.Equal(500, statusElement.GetInt32());
    }
}
