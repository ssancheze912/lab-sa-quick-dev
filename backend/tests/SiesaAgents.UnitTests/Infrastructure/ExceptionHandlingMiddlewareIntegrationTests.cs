using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.API.Middleware;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// ATDD integration tests for Story 1.3: Backend Database Foundation
/// Tests TC-E1-P0-05 (P0) — ExceptionHandlingMiddleware returns Problem Details RFC 7807
/// via full WebApplicationFactory HTTP pipeline.
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
        var response = await _client.GetAsync("/api/v1/test-error");
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
        var response = await _client.GetAsync("/api/v1/test-error");
        var contentType = response.Content.Headers.ContentType?.MediaType;
        Assert.Equal("application/problem+json", contentType);
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
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);

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
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);

        Assert.True(doc.RootElement.TryGetProperty("title", out var titleProp),
            "Response body must contain 'title' field per RFC 7807");
        Assert.Equal(JsonValueKind.String, titleProp.ValueKind);
        Assert.NotEmpty(titleProp.GetString()!);
    }

    /// <summary>
    /// TC-E1-P0-05 (P0)
    /// GIVEN an unhandled exception occurs in the backend
    /// WHEN the error reaches ExceptionHandlingMiddleware
    /// THEN response JSON contains 'detail' field (may be null)
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenExceptionThrown_ResponseContainsDetailField()
    {
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);

        Assert.True(doc.RootElement.TryGetProperty("detail", out var detailProp),
            "Response body must contain 'detail' field per RFC 7807 (null value is acceptable)");

        if (detailProp.ValueKind != JsonValueKind.Null)
        {
            var detailValue = detailProp.GetString();
            Assert.Null(detailValue);
        }
    }

    /// <summary>
    /// TC-E1-P0-05 (P0) — NFR6: No stack traces exposed
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenExceptionThrown_NoStackTraceExposed()
    {
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();

        Assert.False(body.Contains("stackTrace"), "'stackTrace' must NOT appear in error response (NFR6)");
        Assert.False(body.Contains("StackTrace"), "'StackTrace' must NOT appear in error response (NFR6)");
        Assert.False(body.Contains("\"exception\""), "'exception' field must NOT appear in error response (NFR6)");
        Assert.False(body.Contains("innerException"), "'innerException' must NOT appear in error response (NFR6)");
        Assert.False(body.Contains("InnerException"), "'InnerException' must NOT appear in error response (NFR6)");
        Assert.False(body.Contains("internal test error"),
            "Raw exception message must NOT be exposed in error response (NFR6)");
    }

    /// <summary>
    /// TC-E1-P0-05 (P0) — Middleware ordering check
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenRegisteredBeforeEndpoints_CatchesException()
    {
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();

        Assert.NotEmpty(body);
        Assert.True(body.Contains("status") || body.Contains("title"),
            "Middleware must have caught the exception and produced a structured response.");
    }
}

/// <summary>
/// Custom WebApplicationFactory that adds a test endpoint GET /api/v1/test-error
/// which intentionally throws an exception to test ExceptionHandlingMiddleware.
///
/// Uses IStartupFilter to inject a throwing middleware at the start of the pipeline,
/// ensuring ExceptionHandlingMiddleware (registered in Program.cs) catches the exception.
/// </summary>
public class ThrowingEndpointApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureTestServices(services =>
        {
            // Inject a startup filter that adds a test-only middleware
            // at the BEGINNING of the pipeline (after ExceptionHandlingMiddleware has been added)
            // The ExceptionHandlingMiddleware is already registered in Program.cs pipeline
            services.AddTransient<IStartupFilter, TestErrorEndpointStartupFilter>();
        });
    }
}

/// <summary>
/// Startup filter that injects a test endpoint middleware into the pipeline.
/// The filter runs AFTER ExceptionHandlingMiddleware (which is added in Program.cs UseMiddleware call),
/// ensuring exceptions thrown here are caught by ExceptionHandlingMiddleware.
/// </summary>
public class TestErrorEndpointStartupFilter : IStartupFilter
{
    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
    {
        return app =>
        {
            // Let existing middleware (including ExceptionHandlingMiddleware) run first
            next(app);

            // Then add a test-only route that throws
            app.Use(async (context, nextMiddleware) =>
            {
                if (context.Request.Path == "/api/v1/test-error" && context.Request.Method == "GET")
                {
                    throw new Exception("internal test error");
                }

                await nextMiddleware(context);
            });
        };
    }
}
