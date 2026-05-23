// Story 1.3: Backend Database Foundation
// AC3 — ExceptionHandlingMiddleware — Edge Cases: Exception Type Variations
//
// Covers different exception types thrown by the next delegate:
//   - NullReferenceException, UnauthorizedAccessException
//   - AggregateException (async task failure)
//   - OperationCanceledException
//   - Exception with empty message
//   - Exception with very long message (no leak)
//
// Test pattern: Arrange / Act / Assert (Given-When-Then)

using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests.Middleware;

public class ExceptionHandlingMiddlewareEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Edge: different exception types — contract must be identical
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Given a NullReferenceException (most common runtime crash),
    /// When ExceptionHandlingMiddleware catches it,
    /// Then the response is still 500 problem+json with null detail.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenNullReferenceExceptionThrown_Returns500ProblemJson()
    {
        // Arrange
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new NullReferenceException("Object reference not set to an instance of an object."));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
        Assert.Equal("application/problem+json", context.Response.ContentType);
        var problem = await ReadBodyAsProblemDetailsAsync(context);
        Assert.NotNull(problem);
        Assert.Equal(500, problem.Status);
        Assert.Null(problem.Detail);
    }

    /// <summary>
    /// Given an UnauthorizedAccessException (e.g., file system permission denied),
    /// When ExceptionHandlingMiddleware catches it,
    /// Then detail is null — the access denial reason is NOT exposed.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenUnauthorizedAccessExceptionThrown_DoesNotExposeReason()
    {
        // Arrange
        const string sensitiveReason = "Access to path /etc/secrets is denied";
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new UnauthorizedAccessException(sensitiveReason));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var rawBody = await ReadBodyAsStringAsync(context);
        Assert.DoesNotContain(sensitiveReason, rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("UnauthorizedAccess", rawBody, StringComparison.OrdinalIgnoreCase);
        var problem = await ReadBodyAsProblemDetailsAsync(context);
        Assert.Null(problem!.Detail);
    }

    /// <summary>
    /// Given an AggregateException with multiple inner exceptions (async task failure),
    /// When ExceptionHandlingMiddleware catches it,
    /// Then inner exception messages are NOT exposed in the response body.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenAggregateExceptionThrown_DoesNotExposeInnerExceptionDetails()
    {
        // Arrange
        const string innerMsg1 = "Database connection timeout to 192.168.1.100";
        const string innerMsg2 = "Retry limit exceeded after 3 attempts";
        var aggregate = new AggregateException(
            new Exception(innerMsg1),
            new Exception(innerMsg2));

        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(_ => throw aggregate);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var rawBody = await ReadBodyAsStringAsync(context);
        Assert.DoesNotContain(innerMsg1, rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(innerMsg2, rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("AggregateException", rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
    }

    /// <summary>
    /// Given an OperationCanceledException (e.g., CancellationToken triggered),
    /// When ExceptionHandlingMiddleware catches it,
    /// Then it returns 500 problem+json (OperationCanceledException IS-A Exception).
    /// NOTE: In production, a more specific handler may want to return 499/503,
    /// but the current middleware catch(Exception) covers it with a 500 response.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenOperationCanceledExceptionThrown_Returns500ProblemJson()
    {
        // Arrange
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new OperationCanceledException("Request was cancelled"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
        Assert.Equal("application/problem+json", context.Response.ContentType);
        var problem = await ReadBodyAsProblemDetailsAsync(context);
        Assert.Null(problem!.Detail);
    }

    /// <summary>
    /// Given an exception with an empty message string (""),
    /// When ExceptionHandlingMiddleware catches it,
    /// Then a valid ProblemDetails is still returned (title from middleware, not from ex.Message).
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenExceptionHasEmptyMessage_StillReturnsValidProblemDetails()
    {
        // Arrange
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(_ => throw new Exception(string.Empty));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var problem = await ReadBodyAsProblemDetailsAsync(context);
        Assert.NotNull(problem);
        Assert.Equal(500, problem.Status);
        Assert.NotNull(problem.Title);
        Assert.NotEmpty(problem.Title!);
        Assert.Null(problem.Detail);
    }

    /// <summary>
    /// Given an exception with a very long internal message (e.g., serialized inner state),
    /// When ExceptionHandlingMiddleware catches it,
    /// Then the long message does NOT appear in the response body.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenExceptionHasVeryLongMessage_DoesNotLeakLongMessageInResponse()
    {
        // Arrange
        var longMessage = new string('X', 10_000) + "SENSITIVE_TOKEN_abc123";
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(_ => throw new Exception(longMessage));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var rawBody = await ReadBodyAsStringAsync(context);
        Assert.DoesNotContain("SENSITIVE_TOKEN_abc123", rawBody, StringComparison.Ordinal);
        Assert.True(rawBody.Length < 1024,
            $"Response body is unexpectedly large ({rawBody.Length} chars): possible exception message leak.");
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
