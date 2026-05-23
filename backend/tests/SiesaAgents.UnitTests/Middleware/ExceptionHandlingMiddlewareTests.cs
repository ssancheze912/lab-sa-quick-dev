// Story 1.3: Backend Database Foundation
// AC3 — ExceptionHandlingMiddleware returns Problem Details RFC 7807 on unhandled exceptions
//
// Unit tests for SiesaAgents.API.Middleware.ExceptionHandlingMiddleware
//
// RED Phase: These tests are written BEFORE the middleware is hardened per AC3 requirements.
// They define the expected contract. All tests should pass once the middleware implementation
// satisfies AC3 (Task 5 + Task 6 of Story 1.3).
//
// Test pattern: Arrange / Act / Assert (Given-When-Then)
// Test doubles: DefaultHttpContext with MemoryStream body — no external web app required.

using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // AC3 — Exception path: response must be application/problem+json
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Given a request delegate that throws an unhandled exception,
    /// When the middleware catches it,
    /// Then the Content-Type header is "application/problem+json".
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_SetsContentTypeToApplicationProblemJson()
    {
        // Arrange
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new Exception("internal error"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    /// <summary>
    /// Given a request delegate that throws an unhandled exception,
    /// When the middleware catches it,
    /// Then the HTTP status code is 500 Internal Server Error.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_SetsStatusCode500()
    {
        // Arrange
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new Exception("internal error"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
    }

    /// <summary>
    /// Given a request delegate that throws an unhandled exception,
    /// When the middleware catches it,
    /// Then the response body deserializes to a valid ProblemDetails with status = 500.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ReturnsProblemDetailsWithStatus500()
    {
        // Arrange
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new Exception("internal error"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var problem = await ReadBodyAsProblemDetailsAsync(context);
        Assert.NotNull(problem);
        Assert.Equal(500, problem.Status);
    }

    /// <summary>
    /// Given an unhandled exception is caught by the middleware,
    /// When the response body is serialized,
    /// Then ProblemDetails.Title is present and non-empty (user-facing summary).
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ReturnsProblemDetailsWithNonEmptyTitle()
    {
        // Arrange
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new Exception("internal error"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var problem = await ReadBodyAsProblemDetailsAsync(context);
        Assert.NotNull(problem);
        Assert.NotNull(problem.Title);
        Assert.NotEmpty(problem.Title);
    }

    /// <summary>
    /// Given an exception with a sensitive internal message is thrown,
    /// When ExceptionHandlingMiddleware catches it (NFR6 — no internal detail exposure),
    /// Then ProblemDetails.Detail is null — ex.Message is NEVER included in the response.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ReturnsProblemDetailsWithNullDetail()
    {
        // Arrange — exception carries an internal message that must NOT be exposed
        const string sensitiveMessage = "NpgsqlException: password authentication failed for user postgres";
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new Exception(sensitiveMessage));

        // Act
        await middleware.InvokeAsync(context);

        // Assert — detail must be null, never the exception message
        var problem = await ReadBodyAsProblemDetailsAsync(context);
        Assert.NotNull(problem);
        Assert.Null(problem.Detail);
    }

    /// <summary>
    /// Given an exception is thrown with a stack trace,
    /// When ExceptionHandlingMiddleware serializes the response body,
    /// Then the raw JSON does not contain "StackTrace" or internal type names (NFR6).
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_DoesNotExposeStackTraceInResponseBody()
    {
        // Arrange
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new InvalidOperationException("inner operation failed"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var rawBody = await ReadBodyAsStringAsync(context);
        Assert.DoesNotContain("StackTrace", rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("inner operation failed", rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("InnerException", rawBody, StringComparison.OrdinalIgnoreCase);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3 — Pass-through path: middleware must be transparent when no exception occurs
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Given a request delegate that completes without throwing,
    /// When the middleware processes the request,
    /// Then it calls the next delegate (pass-through — no interference with normal responses).
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenNoExceptionThrown_CallsNextDelegate()
    {
        // Arrange
        var context = CreateContext();
        var nextCalled = false;
        var middleware = new ExceptionHandlingMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.True(nextCalled);
    }

    /// <summary>
    /// Given a request delegate that completes without throwing,
    /// When the middleware processes the request,
    /// Then the response status code is NOT changed to 500 by the middleware.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenNoExceptionThrown_DoesNotSetStatusCode500()
    {
        // Arrange
        var context = CreateContext();
        // Simulate next setting a 200 response
        var middleware = new ExceptionHandlingMiddleware(ctx =>
        {
            ctx.Response.StatusCode = 200;
            return Task.CompletedTask;
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert — middleware must not override the 200 set by next
        Assert.Equal(200, context.Response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private static DefaultHttpContext CreateContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static async Task<ProblemDetails?> ReadBodyAsProblemDetailsAsync(DefaultHttpContext context)
    {
        var raw = await ReadBodyAsStringAsync(context);
        return JsonSerializer.Deserialize<ProblemDetails>(
            raw,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    }

    private static async Task<string> ReadBodyAsStringAsync(DefaultHttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        return await new StreamReader(context.Response.Body).ReadToEndAsync();
    }
}
