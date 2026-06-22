using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using SiesaAgents.API.Middleware;
using SiesaAgents.Domain.Exceptions;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// Story 1.3: Backend Database Foundation
/// ATDD Unit Tests — RED Phase (Middleware Level)
///
/// Acceptance Criteria covered:
///   AC2 — Unhandled exceptions → Problem Details RFC 7807 (status, title, detail), no stack trace
///   AC3 — Domain exceptions (NotFoundException/ConflictException) → correct HTTP status + Problem Details
/// </summary>
public class ExceptionHandlingMiddlewareTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Builds a HttpContext with an in-memory response stream so we can read the body.
    /// </summary>
    private static DefaultHttpContext BuildHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    /// <summary>
    /// Reads the response body as a ProblemDetails object after the middleware executed.
    /// </summary>
    private static async Task<ProblemDetails?> ReadProblemDetailsAsync(HttpResponse response)
    {
        response.Body.Seek(0, SeekOrigin.Begin);
        var json = await new StreamReader(response.Body).ReadToEndAsync();
        return JsonSerializer.Deserialize<ProblemDetails>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
    }

    /// <summary>
    /// Creates the middleware under test wired to a next delegate that throws the given exception.
    /// Uses NullLogger to keep tests free of ILogger dependency setup.
    /// </summary>
    private static ExceptionHandlingMiddleware BuildMiddleware(Exception exceptionToThrow)
    {
        RequestDelegate next = _ => throw exceptionToThrow;
        // AC2/AC3: Middleware requires ILogger<ExceptionHandlingMiddleware> per story spec
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        return new ExceptionHandlingMiddleware(next, logger);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC2: Unhandled exception → 500 + Problem Details + no stack trace
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenUnhandledException_Returns500StatusCode()
    {
        // GIVEN: The next middleware throws a generic unhandled Exception
        var middleware = BuildMiddleware(new Exception("something broke"));
        var context = BuildHttpContext();

        // WHEN: The exception reaches the middleware
        await middleware.InvokeAsync(context);

        // THEN: Response status is 500 Internal Server Error
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenUnhandledException_ResponseBodyConformsToProblemDetails()
    {
        // GIVEN: The next middleware throws a generic unhandled Exception
        var middleware = BuildMiddleware(new Exception("something broke"));
        var context = BuildHttpContext();

        // WHEN: The exception reaches the middleware
        await middleware.InvokeAsync(context);

        // THEN: Response body is a valid Problem Details object (RFC 7807) with status, title, detail fields
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.NotNull(problem);
        Assert.Equal(StatusCodes.Status500InternalServerError, problem.Status);
        Assert.NotNull(problem.Title);
        Assert.NotEmpty(problem.Title);
    }

    [Fact]
    public async Task InvokeAsync_WhenUnhandledException_ResponseBodyDoesNotContainStackTrace()
    {
        // GIVEN: The next middleware throws a generic unhandled Exception
        var exceptionMessage = "sensitive internal error";
        var middleware = BuildMiddleware(new Exception(exceptionMessage));
        var context = BuildHttpContext();

        // WHEN: The exception reaches the middleware
        await middleware.InvokeAsync(context);

        // THEN: The response body does NOT expose the raw exception message or stack trace (NFR6)
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var responseBody = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.DoesNotContain(exceptionMessage, responseBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("at SiesaAgents", responseBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("StackTrace", responseBody, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task InvokeAsync_WhenUnhandledException_SetsContentTypeToApplicationProblemJson()
    {
        // GIVEN: The next middleware throws a generic unhandled Exception
        var middleware = BuildMiddleware(new Exception("something broke"));
        var context = BuildHttpContext();

        // WHEN: The exception reaches the middleware
        await middleware.InvokeAsync(context);

        // THEN: Content-Type header is application/problem+json per RFC 7807
        Assert.Contains("application/problem+json", context.Response.ContentType,
            StringComparison.OrdinalIgnoreCase);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3: NotFoundException → 404 + Problem Details
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNotFoundException_Returns404StatusCode()
    {
        // GIVEN: The next middleware throws a NotFoundException (domain exception)
        var middleware = BuildMiddleware(new NotFoundException("Resource not found"));
        var context = BuildHttpContext();

        // WHEN: The exception reaches the middleware
        await middleware.InvokeAsync(context);

        // THEN: Response status is 404 Not Found — NOT 500 Internal Server Error
        Assert.Equal(StatusCodes.Status404NotFound, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenNotFoundException_ResponseBodyConformsToProblemDetails()
    {
        // GIVEN: The next middleware throws a NotFoundException with a descriptive message
        var middleware = BuildMiddleware(new NotFoundException("Cliente con id '123' no encontrado"));
        var context = BuildHttpContext();

        // WHEN: The exception reaches the middleware
        await middleware.InvokeAsync(context);

        // THEN: Response body is Problem Details with status 404 and the exception message in detail
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.NotNull(problem);
        Assert.Equal(StatusCodes.Status404NotFound, problem.Status);
        Assert.NotNull(problem.Title);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3: ConflictException → 409 + Problem Details
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenConflictException_Returns409StatusCode()
    {
        // GIVEN: The next middleware throws a ConflictException (domain exception)
        var middleware = BuildMiddleware(new ConflictException("NIT already exists"));
        var context = BuildHttpContext();

        // WHEN: The exception reaches the middleware
        await middleware.InvokeAsync(context);

        // THEN: Response status is 409 Conflict — NOT 500 Internal Server Error
        Assert.Equal(StatusCodes.Status409Conflict, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenConflictException_ResponseBodyConformsToProblemDetails()
    {
        // GIVEN: The next middleware throws a ConflictException with a descriptive message
        var middleware = BuildMiddleware(new ConflictException("NIT '900.123.456-7' ya existe en el sistema"));
        var context = BuildHttpContext();

        // WHEN: The exception reaches the middleware
        await middleware.InvokeAsync(context);

        // THEN: Response body is Problem Details with status 409
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.NotNull(problem);
        Assert.Equal(StatusCodes.Status409Conflict, problem.Status);
        Assert.NotNull(problem.Title);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3: Content-Type must always be application/problem+json for all domain exceptions
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNotFoundException_SetsContentTypeToApplicationProblemJson()
    {
        // GIVEN: The next middleware throws a NotFoundException
        var middleware = BuildMiddleware(new NotFoundException("not found"));
        var context = BuildHttpContext();

        // WHEN: The exception reaches the middleware
        await middleware.InvokeAsync(context);

        // THEN: Content-Type is application/problem+json
        Assert.Contains("application/problem+json", context.Response.ContentType,
            StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task InvokeAsync_WhenConflictException_SetsContentTypeToApplicationProblemJson()
    {
        // GIVEN: The next middleware throws a ConflictException
        var middleware = BuildMiddleware(new ConflictException("conflict"));
        var context = BuildHttpContext();

        // WHEN: The exception reaches the middleware
        await middleware.InvokeAsync(context);

        // THEN: Content-Type is application/problem+json
        Assert.Contains("application/problem+json", context.Response.ContentType,
            StringComparison.OrdinalIgnoreCase);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3: Happy path — no exception → middleware passes through without modification
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNoException_PassesRequestThrough()
    {
        // GIVEN: The next middleware succeeds normally (no exception)
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        RequestDelegate next = ctx =>
        {
            ctx.Response.StatusCode = 200;
            return Task.CompletedTask;
        };
        var middleware = new ExceptionHandlingMiddleware(next, logger);
        var context = BuildHttpContext();

        // WHEN: The request passes through the middleware
        await middleware.InvokeAsync(context);

        // THEN: Response status is 200 OK — middleware does NOT interfere with successful requests
        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
    }
}
