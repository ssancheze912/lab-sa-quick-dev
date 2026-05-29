/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Unit Tests — RED Phase (xUnit — Middleware)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC2 — Unhandled exceptions return Problem Details RFC 7807 (status, title, detail)
 *          with no stack traces exposed (NFR6):
 *            - Generic unhandled exception    → 500 Problem Details (no detail / stack trace)
 *            - NotFoundException              → 404 Problem Details
 *            - ValidationException            → 400 Problem Details
 *            - Content-Type: application/problem+json on all paths
 *
 * Pattern: Arrange / Act / Assert (mirrors Given-When-Then from AC2)
 * Framework: xUnit + DefaultHttpContext + MemoryStream response body
 */

using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using SiesaAgents.API.Middleware;
using SiesaAgents.Domain.Exceptions;
using Xunit;

namespace SiesaAgents.UnitTests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    // ---------------------------------------------------------------------------
    // AC2 — Generic unhandled exception → 500 Problem Details
    // ---------------------------------------------------------------------------

    /// <summary>
    /// Given an unhandled exception occurs in the backend,
    /// When the error reaches the middleware,
    /// Then the response status code is 500.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_GenericException_Returns500StatusCode()
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new System.Exception("Internal failure"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
    }

    /// <summary>
    /// Given an unhandled exception occurs in the backend,
    /// When the error reaches the middleware,
    /// Then Content-Type is application/problem+json (RFC 7807).
    /// </summary>
    [Fact]
    public async Task InvokeAsync_GenericException_SetsContentTypeApplicationProblemJson()
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new System.Exception("Internal failure"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Contains("application/problem+json", context.Response.ContentType);
    }

    /// <summary>
    /// Given an unhandled exception occurs in the backend,
    /// When the error reaches the middleware,
    /// Then the JSON body contains status: 500.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_GenericException_BodyContainsStatus500()
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new System.Exception("Internal failure"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var body = await ReadBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body, JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal(500, problem!.Status);
    }

    /// <summary>
    /// Given an unhandled exception occurs in the backend,
    /// When the error reaches the middleware,
    /// Then the JSON body contains a non-empty title.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_GenericException_BodyContainsNonEmptyTitle()
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new System.Exception("Internal failure"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var body = await ReadBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body, JsonOptions);
        Assert.NotNull(problem);
        Assert.False(string.IsNullOrWhiteSpace(problem!.Title));
    }

    /// <summary>
    /// Given an unhandled exception occurs in the backend (NFR6),
    /// When the error reaches the middleware,
    /// Then the response body does NOT contain a stack trace.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_GenericException_BodyDoesNotContainStackTrace()
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new System.Exception("Internal failure"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert — NFR6: no stack trace exposed to caller
        var bodyText = await ReadBodyAsync(context);
        Assert.DoesNotContain("   at ", bodyText);
        Assert.DoesNotContain("SiesaAgents", bodyText.Contains("at SiesaAgents") ? bodyText : string.Empty);
    }

    /// <summary>
    /// Given an unhandled exception occurs in the backend (NFR6),
    /// When the error reaches the middleware,
    /// Then the detail field in the Problem Details body is null.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_GenericException_DetailFieldIsNull()
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new System.Exception("Sensitive internal message"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert — internal exception message must NOT leak to client
        var body = await ReadBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body, JsonOptions);
        Assert.NotNull(problem);
        Assert.Null(problem!.Detail);
    }

    // ---------------------------------------------------------------------------
    // AC2 — NotFoundException → 404 Problem Details
    // ---------------------------------------------------------------------------

    /// <summary>
    /// Given an endpoint throws NotFoundException,
    /// When the error reaches the middleware,
    /// Then the response status code is 404.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_NotFoundException_Returns404StatusCode()
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new NotFoundException("Resource", Guid.NewGuid()));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(StatusCodes.Status404NotFound, context.Response.StatusCode);
    }

    /// <summary>
    /// Given an endpoint throws NotFoundException,
    /// When the error reaches the middleware,
    /// Then Content-Type is application/problem+json.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_NotFoundException_SetsContentTypeApplicationProblemJson()
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new NotFoundException("Resource not found"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Contains("application/problem+json", context.Response.ContentType);
    }

    /// <summary>
    /// Given an endpoint throws NotFoundException,
    /// When the error reaches the middleware,
    /// Then the JSON body contains status: 404.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_NotFoundException_BodyContainsStatus404()
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new NotFoundException("Entity not found"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var body = await ReadBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body, JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal(404, problem!.Status);
    }

    /// <summary>
    /// Given an endpoint throws NotFoundException (NFR6),
    /// When the error reaches the middleware,
    /// Then the response body does NOT contain a stack trace.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_NotFoundException_BodyDoesNotContainStackTrace()
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new NotFoundException("Entity not found"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var bodyText = await ReadBodyAsync(context);
        Assert.DoesNotContain("   at ", bodyText);
    }

    // ---------------------------------------------------------------------------
    // AC2 — ValidationException → 400 Problem Details
    // ---------------------------------------------------------------------------

    /// <summary>
    /// Given an endpoint throws ValidationException,
    /// When the error reaches the middleware,
    /// Then the response status code is 400.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_ValidationException_Returns400StatusCode()
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new ValidationException("Validation failed"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(StatusCodes.Status400BadRequest, context.Response.StatusCode);
    }

    /// <summary>
    /// Given an endpoint throws ValidationException,
    /// When the error reaches the middleware,
    /// Then Content-Type is application/problem+json.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_ValidationException_SetsContentTypeApplicationProblemJson()
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new ValidationException("Invalid input"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Contains("application/problem+json", context.Response.ContentType);
    }

    /// <summary>
    /// Given an endpoint throws ValidationException,
    /// When the error reaches the middleware,
    /// Then the JSON body contains status: 400.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_ValidationException_BodyContainsStatus400()
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new ValidationException("Invalid input"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var body = await ReadBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body, JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal(400, problem!.Status);
    }

    /// <summary>
    /// Given an endpoint throws ValidationException (NFR6),
    /// When the error reaches the middleware,
    /// Then the response body does NOT contain a stack trace.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_ValidationException_BodyDoesNotContainStackTrace()
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new ValidationException("Invalid input"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var bodyText = await ReadBodyAsync(context);
        Assert.DoesNotContain("   at ", bodyText);
    }

    // ---------------------------------------------------------------------------
    // AC2 — Happy path (no exception) — middleware passes through
    // ---------------------------------------------------------------------------

    /// <summary>
    /// Given no exception occurs in the pipeline,
    /// When a request is processed normally,
    /// Then the middleware does not alter the response status.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_NoException_DoesNotAlterResponse()
    {
        // Arrange
        var context = BuildHttpContext();
        // Next delegate sets 200 OK without throwing
        var middleware = BuildMiddleware(ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status200OK;
            return Task.CompletedTask;
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private static DefaultHttpContext BuildHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static ExceptionHandlingMiddleware BuildMiddleware(Func<HttpContext, Task> next)
    {
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        return new ExceptionHandlingMiddleware(new RequestDelegate(next), logger);
    }

    private static async Task<string> ReadBodyAsync(DefaultHttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        return await reader.ReadToEndAsync();
    }
}
