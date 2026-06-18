/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
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
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Api;

/// <summary>
/// Startup filter that registers the test error endpoint into the existing pipeline.
/// By using IStartupFilter, the test endpoint is appended AFTER the app's own middleware
/// (including ExceptionHandlingMiddleware), so exceptions thrown here will propagate
/// up through the full middleware pipeline.
/// </summary>
internal class TestErrorEndpointStartupFilter : IStartupFilter
{
    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next) =>
        app =>
        {
            next(app); // Call all app middleware first (ExceptionHandlingMiddleware is set up here)
            app.Map("/api/v1/test-error", errorApp =>
            {
                errorApp.Run(_ => throw new Exception("internal test — unhandled exception for ATDD"));
            });
        };
}

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
            // Replace PostgreSQL DbContext with InMemory to avoid live DB dependency
            var dbContextDescriptor = services.FirstOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));

            if (dbContextDescriptor is not null)
            {
                services.Remove(dbContextDescriptor);
            }

            var dbContextServiceDescriptor = services.FirstOrDefault(
                d => d.ServiceType == typeof(AppDbContext));

            if (dbContextServiceDescriptor is not null)
            {
                services.Remove(dbContextServiceDescriptor);
            }

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase($"TestDb_{Guid.NewGuid()}"));

            // Register the startup filter that appends the test error endpoint
            services.AddSingleton<IStartupFilter, TestErrorEndpointStartupFilter>();
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
        var response = await _client.GetAsync("/api/v1/test-error");

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC2: Content-Type must be application/problem+json (RFC 7807)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExceptionMiddleware_UnhandledException_ReturnsProblemJsonContentType()
    {
        var response = await _client.GetAsync("/api/v1/test-error");
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;

        Assert.Contains("application/problem+json", contentType);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC2: Response body must contain "status" field (RFC 7807)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExceptionMiddleware_UnhandledException_ResponseBodyContainsStatusField()
    {
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

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
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

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
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

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
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

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
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

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
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

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
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

        json.RootElement.TryGetProperty("status", out var statusElement);

        Assert.Equal(500, statusElement.GetInt32());
    }
}
