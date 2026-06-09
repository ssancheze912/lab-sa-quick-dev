// Expanded coverage — Story 1.3: Backend Database Foundation
// Edge cases and boundary conditions NOT covered by ATDD tests.
// These tests expand ExceptionMiddlewareTests.cs with negative paths,
// boundary conditions, and security edge cases.

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
/// Edge case and boundary condition tests for ExceptionHandlingMiddleware.
/// Expands ATDD coverage with additional exception types, HTTP verbs, and
/// concurrent/security edge cases not covered in ExceptionMiddlewareTests.cs.
/// </summary>
public class ExceptionMiddlewareEdgeCaseTests
{
    // -----------------------------------------------------------------------
    // Factory helpers — each builds an isolated TestServer with a specific exception type
    // -----------------------------------------------------------------------

    private static HttpClient CreateClientWithException(Exception exception)
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
                        endpoints.MapGet("/api/v1/test-error", () => throw exception);
                        endpoints.MapPost("/api/v1/test-error", () => throw exception);
                        endpoints.MapPut("/api/v1/test-error", () => throw exception);
                        endpoints.MapDelete("/api/v1/test-error", () => throw exception);
                    });
                });
            });

        return hostBuilder.Start().GetTestClient();
    }

    private static HttpClient CreateClientWithThrowingEndpoint()
        => CreateClientWithException(new Exception("internal test — should never reach the client"));

    // -----------------------------------------------------------------------
    // Edge Case 1: ArgumentException is caught and returns 500 (not 400)
    // Verifies middleware catches ALL exception types, not just base Exception.
    // -----------------------------------------------------------------------

    [Fact]
    public async Task ExceptionMiddleware_ArgumentException_Returns500_NotBadRequest()
    {
        // GIVEN: A backend endpoint that throws ArgumentException (not base Exception)
        var client = CreateClientWithException(new ArgumentException("invalid arg — should never reach client"));

        // WHEN: The endpoint is called
        var response = await client.GetAsync("/api/v1/test-error");

        // THEN: HTTP status is 500, not 400 — middleware intercepts all exceptions uniformly
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    // -----------------------------------------------------------------------
    // Edge Case 2: ArgumentException does NOT expose argument details in body
    // -----------------------------------------------------------------------

    [Fact]
    public async Task ExceptionMiddleware_ArgumentException_DoesNotExposeArgumentName()
    {
        // GIVEN: ArgumentException with a specific parameter name
        var client = CreateClientWithException(new ArgumentException("invalid arg — edge case", paramName: "parameterName"));

        // WHEN: The endpoint is called
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: Neither the argument value nor parameter name leak into the response
        Assert.DoesNotContain("parameterName", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("invalid arg", body, StringComparison.OrdinalIgnoreCase);
    }

    // -----------------------------------------------------------------------
    // Edge Case 3: InvalidOperationException is caught and returns Problem Details
    // -----------------------------------------------------------------------

    [Fact]
    public async Task ExceptionMiddleware_InvalidOperationException_ReturnsProblemDetails()
    {
        // GIVEN: A backend endpoint that throws InvalidOperationException
        var client = CreateClientWithException(new InvalidOperationException("op not valid — internal only"));

        // WHEN: The endpoint is called
        var response = await client.GetAsync("/api/v1/test-error");
        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        // THEN: Problem Details RFC 7807 is returned with status 500
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.NotNull(problemDetails);
        Assert.Equal(500, problemDetails.Status);
        Assert.Null(problemDetails.Detail);
    }

    // -----------------------------------------------------------------------
    // Edge Case 4: NullReferenceException message never leaks
    // -----------------------------------------------------------------------

    [Fact]
    public async Task ExceptionMiddleware_NullReferenceException_DoesNotExposeInternalMessage()
    {
        // GIVEN: A backend endpoint that throws NullReferenceException
        var client = CreateClientWithException(new NullReferenceException("null ref — confidential"));

        // WHEN: The endpoint is called
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: The internal NullReferenceException message does NOT appear
        Assert.DoesNotContain("null ref", body, StringComparison.OrdinalIgnoreCase);
    }

    // -----------------------------------------------------------------------
    // Edge Case 5: Middleware handles POST verb — not only GET
    // -----------------------------------------------------------------------

    [Fact]
    public async Task ExceptionMiddleware_ReturnsHttp500_ForPostVerb()
    {
        // GIVEN: A POST endpoint that throws an unhandled exception
        var client = CreateClientWithThrowingEndpoint();

        // WHEN: A POST request is made to the throwing endpoint
        var response = await client.PostAsync("/api/v1/test-error", null);

        // THEN: HTTP status is 500 and Content-Type is application/problem+json
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.ToString() ?? string.Empty;
        Assert.Contains("application/problem+json", contentType);
    }

    // -----------------------------------------------------------------------
    // Edge Case 6: Middleware handles PUT verb
    // -----------------------------------------------------------------------

    [Fact]
    public async Task ExceptionMiddleware_ReturnsHttp500_ForPutVerb()
    {
        // GIVEN: A PUT endpoint that throws an unhandled exception
        var client = CreateClientWithThrowingEndpoint();

        // WHEN: A PUT request is made to the throwing endpoint
        var response = await client.PutAsync("/api/v1/test-error", null);

        // THEN: HTTP status is 500
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    // -----------------------------------------------------------------------
    // Edge Case 7: Middleware handles DELETE verb
    // -----------------------------------------------------------------------

    [Fact]
    public async Task ExceptionMiddleware_ReturnsHttp500_ForDeleteVerb()
    {
        // GIVEN: A DELETE endpoint that throws an unhandled exception
        var client = CreateClientWithThrowingEndpoint();

        // WHEN: A DELETE request is made
        var response = await client.DeleteAsync("/api/v1/test-error");

        // THEN: HTTP status is 500
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    // -----------------------------------------------------------------------
    // Edge Case 8: Non-throwing endpoints still work — middleware is transparent
    // Verifies middleware does NOT interfere with successful responses.
    // -----------------------------------------------------------------------

    [Fact]
    public async Task ExceptionMiddleware_DoesNotInterfere_WithSuccessfulEndpoints()
    {
        // GIVEN: A test server with ExceptionHandlingMiddleware and a healthy endpoint
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
                        endpoints.MapGet("/api/v1/health", () => Results.Ok(new { status = "ok" }));
                    });
                });
            });
        var client = hostBuilder.Start().GetTestClient();

        // WHEN: A request is made to the healthy endpoint
        var response = await client.GetAsync("/api/v1/health");

        // THEN: The response is 200 — middleware is transparent for non-throwing paths
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // -----------------------------------------------------------------------
    // Edge Case 9: Concurrent requests each get isolated 500 responses
    // Verifies thread-safety — middleware handles parallel exceptions correctly.
    // -----------------------------------------------------------------------

    [Fact]
    public async Task ExceptionMiddleware_HandlesConcurrentRequests_WithIsolated500Responses()
    {
        // GIVEN: A throwing endpoint with ExceptionHandlingMiddleware
        var client = CreateClientWithThrowingEndpoint();

        // WHEN: 5 concurrent requests are fired simultaneously
        var tasks = Enumerable.Range(0, 5)
            .Select(_ => client.GetAsync("/api/v1/test-error"))
            .ToList();
        var responses = await Task.WhenAll(tasks);

        // THEN: ALL responses are 500 with application/problem+json — no cross-request contamination
        foreach (var response in responses)
        {
            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
            var contentType = response.Content.Headers.ContentType?.ToString() ?? string.Empty;
            Assert.Contains("application/problem+json", contentType);
        }
    }

    // -----------------------------------------------------------------------
    // Edge Case 10: ProblemDetails title is a generic message — not exception type name
    // Verifies that exception type names (ArgumentException, NullReferenceException) do not
    // appear in the title, preventing type-based fingerprinting by attackers.
    // -----------------------------------------------------------------------

    [Fact]
    public async Task ExceptionMiddleware_ProblemDetails_TitleIsGeneric_NotExceptionTypeName()
    {
        // GIVEN: A backend endpoint throwing ArgumentException
        var client = CreateClientWithException(new ArgumentException("arg error"));

        // WHEN: The endpoint is called and ProblemDetails deserialized
        var response = await client.GetAsync("/api/v1/test-error");
        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        // THEN: The title does NOT contain the exception class name (no type leakage)
        Assert.NotNull(problemDetails);
        Assert.NotNull(problemDetails.Title);
        Assert.DoesNotContain("ArgumentException", problemDetails.Title, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Exception", problemDetails.Title!.Substring(0, Math.Min(10, problemDetails.Title.Length)),
            StringComparison.OrdinalIgnoreCase);
    }

    // -----------------------------------------------------------------------
    // Edge Case 11: Response body does NOT contain "at " stack frame patterns
    // Boundary: stack frames use "at TypeName.MethodName()" — must not appear
    // -----------------------------------------------------------------------

    [Fact]
    public async Task ExceptionMiddleware_ResponseBody_DoesNotContainStackFramePatterns()
    {
        // GIVEN: An endpoint that throws with a deep call stack
        var client = CreateClientWithThrowingEndpoint();

        // WHEN: The endpoint is called
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: Common stack frame patterns are absent from the response
        Assert.DoesNotContain("at System.", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("at Microsoft.", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("line ", body, StringComparison.OrdinalIgnoreCase);
    }

    // -----------------------------------------------------------------------
    // Edge Case 12: Response body is valid UTF-8 JSON (no encoding corruption)
    // Boundary: WriteAsync with SerializeToUtf8Bytes must produce correct encoding
    // -----------------------------------------------------------------------

    [Fact]
    public async Task ExceptionMiddleware_ResponseBody_IsValidJsonWithCorrectEncoding()
    {
        // GIVEN: An endpoint that throws
        var client = CreateClientWithThrowingEndpoint();

        // WHEN: Response is read as raw bytes and decoded as UTF-8
        var response = await client.GetAsync("/api/v1/test-error");
        var bytes = await response.Content.ReadAsByteArrayAsync();
        var text = System.Text.Encoding.UTF8.GetString(bytes);

        // THEN: The body is valid JSON that can be parsed
        var parsed = System.Text.Json.JsonDocument.Parse(text);
        Assert.NotNull(parsed);

        // AND: The "status" property exists with value 500
        Assert.True(parsed.RootElement.TryGetProperty("status", out var statusProp));
        Assert.Equal(500, statusProp.GetInt32());
    }
}
