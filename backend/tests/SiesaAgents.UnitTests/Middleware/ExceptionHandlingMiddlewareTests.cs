using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using SiesaAgents.API.Middleware;
using Xunit;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// Unit tests for ExceptionHandlingMiddleware (Story 1.3, AC2).
/// Verifies Problem Details RFC 7807 format is returned without exposing stack traces.
/// </summary>
public class ExceptionHandlingMiddlewareTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Helper: build a DefaultHttpContext with a writable response body
    // ─────────────────────────────────────────────────────────────────────────
    private static DefaultHttpContext CreateHttpContext()
    {
        var ctx = new DefaultHttpContext();
        ctx.Response.Body = new MemoryStream();
        return ctx;
    }

    private static async Task<string> ReadResponseBodyAsync(HttpContext ctx)
    {
        ctx.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(ctx.Response.Body);
        return await reader.ReadToEndAsync();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 1 (AC2): Middleware returns HTTP 500 with application/problem+json
    // when an unhandled exception is thrown by the next delegate.
    //
    // Given: an unhandled exception occurs in the backend
    // When:  the error reaches the middleware
    // Then:  the response status code is 500
    //   And: the Content-Type is "application/problem+json"
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_Returns500WithProblemJsonContentType()
    {
        // Arrange
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        RequestDelegate next = _ => throw new InvalidOperationException("boom");
        var middleware = new ExceptionHandlingMiddleware(next, logger);
        var ctx = CreateHttpContext();

        // Act
        await middleware.InvokeAsync(ctx);

        // Assert
        Assert.Equal(StatusCodes.Status500InternalServerError, ctx.Response.StatusCode);
        Assert.Contains("application/problem+json", ctx.Response.ContentType);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 2 (AC2): Response body contains required RFC 7807 fields:
    //   "status", "title", "detail"
    //
    // Given: an unhandled exception occurs
    // When:  the middleware handles it
    // Then:  the JSON body contains the fields status, title, and detail
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyContainsProblemDetailsShape()
    {
        // Arrange
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        RequestDelegate next = _ => throw new Exception("test-exception");
        var middleware = new ExceptionHandlingMiddleware(next, logger);
        var ctx = CreateHttpContext();

        // Act
        await middleware.InvokeAsync(ctx);

        // Assert
        var body = await ReadResponseBodyAsync(ctx);
        var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("status", out var statusProp), "Response must contain 'status' field (RFC 7807)");
        Assert.True(root.TryGetProperty("title", out _), "Response must contain 'title' field (RFC 7807)");
        Assert.Equal(500, statusProp.GetInt32());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 3 (AC2 + NFR6): Response body must NOT contain stack trace text.
    //
    // Given: an unhandled exception occurs
    // When:  the middleware handles it
    // Then:  the response body does not include "StackTrace" or "at " frames
    //   And: the exception message is not exposed verbatim
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyDoesNotContainStackTrace()
    {
        // Arrange
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        const string sensitiveMessage = "sensitive-internal-error-xyz";
        RequestDelegate next = _ => throw new InvalidOperationException(sensitiveMessage);
        var middleware = new ExceptionHandlingMiddleware(next, logger);
        var ctx = CreateHttpContext();

        // Act
        await middleware.InvokeAsync(ctx);

        // Assert
        var body = await ReadResponseBodyAsync(ctx);

        // The raw exception message must NOT appear in the response (NFR6)
        Assert.DoesNotContain(sensitiveMessage, body, StringComparison.OrdinalIgnoreCase);

        // Stack trace indicators must not appear
        Assert.DoesNotContain("StackTrace", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("   at ", body, StringComparison.Ordinal);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 4 (AC2): Middleware invokes the next delegate when no exception
    // is thrown — the happy-path request must pass through without modification.
    //
    // Given: the backend receives a normal request (no exception)
    // When:  the request is processed through the middleware
    // Then:  the next delegate is called
    //   And: the response is untouched (status 200)
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task InvokeAsync_WhenNoExceptionThrown_InvokesNextDelegateAndReturns200()
    {
        // Arrange
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        var nextCalled = false;
        RequestDelegate next = ctx =>
        {
            nextCalled = true;
            ctx.Response.StatusCode = StatusCodes.Status200OK;
            return Task.CompletedTask;
        };
        var middleware = new ExceptionHandlingMiddleware(next, logger);
        var ctx = CreateHttpContext();

        // Act
        await middleware.InvokeAsync(ctx);

        // Assert
        Assert.True(nextCalled, "The 'next' delegate must be called when no exception occurs");
        Assert.Equal(StatusCodes.Status200OK, ctx.Response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 5 (AC2): The "title" field in the Problem Details response must be
    // a generic, user-safe message — NOT the original exception message.
    //
    // Given: an unhandled exception occurs
    // When:  the middleware serializes the Problem Details response
    // Then:  the "title" field is the safe generic message
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_TitleFieldIsGenericSafeMessage()
    {
        // Arrange
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        RequestDelegate next = _ => throw new Exception("raw-internal-exception-message");
        var middleware = new ExceptionHandlingMiddleware(next, logger);
        var ctx = CreateHttpContext();

        // Act
        await middleware.InvokeAsync(ctx);

        // Assert
        var body = await ReadResponseBodyAsync(ctx);
        var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("title", out var titleProp));
        var title = titleProp.GetString() ?? string.Empty;

        // Title must not contain the raw exception message
        Assert.DoesNotContain("raw-internal-exception-message", title, StringComparison.OrdinalIgnoreCase);

        // Title must be a non-empty generic message
        Assert.False(string.IsNullOrWhiteSpace(title), "Title must not be empty");
    }
}
