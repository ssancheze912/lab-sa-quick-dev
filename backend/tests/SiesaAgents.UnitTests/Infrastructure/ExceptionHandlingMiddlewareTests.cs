using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Story 1.3 — Backend Database Foundation
/// AC #3 — NFR6: ExceptionHandlingMiddleware returns Problem Details RFC 7807.
/// Maps to: TC-E1-P0-05
///
/// RED Phase: These tests FAIL until ExceptionHandlingMiddleware is tested
/// via WebApplicationFactory with a test-only endpoint. The middleware code
/// already exists but needs validation via an integration test.
/// </summary>
public class ExceptionHandlingMiddlewareTests
    : IClassFixture<ExceptionHandlingMiddlewareTests.ThrowingAppFactory>
{
    private readonly HttpClient _client;

    public ExceptionHandlingMiddlewareTests(ThrowingAppFactory factory)
    {
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC #3 — HTTP status is 500 when an unhandled exception occurs
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WhenUnhandledExceptionOccurs_ShouldReturn500()
    {
        // GIVEN: A test endpoint that intentionally throws an unhandled exception
        // WHEN: A GET request is made to the test-error endpoint

        var response = await _client.GetAsync("/api/v1/test-error");

        // THEN: HTTP status code is 500 Internal Server Error
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC #3 — Content-Type is application/problem+json
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WhenUnhandledExceptionOccurs_ShouldReturnProblemJsonContentType()
    {
        // GIVEN: ExceptionHandlingMiddleware sets Content-Type to application/problem+json
        // WHEN: The test-error endpoint is called

        var response = await _client.GetAsync("/api/v1/test-error");
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;

        // THEN: Content-Type header is application/problem+json
        Assert.Equal("application/problem+json", contentType);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC #3 — Response body contains 'status' field
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WhenUnhandledExceptionOccurs_ResponseBodyShouldContainStatusField()
    {
        // GIVEN: Problem Details RFC 7807 requires a 'status' member
        // WHEN: The test-error endpoint returns the error response

        var response = await _client.GetAsync("/api/v1/test-error");
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: JSON body contains a 'status' field
        Assert.True(doc.RootElement.TryGetProperty("status", out _),
            $"Expected 'status' field in Problem Details body. Actual body: {json}");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC #3 — Response body contains 'title' field
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WhenUnhandledExceptionOccurs_ResponseBodyShouldContainTitleField()
    {
        // GIVEN: Problem Details RFC 7807 requires a 'title' member
        // WHEN: The test-error endpoint returns the error response

        var response = await _client.GetAsync("/api/v1/test-error");
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: JSON body contains a 'title' field
        Assert.True(doc.RootElement.TryGetProperty("title", out _),
            $"Expected 'title' field in Problem Details body. Actual body: {json}");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC #3 — Response body does NOT expose stackTrace
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WhenUnhandledExceptionOccurs_ResponseBodyShouldNotContainStackTrace()
    {
        // GIVEN: NFR6 prohibits exposing internal stack traces to clients
        // WHEN: The test-error endpoint throws an unhandled exception

        var response = await _client.GetAsync("/api/v1/test-error");
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: JSON body does NOT contain 'stackTrace' key
        Assert.False(doc.RootElement.TryGetProperty("stackTrace", out _),
            $"'stackTrace' must NOT be exposed to clients. Actual body: {json}");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC #3 — Response body does NOT expose exception key
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WhenUnhandledExceptionOccurs_ResponseBodyShouldNotContainExceptionKey()
    {
        // GIVEN: NFR6 prohibits exposing internal exception details
        // WHEN: The test-error endpoint throws an unhandled exception

        var response = await _client.GetAsync("/api/v1/test-error");
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: JSON body does NOT contain 'exception' key
        Assert.False(doc.RootElement.TryGetProperty("exception", out _),
            $"'exception' key must NOT be exposed to clients. Actual body: {json}");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC #3 — Response body does NOT expose innerException key
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WhenUnhandledExceptionOccurs_ResponseBodyShouldNotContainInnerExceptionKey()
    {
        // GIVEN: NFR6 prohibits exposing innerException details to clients
        // WHEN: The test-error endpoint throws an unhandled exception

        var response = await _client.GetAsync("/api/v1/test-error");
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: JSON body does NOT contain 'innerException' key
        Assert.False(doc.RootElement.TryGetProperty("innerException", out _),
            $"'innerException' must NOT be exposed to clients. Actual body: {json}");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WebApplicationFactory with test-only endpoint that throws
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Custom factory that registers a test endpoint throwing an unhandled exception.
    /// Uses WebApplicationFactory to host the full Program pipeline (middleware included).
    /// RED: Fails until Microsoft.AspNetCore.Mvc.Testing is added to the test project
    ///      AND SiesaAgents.API project reference is added.
    /// </summary>
    public class ThrowingAppFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.Configure(app =>
            {
                // Register the exception middleware (same as Program.cs ordering)
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();

                app.UseRouting();
                app.UseEndpoints(endpoints =>
                {
                    endpoints.MapGet("/api/v1/test-error", () =>
                    {
                        throw new Exception("internal test error — intentional for ATDD");
                    });
                });
            });
        }
    }
}
