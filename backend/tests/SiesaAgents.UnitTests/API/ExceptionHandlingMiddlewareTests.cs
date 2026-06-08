using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using SiesaAgents.API.Middleware;
using System.Text.Json;

namespace SiesaAgents.UnitTests.API;

/// <summary>
/// Acceptance tests for Story 1.3 – ExceptionHandlingMiddleware (AC #4).
/// All tests are in RED phase: they verify behavior not yet hardened.
/// </summary>
public class ExceptionHandlingMiddlewareTests
{
    // ─────────────────────────────────────────────────────────────────────
    // AC #4 – Unhandled exception → Problem Details RFC 7807 response
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ReturnsStatus500()
    {
        // GIVEN: Middleware wrapping a delegate that throws an unhandled exception
        var middleware = BuildMiddleware(_ => throw new Exception("boom"));
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response status must be 500
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ReturnsApplicationProblemJsonContentType()
    {
        // GIVEN: Middleware wrapping a delegate that throws
        var middleware = BuildMiddleware(_ => throw new Exception("boom"));
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Content-Type must be application/problem+json (RFC 7807)
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyContainsStatusField()
    {
        // GIVEN: Middleware wrapping a delegate that throws
        var middleware = BuildMiddleware(_ => throw new Exception("boom"));
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response body must contain a "status" field (Problem Details)
        var body = await ReadResponseBodyAsync(context);
        var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("status", out _),
            "Problem Details body must contain 'status' field");
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyContainsTitleField()
    {
        // GIVEN: Middleware wrapping a delegate that throws
        var middleware = BuildMiddleware(_ => throw new Exception("boom"));
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response body must contain a "title" field (Problem Details)
        var body = await ReadResponseBodyAsync(context);
        var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("title", out _),
            "Problem Details body must contain 'title' field");
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyContainsDetailField()
    {
        // GIVEN: Middleware wrapping a delegate that throws
        var middleware = BuildMiddleware(_ => throw new Exception("boom"));
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response body must contain a "detail" field (Problem Details)
        var body = await ReadResponseBodyAsync(context);
        var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("detail", out _),
            "Problem Details body must contain 'detail' field");
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_DetailFieldDoesNotContainStackTrace()
    {
        // GIVEN: Middleware wrapping a delegate that throws a known exception
        var middleware = BuildMiddleware(_ => throw new InvalidOperationException("secret internal error"));
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: The response body must NOT expose the stack trace (NFR6 — no internal details leaked)
        var body = await ReadResponseBodyAsync(context);
        Assert.DoesNotContain("at ", body,          StringComparison.Ordinal);
        Assert.DoesNotContain("StackTrace", body,   StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("ExceptionHandlingMiddlewareTests", body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task InvokeAsync_WhenArgumentExceptionThrown_ReturnsStatus400()
    {
        // GIVEN: Middleware wrapping a delegate that throws ArgumentException
        var middleware = BuildMiddleware(_ => throw new ArgumentException("bad input"));
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response status must be 400 Bad Request
        Assert.Equal(StatusCodes.Status400BadRequest, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenKeyNotFoundExceptionThrown_ReturnsStatus404()
    {
        // GIVEN: Middleware wrapping a delegate that throws KeyNotFoundException
        var middleware = BuildMiddleware(_ => throw new KeyNotFoundException("resource missing"));
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response status must be 404 Not Found
        Assert.Equal(StatusCodes.Status404NotFound, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenUnauthorizedAccessExceptionThrown_ReturnsStatus401()
    {
        // GIVEN: Middleware wrapping a delegate that throws UnauthorizedAccessException
        var middleware = BuildMiddleware(_ => throw new UnauthorizedAccessException("forbidden"));
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response status must be 401 Unauthorized
        Assert.Equal(StatusCodes.Status401Unauthorized, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenNoException_PassesRequestThrough()
    {
        // GIVEN: Middleware wrapping a delegate that completes normally
        var middleware = BuildMiddleware(ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status200OK;
            return Task.CompletedTask;
        });
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: The response must not be modified by the middleware
        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────

    private static ExceptionHandlingMiddleware BuildMiddleware(Func<HttpContext, Task> requestDelegate)
    {
        RequestDelegate next = ctx => requestDelegate(ctx);
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        return new ExceptionHandlingMiddleware(next, logger);
    }

    private static DefaultHttpContext BuildHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static async Task<string> ReadResponseBodyAsync(DefaultHttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        return await reader.ReadToEndAsync();
    }
}
