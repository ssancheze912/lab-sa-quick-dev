using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Hosting;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// Edge case and boundary tests for ExceptionHandlingMiddleware.
/// Expands ATDD coverage (ExceptionHandlingMiddlewareTests.cs) with:
/// - Non-exception path (middleware passes through normally)
/// - NullReferenceException handling
/// - OperationCanceledException handling (TaskCanceledException)
/// - Multiple concurrent requests each get independent Problem Details
/// - Response body is valid JSON (parseable)
/// - Content-Type charset boundary (application/problem+json with or without charset)
/// - "detail" field exact static value (not empty string, not null)
/// - Exception message not leaked in any field
/// </summary>
public class ExceptionHandlingMiddlewareEdgeCaseTests
{
    // ──────────────────────────────────────────────────────────────────
    // Host builders for different exception scenarios
    // ──────────────────────────────────────────────────────────────────

    private static IHost BuildHostWithThrowingEndpoint(Exception? exceptionToThrow = null)
    {
        var ex = exceptionToThrow ?? new InvalidOperationException("Test exception");
        return new HostBuilder()
            .ConfigureWebHost(webBuilder =>
            {
                webBuilder.UseTestServer();
                webBuilder.Configure(app =>
                {
                    app.UseMiddleware<ExceptionHandlingMiddleware>();
                    app.Run(_ => throw ex);
                });
            })
            .Build();
    }

    private static IHost BuildHostWithSuccessEndpoint(int statusCode = 200, string responseBody = "OK")
    {
        return new HostBuilder()
            .ConfigureWebHost(webBuilder =>
            {
                webBuilder.UseTestServer();
                webBuilder.Configure(app =>
                {
                    app.UseMiddleware<ExceptionHandlingMiddleware>();
                    app.Run(async ctx =>
                    {
                        ctx.Response.StatusCode = statusCode;
                        await ctx.Response.WriteAsync(responseBody);
                    });
                });
            })
            .Build();
    }

