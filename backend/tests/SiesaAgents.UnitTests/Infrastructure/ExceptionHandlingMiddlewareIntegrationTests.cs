using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// ATDD integration tests for Story 1.3: Backend Database Foundation
/// Tests TC-E1-P0-05 (P0) — ExceptionHandlingMiddleware returns Problem Details RFC 7807
/// via full WebApplicationFactory HTTP pipeline.
///
/// These tests are in RED phase — they fail until:
/// 1. A test endpoint GET /api/v1/test-error is registered (or a minimal override wires one)
/// 2. ExceptionHandlingMiddleware is registered BEFORE endpoint mapping in Program.cs
///
/// Covered acceptance criteria:
/// AC2 — Problem Details RFC 7807 format returned (status, title, detail) with no stack traces (NFR6)
/// </summary>
public class ExceptionHandlingMiddlewareIntegrationTests
    : IClassFixture<ThrowingEndpointApplicationFactory>
{
    private readonly HttpClient _client;

    public ExceptionHandlingMiddlewareIntegrationTests(ThrowingEndpointApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E1-P0-05: Problem Details RFC 7807 on unhandled exception
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E1-P0-05 (P0)
    /// GIVEN an unhandled exception occurs in the backend
    /// WHEN the error reaches ExceptionHandlingMiddleware
    /// THEN HTTP 500 is returned
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenExceptionThrown_Returns500()
    {
        // GIVEN: A test endpoint that intentionally throws
        // WHEN: The endpoint is called
        var response = await _client.GetAsync("/api/v1/test-error");

        // THEN: HTTP 500
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    /// <summary>
    /// TC-E1-P0-05 (P0)
    /// GIVEN an unhandled exception occurs in the backend
    /// WHEN the error reaches ExceptionHandlingMiddleware
    /// THEN Content-Type is application/problem+json
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenExceptionThrown_ContentTypeIsProblemJson()
    {
        // GIVEN: A test endpoint that intentionally throws
        // WHEN: The endpoint is called
        var response = await _client.GetAsync("/api/v1/test-error");

        // THEN: Content-Type is application/problem+json (RFC 7807)
        var contentType = response.Content.Headers.ContentType?.MediaType;
        Assert.Equal("application/problem+json", contentType,
            "Content-Type must be 'application/problem+json' per RFC 7807");
    }

    /// <summary>
    /// TC-E1-P0-05 (P0)
    /// GIVEN an unhandled exception occurs in the backend
    /// WHEN the error reaches ExceptionHandlingMiddleware
    /// THEN response JSON contains 'status' field with value 500
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenExceptionThrown_ResponseContainsStatusField()
    {
        // GIVEN: A test endpoint that intentionally throws
        // WHEN: The endpoint is called
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);

        // THEN: JSON contains 'status' field with value 500
        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            "Response body must contain 'status' field per RFC 7807");
        Assert.Equal(500, statusProp.GetInt32());
    }

    /// <summary>
    /// TC-E1-P0-05 (P0)
    /// GIVEN an unhandled exception occurs in the backend
    /// WHEN the error reaches ExceptionHandlingMiddleware
    /// THEN response JSON contains non-empty 'title' field
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenExceptionThrown_ResponseContainsTitleField()
    {
        // GIVEN: A test endpoint that intentionally throws
        // WHEN: The endpoint is called
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);

        // THEN: JSON contains non-empty 'title' field per RFC 7807
        Assert.True(doc.RootElement.TryGetProperty("title", out var titleProp),
            "Response body must contain 'title' field per RFC 7807");
        Assert.Equal(JsonValueKind.String, titleProp.ValueKind);
        Assert.NotEmpty(titleProp.GetString()!);
    }

    /// <summary>
    /// TC-E1-P0-05 (P0)
    /// GIVEN an unhandled exception occurs in the backend
    /// WHEN the error reaches ExceptionHandlingMiddleware
    /// THEN response JSON contains 'detail' field (may be null — must not expose stack trace)
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenExceptionThrown_ResponseContainsDetailField()
    {
        // GIVEN: A test endpoint that intentionally throws
        // WHEN: The endpoint is called
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);

        // THEN: JSON contains 'detail' field (null is acceptable — internal error must not be exposed)
        Assert.True(doc.RootElement.TryGetProperty("detail", out var detailProp),
            "Response body must contain 'detail' field per RFC 7807 (null value is acceptable)");

        // Detail must be null — never expose internal error messages
        if (detailProp.ValueKind != JsonValueKind.Null)
        {
            var detailValue = detailProp.GetString();
            Assert.Null(detailValue);
        }
    }

    /// <summary>
    /// TC-E1-P0-05 (P0) — NFR6: No stack traces exposed
    /// GIVEN an unhandled exception occurs in the backend
    /// WHEN the error reaches ExceptionHandlingMiddleware
    /// THEN response body does NOT contain stackTrace, exception, or innerException keys
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenExceptionThrown_NoStackTraceExposed()
    {
        // GIVEN: A test endpoint that intentionally throws with a recognizable message
        // WHEN: The endpoint is called
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: No stack trace fields are present in the response (NFR6)
        Assert.DoesNotContain("stackTrace", body,
            "'stackTrace' must NOT appear in error response (NFR6)");
        Assert.DoesNotContain("StackTrace", body,
            "'StackTrace' must NOT appear in error response (NFR6)");
        Assert.DoesNotContain("\"exception\"", body,
            "'exception' field must NOT appear in error response (NFR6)");
        Assert.DoesNotContain("innerException", body,
            "'innerException' must NOT appear in error response (NFR6)");
        Assert.DoesNotContain("InnerException", body,
            "'InnerException' must NOT appear in error response (NFR6)");

        // AND: The exception message itself must not be exposed
        Assert.DoesNotContain("internal test error", body,
            "Raw exception message must NOT be exposed in error response (NFR6)");
    }

    /// <summary>
    /// TC-E1-P0-05 (P0) — Middleware ordering check
    /// GIVEN ExceptionHandlingMiddleware is registered BEFORE endpoint mapping
    /// WHEN the error endpoint is called
    /// THEN the middleware actually catches the exception (middleware ordering is correct)
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenRegisteredBeforeEndpoints_CatchesException()
    {
        // GIVEN: Full HTTP pipeline where middleware order matters
        // WHEN: Error endpoint is called (middleware must intercept before response completes)
        var response = await _client.GetAsync("/api/v1/test-error");

        // THEN: Response is controlled by the middleware (not an unhandled 500 crash)
        // If middleware was NOT registered before endpoints, the response body would be empty
        // or contain the raw ASP.NET error page — not the structured Problem Details JSON
        var body = await response.Content.ReadAsStringAsync();

        Assert.NotEmpty(body);
        Assert.True(body.Contains("status") || body.Contains("title"),
            "Middleware must have caught the exception and produced a structured response. " +
            "Ensure app.UseMiddleware<ExceptionHandlingMiddleware>() is called BEFORE app.MapScalarApiReference() and other app.Map* calls.");
    }
}

/// <summary>
/// Custom WebApplicationFactory that adds a test endpoint GET /api/v1/test-error
/// which intentionally throws an exception to test ExceptionHandlingMiddleware.
///
/// This factory injects a minimal endpoint without modifying the production Program.cs,
/// satisfying TC-E1-P0-05 requirements for ATDD testing.
/// </summary>
public class ThrowingEndpointApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.Configure(app =>
        {
            // Re-use the existing app configuration and add test-only endpoint
            // The test endpoint throws an exception to exercise ExceptionHandlingMiddleware
            app.Use(async (context, next) =>
            {
                if (context.Request.Path == "/api/v1/test-error" && context.Request.Method == "GET")
                {
                    throw new Exception("internal test error");
                }

                await next(context);
            });
        });
    }
}
