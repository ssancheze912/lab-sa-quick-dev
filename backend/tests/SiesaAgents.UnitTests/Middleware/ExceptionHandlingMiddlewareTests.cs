using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// Story 1.3: Backend Database Foundation
/// ATDD Unit Tests — RED Phase
/// These tests are intentionally FAILING until ExceptionHandlingMiddleware is fully implemented.
///
/// Acceptance Criteria covered:
///   AC3 — ExceptionHandlingMiddleware returns Problem Details RFC 7807 format
///          (status, title, detail fields) with NO stack trace exposed (NFR6)
/// </summary>
public class ExceptionHandlingMiddlewareTests
{
    /// <summary>
    /// Creates an in-process TestServer with ExceptionHandlingMiddleware and a
    /// throwing endpoint. No real network is involved — tests run fully in-process.
    /// </summary>
    private static HttpClient CreateTestClient()
    {
        var host = new HostBuilder()
            .ConfigureWebHost(webHost =>
            {
                webHost.UseTestServer();
                webHost.ConfigureServices(services =>
                {
                    services.AddRouting();
                });
                webHost.Configure(app =>
                {
                    // Register ExceptionHandlingMiddleware BEFORE routing (matches Program.cs)
                    app.UseMiddleware<ExceptionHandlingMiddleware>();
                    app.UseRouting();
                    app.UseEndpoints(endpoints =>
                    {
                        // Endpoint that deliberately throws to trigger the middleware
                        endpoints.MapGet("/throw", _ =>
                            throw new InvalidOperationException("Test exception for ATDD"));
                    });
                });
            })
            .Build();

        host.Start();
        return host.GetTestServer().CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3 — Content-Type must be application/problem+json
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_ReturnsProblеmDetails_ContentType_OnUnhandledException()
    {
        // GIVEN: ExceptionHandlingMiddleware is registered before routing
        //        An endpoint throws an unhandled exception
        var client = CreateTestClient();

        // WHEN: A request hits the throwing endpoint
        var response = await client.GetAsync("/throw");

        // THEN: Content-Type is application/problem+json (RFC 7807)
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3 — HTTP status code must be 500
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_Returns500StatusCode_OnUnhandledException()
    {
        // GIVEN: ExceptionHandlingMiddleware catches all unhandled exceptions
        var client = CreateTestClient();

        // WHEN: A request triggers an unhandled exception
        var response = await client.GetAsync("/throw");

        // THEN: HTTP status code is 500 Internal Server Error
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3 — Response body must contain "status" field (RFC 7807)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_ResponseBody_ContainsStatusField()
    {
        // GIVEN: Problem Details RFC 7807 requires a "status" field (numeric HTTP status)
        var client = CreateTestClient();

        // WHEN: An unhandled exception is triggered
        var response = await client.GetAsync("/throw");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: Response body contains "status" field
        Assert.Contains("\"status\"", body);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3 — Response body must contain "title" field (RFC 7807)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_ResponseBody_ContainsTitleField()
    {
        // GIVEN: Problem Details RFC 7807 requires a "title" field (short description)
        var client = CreateTestClient();

        // WHEN: An unhandled exception is triggered
        var response = await client.GetAsync("/throw");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: Response body contains "title" field
        Assert.Contains("\"title\"", body);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3 — "status" field value must be 500 (numeric, not string)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_StatusField_Is500_InResponseBody()
    {
        // GIVEN: Problem Details response should have status: 500 to match HTTP status code
        var client = CreateTestClient();

        // WHEN: An unhandled exception is triggered
        var response = await client.GetAsync("/throw");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);

        // THEN: "status" field value is 500
        Assert.True(json.RootElement.TryGetProperty("status", out var statusProperty));
        Assert.Equal(500, statusProperty.GetInt32());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3 / NFR6 — No stack trace exposed in response body
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_ResponseBody_DoesNotContain_StackTrace(  )
    {
        // GIVEN: NFR6 mandates no stack traces are ever exposed in API responses
        var client = CreateTestClient();

        // WHEN: An unhandled exception is triggered (which has a real stack trace internally)
        var response = await client.GetAsync("/throw");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: Response body does NOT contain any stack trace information
        Assert.DoesNotContain("stackTrace", body);
        Assert.DoesNotContain("StackTrace", body);
        Assert.DoesNotContain("   at ", body); // C# stack trace line prefix
    }

    [Fact]
    public async Task Middleware_ResponseBody_DoesNotExpose_ExceptionTypeName()
    {
        // GIVEN: NFR6 — exception type names must not be exposed to clients (security risk)
        var client = CreateTestClient();

        // WHEN: An unhandled InvalidOperationException is triggered
        var response = await client.GetAsync("/throw");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: Exception type name is NOT in the response body
        Assert.DoesNotContain("InvalidOperationException", body);
        Assert.DoesNotContain("System.", body);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3 — Middleware does NOT re-throw (it handles the exception fully)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_HandlesException_WithoutPropagating()
    {
        // GIVEN: ExceptionHandlingMiddleware must catch and handle exceptions
        //        (not re-throw, which would cause the framework to return a 500 HTML page)
        var client = CreateTestClient();

        // WHEN: A request hits the throwing endpoint
        Func<Task<HttpResponseMessage>> act = () => client.GetAsync("/throw");

        // THEN: No exception propagates to the test — middleware handled it gracefully
        var exception = await Record.ExceptionAsync(act);
        Assert.Null(exception);
    }
}