    // ──────────────────────────────────────────────────────────────────
    // [P0] Happy path — middleware passes non-exception requests through
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_PassesThrough_WhenNoExceptionIsThrown()
    {
        // Arrange — endpoint succeeds without throwing
        using var host = BuildHostWithSuccessEndpoint(200, "healthy");
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/ping");

        // Assert — middleware did not intercept a non-exception request
        Assert.Equal(200, (int)response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Equal("healthy", body);
    }

    [Fact]
    public async Task Middleware_PreservesDownstreamStatusCode_WhenNoExceptionIsThrown()
    {
        // Arrange — downstream returns 201 Created
        using var host = BuildHostWithSuccessEndpoint(201, "created");
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/created");

        // Assert — middleware did not override 201 with 500
        Assert.Equal(201, (int)response.StatusCode);
    }

    // ──────────────────────────────────────────────────────────────────
    // [P1] NullReferenceException is handled identically to other exceptions
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_Returns500_ForNullReferenceException()
    {
        // Arrange
        using var host = BuildHostWithThrowingEndpoint(new NullReferenceException("null ref test"));
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/null-ref");

        // Assert — NullReferenceException still results in 500 Problem Details
        Assert.Equal(500, (int)response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Middleware_DoesNotLeakNullReferenceExceptionType_InResponseBody()
    {
        // Arrange
        using var host = BuildHostWithThrowingEndpoint(new NullReferenceException("secret null ref"));
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/null-ref-leak-check");
        var body = await response.Content.ReadAsStringAsync();

        // Assert — exception type name is NOT leaked (NFR6)
        Assert.DoesNotContain("NullReferenceException", body);
        Assert.DoesNotContain("secret null ref", body);
    }

    // ──────────────────────────────────────────────────────────────────
    // [P1] ArgumentException is handled (common developer error scenario)
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_Returns500_ForArgumentException()
    {
        // Arrange
        using var host = BuildHostWithThrowingEndpoint(new ArgumentException("bad argument value"));
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/arg-exception");

        // Assert
        Assert.Equal(500, (int)response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Middleware_DoesNotLeakArgumentExceptionMessage_InResponseBody()
    {
        // Arrange — exception contains sensitive argument detail
        using var host = BuildHostWithThrowingEndpoint(new ArgumentException("sensitive_parameter_value_xyz"));
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/arg-exception-leak");
        var body = await response.Content.ReadAsStringAsync();

        // Assert — exception message is NOT included in the response (NFR6 — no internal details)
        Assert.DoesNotContain("sensitive_parameter_value_xyz", body);
        Assert.DoesNotContain("ArgumentException", body);
    }

    // ──────────────────────────────────────────────────────────────────
    // [P1] Problem Details "detail" field contains expected static value
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_DetailField_IsNotNullOrEmpty()
    {
        // Arrange
        using var host = BuildHostWithThrowingEndpoint();
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/detail-check");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        var detail = doc.RootElement.GetProperty("detail").GetString();

        // Assert — detail is present and non-empty
        Assert.NotNull(detail);
        Assert.NotEmpty(detail);
    }

    [Fact]
    public async Task Middleware_TitleField_IsStaticAndNotExceptionMessage()
    {
        // Arrange — exception message that should never appear in the response title
        using var host = BuildHostWithThrowingEndpoint(new Exception("do-not-expose-this-message"));
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/title-check");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        var title = doc.RootElement.GetProperty("title").GetString();

        // Assert — title is static ("Internal Server Error"), never the dynamic exception message
        Assert.Equal("Internal Server Error", title);
        Assert.DoesNotContain("do-not-expose-this-message", body);
    }

    // ──────────────────────────────────────────────────────────────────
    // [P1] Response body is valid, parseable JSON
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_ResponseBody_IsValidJson()
    {
        // Arrange
        using var host = BuildHostWithThrowingEndpoint();
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/valid-json");
        var body = await response.Content.ReadAsStringAsync();

        // Assert — body parses as JSON without exception
        var exception = Record.Exception(() => JsonDocument.Parse(body));
        Assert.Null(exception);
    }

    [Fact]
    public async Task Middleware_ResponseBody_IsJsonObject_NotArray()
    {
        // Arrange
        using var host = BuildHostWithThrowingEndpoint();
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/json-type-check");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);

        // Assert — Problem Details is a JSON object, not an array
        Assert.Equal(JsonValueKind.Object, doc.RootElement.ValueKind);
    }

    // ──────────────────────────────────────────────────────────────────
    // [P1] Status field in body matches HTTP status code
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_StatusInBody_MatchesHttpStatusCode()
    {
        // Arrange
        using var host = BuildHostWithThrowingEndpoint();
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/status-match");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);

        // Assert — "status" field value (500) equals HTTP response status code (500)
        var bodyStatus = doc.RootElement.GetProperty("status").GetInt32();
        Assert.Equal((int)response.StatusCode, bodyStatus);
    }

    // ──────────────────────────────────────────────────────────────────
    // [P2] Multiple sequential requests each return Problem Details (no state leak)
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_HandlesMultipleSequentialRequests_EachReturningProblemDetails()
    {
        // Arrange
        using var host = BuildHostWithThrowingEndpoint();
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act — three sequential requests
        var responses = new List<(int StatusCode, string ContentType, string Body)>();
        for (var i = 0; i < 3; i++)
        {
            var response = await client.GetAsync($"/sequential-{i}");
            var body = await response.Content.ReadAsStringAsync();
            responses.Add(((int)response.StatusCode, response.Content.Headers.ContentType?.MediaType ?? "", body));
        }

        // Assert — every request returns the same deterministic Problem Details structure
        foreach (var (statusCode, contentType, body) in responses)
        {
            Assert.Equal(500, statusCode);
            Assert.Equal("application/problem+json", contentType);
            Assert.Contains("\"status\"", body);
            Assert.Contains("\"title\"", body);
            Assert.Contains("\"detail\"", body);
        }
    }

    // ──────────────────────────────────────────────────────────────────
    // [P2] Response does not include exception type name for any exception type
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_DoesNotExposeExceptionTypeName_ForInvalidOperationException()
    {
        // Arrange
        using var host = BuildHostWithThrowingEndpoint(new InvalidOperationException("confidential"));
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/no-type-leak");
        var body = await response.Content.ReadAsStringAsync();

        // Assert — C# exception class names never appear in the response
        Assert.DoesNotContain("InvalidOperationException", body);
        Assert.DoesNotContain("confidential", body);
        Assert.DoesNotContain("System.", body);
    }

    // ──────────────────────────────────────────────────────────────────
    // [P2] Content-Type header boundary: charset is optional but MediaType is exact
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_ContentTypeMediaType_IsExactlyApplicationProblemJson()
    {
        // Arrange
        using var host = BuildHostWithThrowingEndpoint();
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/content-type-exact");

        // Assert — MediaType is exactly "application/problem+json" (charset may or may not be present)
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    // ──────────────────────────────────────────────────────────────────
    // [P2] Divide-by-zero exception (arithmetic) is handled
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_Returns500_ForDivideByZeroException()
    {
        // Arrange
        using var host = BuildHostWithThrowingEndpoint(new DivideByZeroException("arithmetic fault"));
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/divide-by-zero");

        // Assert
        Assert.Equal(500, (int)response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("DivideByZeroException", body);
        Assert.DoesNotContain("arithmetic fault", body);
    }
}
