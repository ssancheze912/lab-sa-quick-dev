using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// ATDD tests for Story 1.3 - AC2: Problem Details RFC 7807 error handling.
/// RED PHASE: These tests define expected behavior before wiring is verified complete.
/// </summary>
public class ExceptionHandlingMiddlewareTests
{
    // -------------------------------------------------------------------------
    // AC2: Unhandled exception returns Problem Details RFC 7807 payload
    //      with status, title, and detail (no stack traces exposed to caller)
    // -------------------------------------------------------------------------

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ReturnsStatusCode500()
    {
        // GIVEN: A middleware that wraps a next delegate that throws an unhandled exception
        var middleware = new ExceptionHandlingMiddleware(next: (_) =>
            throw new InvalidOperationException("Simulated unhandled error"));

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: HTTP status code is 500
        Assert.Equal((int)HttpStatusCode.InternalServerError, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ReturnsContentTypeProblemJson()
    {
        // GIVEN: A middleware that wraps a faulting next delegate
        var middleware = new ExceptionHandlingMiddleware(next: (_) =>
            throw new Exception("Simulated error"));

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Content-Type is application/problem+json (RFC 7807)
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ReturnsProblemDetailsWithStatusAndTitle()
    {
        // GIVEN: A middleware that wraps a faulting next delegate
        var middleware = new ExceptionHandlingMiddleware(next: (_) =>
            throw new Exception("Simulated error"));

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response body contains a Problem Details object with 'status' and 'title' fields
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();

        var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            "Response must contain 'status' field (RFC 7807)");
        Assert.Equal(500, statusProp.GetInt32());

        Assert.True(doc.RootElement.TryGetProperty("title", out var titleProp),
            "Response must contain 'title' field (RFC 7807)");
        Assert.False(string.IsNullOrWhiteSpace(titleProp.GetString()),
            "'title' field must not be empty");
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_DoesNotExposeStackTrace()
    {
        // GIVEN: A middleware that wraps a faulting next delegate
        var middleware = new ExceptionHandlingMiddleware(next: (_) =>
            throw new Exception("Simulated error"));

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response body must NOT contain stack trace information (NFR6)
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();

        Assert.DoesNotContain("StackTrace", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("at System.", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("at SiesaAgents.", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task InvokeAsync_WhenNoExceptionThrown_PassesThroughSuccessfully()
    {
        // GIVEN: A middleware that wraps a healthy next delegate
        var middleware = new ExceptionHandlingMiddleware(next: (ctx) =>
        {
            ctx.Response.StatusCode = 200;
            return Task.CompletedTask;
        });

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: The response passes through unmodified with 200 OK
        Assert.Equal(200, context.Response.StatusCode);
    }
}
