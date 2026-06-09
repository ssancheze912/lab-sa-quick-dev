// ATDD - Story 1.3: Backend Database Foundation
// TC-E1-P0-05: ExceptionHandlingMiddleware Returns Problem Details RFC 7807
// Priority: P0 — Must pass before any story begins implementation

using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests.API;

/// <summary>
/// ATDD tests for ExceptionHandlingMiddleware (Story 1.3 - AC#2).
/// Uses IHostBuilder + TestServer for Minimal API isolation.
/// </summary>
public class ExceptionMiddlewareTests
{
    /// <summary>
    /// Helper: build a minimal test host with ExceptionHandlingMiddleware
    /// and a test endpoint that intentionally throws an unhandled exception.
    /// </summary>
    private static HttpClient CreateClientWithThrowingEndpoint()
    {
        var hostBuilder = new HostBuilder()
            .ConfigureWebHost(webHost =>
            {
                webHost.UseTestServer();
                webHost.ConfigureServices(services =>
                {
                    services.AddLogging();
                    services.AddRouting();
                });
                webHost.Configure(app =>
                {
                    app.UseMiddleware<ExceptionHandlingMiddleware>();
                    app.UseRouting();
                    app.UseEndpoints(endpoints =>
                    {
                        endpoints.MapGet("/api/v1/test-error", () =>
                        {
                            throw new Exception("internal test — should never reach the client");
                        });
                    });
                });
            });

        var host = hostBuilder.Start();
        return host.GetTestClient();
    }

    // -----------------------------------------------------------------------
    // TC-E1-P0-05a: HTTP status is 500 on unhandled exception
    // -----------------------------------------------------------------------

    [Fact]
    public async Task ExceptionMiddleware_ReturnsHttp500_WhenUnhandledExceptionOccurs()
    {
        // GIVEN: A backend endpoint that throws an unhandled exception
        var client = CreateClientWithThrowingEndpoint();

        // WHEN: The endpoint is called
        var response = await client.GetAsync("/api/v1/test-error");

        // THEN: HTTP status is 500 Internal Server Error
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    // -----------------------------------------------------------------------
    // TC-E1-P0-05b: Content-Type is application/problem+json
    // -----------------------------------------------------------------------

    [Fact]
    public async Task ExceptionMiddleware_ReturnsApplicationProblemJson_ContentType()
    {
        // GIVEN: A backend endpoint that throws an unhandled exception
        var client = CreateClientWithThrowingEndpoint();

        // WHEN: The endpoint is called
        var response = await client.GetAsync("/api/v1/test-error");

        // THEN: Content-Type header is application/problem+json (RFC 7807)
        var contentType = response.Content.Headers.ContentType?.ToString() ?? string.Empty;
        Assert.Contains("application/problem+json", contentType);
    }

    // -----------------------------------------------------------------------
    // TC-E1-P0-05c: Response body contains "status" and "title" JSON fields
    // -----------------------------------------------------------------------

    [Fact]
    public async Task ExceptionMiddleware_ResponseBody_ContainsStatusAndTitleFields()
    {
        // GIVEN: A backend endpoint that throws an unhandled exception
        var client = CreateClientWithThrowingEndpoint();

        // WHEN: The endpoint is called
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: Response body contains "status" and "title" fields (Problem Details RFC 7807)
        Assert.Contains("\"status\"", body);
        Assert.Contains("\"title\"", body);
    }

    // -----------------------------------------------------------------------
    // TC-E1-P0-05d: Response body does NOT expose the raw exception message
    // -----------------------------------------------------------------------

    [Fact]
    public async Task ExceptionMiddleware_ResponseBody_DoesNotExposeRawExceptionMessage()
    {
        // GIVEN: A backend endpoint that throws an exception with a specific message
        var client = CreateClientWithThrowingEndpoint();

        // WHEN: The endpoint is called
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: The raw exception message is NOT included in the response (NFR6)
        Assert.DoesNotContain("internal test", body, StringComparison.OrdinalIgnoreCase);
    }

    // -----------------------------------------------------------------------
    // TC-E1-P0-05e: Response body does NOT contain a stack trace
    // -----------------------------------------------------------------------

    [Fact]
    public async Task ExceptionMiddleware_ResponseBody_DoesNotContainStackTrace()
    {
        // GIVEN: A backend endpoint that throws an unhandled exception
        var client = CreateClientWithThrowingEndpoint();

        // WHEN: The endpoint is called
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: No stack trace fields are present in the response (NFR6)
        Assert.DoesNotContain("stackTrace", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("innerException", body, StringComparison.OrdinalIgnoreCase);
    }

    // -----------------------------------------------------------------------
    // TC-E1-P0-05f: ProblemDetails "status" field value equals 500
    // -----------------------------------------------------------------------

    [Fact]
    public async Task ExceptionMiddleware_ProblemDetails_StatusFieldEquals500()
    {
        // GIVEN: A backend endpoint that throws an unhandled exception
        var client = CreateClientWithThrowingEndpoint();

        // WHEN: The endpoint is called and response is deserialized
        var response = await client.GetAsync("/api/v1/test-error");
        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        // THEN: The "status" field in Problem Details is 500
        Assert.NotNull(problemDetails);
        Assert.Equal(500, problemDetails.Status);
    }

    // -----------------------------------------------------------------------
    // TC-E1-P0-05g: ProblemDetails "detail" field is null (no exception detail)
    // -----------------------------------------------------------------------

    [Fact]
    public async Task ExceptionMiddleware_ProblemDetails_DetailFieldIsNull()
    {
        // GIVEN: A backend endpoint that throws an unhandled exception
        var client = CreateClientWithThrowingEndpoint();

        // WHEN: The endpoint is called and response is deserialized
        var response = await client.GetAsync("/api/v1/test-error");
        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        // THEN: The "detail" field is null — exception detail is never exposed (NFR6)
        Assert.NotNull(problemDetails);
        Assert.Null(problemDetails.Detail);
    }
}
