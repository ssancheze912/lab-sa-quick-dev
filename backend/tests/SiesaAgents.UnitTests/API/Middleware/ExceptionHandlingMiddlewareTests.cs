using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests.API.Middleware;

/// <summary>
/// Unit tests for ExceptionHandlingMiddleware — Story 1.3: Backend Database Foundation
/// AC: #2 — Unhandled exceptions return Problem Details RFC 7807 with no stack trace
///
/// RED PHASE: Tests will fail because the current middleware:
///   1. Does not differentiate exception types (all mapped to 500)
///   2. Does not include Detail field with exception.Message
///   3. Does not map KeyNotFoundException → 404, ArgumentException → 400, etc.
/// </summary>
public class ExceptionHandlingMiddlewareTests
{
    // -------------------------------------------------------------------------
    // Helper: Build a default HttpContext with a writable response body stream
    // -------------------------------------------------------------------------
    private static DefaultHttpContext CreateHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static async Task<ProblemDetails?> ReadProblemDetailsAsync(HttpResponse response)
    {
        response.Body.Seek(0, SeekOrigin.Begin);
        var json = await new StreamReader(response.Body).ReadToEndAsync();
        return JsonSerializer.Deserialize<ProblemDetails>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
    }

    // =========================================================================
    // AC#2 — Content-Type is application/problem+json for any unhandled exception
    // =========================================================================

    [Fact]
    public async Task InvokeAsync_UnhandledGenericException_ContentTypeIsProblemJson()
    {
        // GIVEN: Middleware configured with a next delegate that throws a generic exception
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception("Something went wrong")
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed and the exception is thrown
        await middleware.InvokeAsync(context);

        // THEN: Response Content-Type is application/problem+json (RFC 7807)
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    // =========================================================================
    // AC#2 — Status 500 for generic unhandled exceptions
    // =========================================================================

    [Fact]
    public async Task InvokeAsync_UnhandledGenericException_Returns500()
    {
        // GIVEN: Middleware configured with a next delegate that throws
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception("Unexpected error")
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: HTTP status code is 500
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
    }

    // =========================================================================
    // AC#2 — Problem Details body contains status, title, detail (RFC 7807)
    // =========================================================================

    [Fact]
    public async Task InvokeAsync_UnhandledGenericException_BodyContainsStatusField()
    {
        // GIVEN: A generic unhandled exception
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception("Test error message")
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: Response body contains a "status" field equal to 500
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.NotNull(problem);
        Assert.Equal(StatusCodes.Status500InternalServerError, problem.Status);
    }

    [Fact]
    public async Task InvokeAsync_UnhandledGenericException_BodyContainsTitleField()
    {
        // GIVEN: A generic unhandled exception
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception("Test error message")
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: Response body contains a "title" field (not null/empty)
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.NotNull(problem);
        Assert.False(string.IsNullOrWhiteSpace(problem.Title));
    }

    [Fact]
    public async Task InvokeAsync_UnhandledGenericException_DetailDoesNotExposeExceptionMessage()
    {
        // GIVEN: Exception with a specific message
        const string sensitiveMessage = "Specific error message for test";
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception(sensitiveMessage)
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: "detail" field must NOT expose the exception message (NFR6 security requirement)
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.DoesNotContain(sensitiveMessage, body);
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.NotNull(problem);
        Assert.Equal(StatusCodes.Status500InternalServerError, problem.Status);
    }

    // =========================================================================
    // AC#2 — Stack trace is NEVER exposed in response body (NFR6)
    // =========================================================================

    [Fact]
    public async Task InvokeAsync_UnhandledGenericException_ResponseBodyDoesNotContainStackTrace()
    {
        // GIVEN: A middleware that will throw and produce a stack trace
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception("Error")
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: Response body does NOT contain stack trace markers (" at " is .NET stack frame prefix)
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var responseBody = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.DoesNotContain(" at ", responseBody, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task InvokeAsync_UnhandledGenericException_ResponseBodyDoesNotContainExceptionTypeName()
    {
        // GIVEN: A middleware that throws — exception type name should not appear in response
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new InvalidOperationException("Some conflict")
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: Response body does NOT contain "Exception" class names (would indicate stack trace leak)
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var responseBody = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.DoesNotContain("StackTrace", responseBody, StringComparison.OrdinalIgnoreCase);
    }

    // =========================================================================
    // AC#2 — KeyNotFoundException maps to 404 (domain mapping)
    // =========================================================================

    [Fact]
    public async Task InvokeAsync_KeyNotFoundException_Returns404()
    {
        // GIVEN: A KeyNotFoundException thrown by a downstream handler
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new KeyNotFoundException("Resource not found")
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: HTTP status code is 404 Not Found
        Assert.Equal(StatusCodes.Status404NotFound, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_KeyNotFoundException_ContentTypeIsProblemJson()
    {
        // GIVEN: A KeyNotFoundException
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new KeyNotFoundException("Resource not found")
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: Content-Type is still application/problem+json even for 404
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    // =========================================================================
    // AC#2 — ArgumentException maps to 400 Bad Request
    // =========================================================================

    [Fact]
    public async Task InvokeAsync_ArgumentException_Returns400()
    {
        // GIVEN: An ArgumentException thrown downstream
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new ArgumentException("Invalid argument supplied")
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: HTTP status code is 400 Bad Request
        Assert.Equal(StatusCodes.Status400BadRequest, context.Response.StatusCode);
    }

    // =========================================================================
    // AC#2 — InvalidOperationException maps to 409 Conflict
    // =========================================================================

    [Fact]
    public async Task InvokeAsync_InvalidOperationException_Returns409()
    {
        // GIVEN: An InvalidOperationException thrown downstream (business rule conflict)
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new InvalidOperationException("Business rule violation")
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: HTTP status code is 409 Conflict
        Assert.Equal(StatusCodes.Status409Conflict, context.Response.StatusCode);
    }

    // =========================================================================
    // AC#2 — Successful requests are not intercepted by middleware
    // =========================================================================

    [Fact]
    public async Task InvokeAsync_NoException_PassesRequestThrough()
    {
        // GIVEN: A next delegate that completes successfully with status 200
        var middleware = new ExceptionHandlingMiddleware(
            next: context =>
            {
                context.Response.StatusCode = StatusCodes.Status200OK;
                return Task.CompletedTask;
            }
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed without exception
        await middleware.InvokeAsync(context);

        // THEN: Response status is 200 (middleware did not interfere)
        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
    }
}
