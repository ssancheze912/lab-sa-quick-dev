using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Text.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Story 1.3: Backend Database Foundation
/// ATDD Acceptance Tests — RED Phase
///
/// Covers: AC2 — Unhandled exceptions return Problem Details RFC 7807
///         with no stackTrace, exception, or innerException keys exposed.
///         Test case TC-E1-P0-05 (P0).
///
/// NOTE: These tests require WebApplicationFactory wiring to SiesaAgents.API.
///       They will fail (RED) until the following are in place:
///         1. AppDbContext registered in Program.cs (AddDbContext)
///         2. Connection string read from appsettings.Development.json
///         3. ExceptionHandlingMiddleware registered as the FIRST middleware in Program.cs
///       The test host uses a custom pipeline to trigger the middleware directly
///       without relying on a real database connection.
/// </summary>
public class ExceptionMiddlewareTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ExceptionMiddlewareTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    // ─── AC2: Problem Details RFC 7807 — status field ────────────────────────

    [Fact]
    public async Task UnhandledException_ReturnsProblemDetails_WithStatus500()
    {
        // GIVEN: ExceptionHandlingMiddleware is the first middleware in the pipeline
        // and a test endpoint is registered that throws an unhandled exception
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                // Register the middleware under test — must be first
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();

                // Register a test-only endpoint that throws — NOT in production Program.cs
                app.Run(_ => throw new Exception("internal test error"));
            });
        }).CreateClient();

        // WHEN: Any request hits the endpoint
        var response = await client.GetAsync("/api/v1/test-error");

        // THEN: HTTP 500 Internal Server Error
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    // ─── AC2: Problem Details RFC 7807 — Content-Type ────────────────────────

    [Fact]
    public async Task UnhandledException_ReturnsProblemDetails_WithProblemJsonContentType()
    {
        // GIVEN: ExceptionHandlingMiddleware is registered in the pipeline
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.Run(_ => throw new Exception("internal test error"));
            });
        }).CreateClient();

        // WHEN: A request triggers an unhandled exception
        var response = await client.GetAsync("/api/v1/test-error");
        var contentType = response.Content.Headers.ContentType?.ToString() ?? string.Empty;

        // THEN: Content-Type is application/problem+json (RFC 7807)
        Assert.Contains("application/problem+json", contentType);
    }

    // ─── AC2: Problem Details RFC 7807 — required 'status' field ─────────────

    [Fact]
    public async Task UnhandledException_ReturnsProblemDetails_WithStatusField()
    {
        // GIVEN: ExceptionHandlingMiddleware returns RFC 7807 Problem Details
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.Run(_ => throw new Exception("internal test error"));
            });
        }).CreateClient();

        // WHEN: An exception is thrown and the response body is parsed
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // THEN: Response JSON contains a 'status' field
        Assert.True(root.TryGetProperty("status", out _),
            "Problem Details must contain a 'status' field (RFC 7807 requirement)");
    }

    // ─── AC2: Problem Details RFC 7807 — required 'title' field ─────────────

    [Fact]
    public async Task UnhandledException_ReturnsProblemDetails_WithTitleField()
    {
        // GIVEN: ExceptionHandlingMiddleware returns RFC 7807 Problem Details
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.Run(_ => throw new Exception("internal test error"));
            });
        }).CreateClient();

        // WHEN: An exception is thrown and the response body is parsed
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // THEN: Response JSON contains a non-null 'title' field
        Assert.True(root.TryGetProperty("title", out var titleProperty),
            "Problem Details must contain a 'title' field (RFC 7807 requirement)");
        Assert.False(string.IsNullOrWhiteSpace(titleProperty.GetString()),
            "'title' field must not be empty or whitespace");
    }

    // ─── AC2: NFR6 — NO stackTrace exposed ───────────────────────────────────

    [Fact]
    public async Task UnhandledException_ReturnsProblemDetails_WithNoStackTraceKey()
    {
        // GIVEN: ExceptionHandlingMiddleware must NOT expose internal stack traces (NFR6)
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.Run(_ => throw new Exception("internal test error"));
            });
        }).CreateClient();

        // WHEN: An unhandled exception occurs and the response body is parsed
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // THEN: The 'stackTrace' key is NOT present (NFR6 — never expose internals)
        Assert.False(root.TryGetProperty("stackTrace", out _),
            "NFR6 violation: 'stackTrace' must NEVER be exposed in error responses");
    }

    // ─── AC2: NFR6 — NO exception key exposed ────────────────────────────────

    [Fact]
    public async Task UnhandledException_ReturnsProblemDetails_WithNoExceptionKey()
    {
        // GIVEN: ExceptionHandlingMiddleware must NOT expose internal exception data (NFR6)
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.Run(_ => throw new Exception("internal test error"));
            });
        }).CreateClient();

        // WHEN: An unhandled exception occurs and the response body is parsed
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // THEN: The 'exception' key is NOT present (NFR6)
        Assert.False(root.TryGetProperty("exception", out _),
            "NFR6 violation: 'exception' must NEVER be exposed in error responses");
    }

    // ─── AC2: NFR6 — NO innerException key exposed ───────────────────────────

    [Fact]
    public async Task UnhandledException_ReturnsProblemDetails_WithNoInnerExceptionKey()
    {
        // GIVEN: ExceptionHandlingMiddleware must NOT expose inner exception data (NFR6)
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.Run(_ => throw new Exception("outer", new Exception("inner")));
            });
        }).CreateClient();

        // WHEN: An exception with inner exception occurs and response is parsed
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // THEN: The 'innerException' key is NOT present (NFR6)
        Assert.False(root.TryGetProperty("innerException", out _),
            "NFR6 violation: 'innerException' must NEVER be exposed in error responses");
    }
}
