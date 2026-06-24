using System.IO;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

// NOTE: RED PHASE — These tests will FAIL until ExceptionHandlingMiddleware is implemented.
// Story 1.3: Backend Database Foundation — AC3 and AC4

namespace SiesaAgents.UnitTests.API.Middleware;

/// <summary>
/// ATDD Unit Tests for ExceptionHandlingMiddleware.
/// Verifies Problem Details RFC 7807 responses and HTTP status code mapping.
/// All tests are in RED phase — ExceptionHandlingMiddleware does not yet exist.
/// </summary>
public class ExceptionHandlingMiddlewareTests
{
    // ──────────────────────────────────────────────────────────────────────────
    // AC3: Unhandled exceptions → Problem Details RFC 7807 (status, title, detail)
    //      No stack trace or internal exception message is exposed.
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenUnhandledExceptionThrown_Returns500StatusCode()
    {
        // GIVEN: ExceptionHandlingMiddleware is configured
        var logger = NullLogger<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>.Instance;
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(logger);
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new Exception("Unexpected failure");

        // WHEN: An unhandled exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: HTTP 500 is returned
        Assert.Equal(500, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenUnhandledExceptionThrown_ReturnsApplicationProblemJsonContentType()
    {
        // GIVEN: ExceptionHandlingMiddleware is configured
        var logger = NullLogger<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>.Instance;
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(logger);
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new Exception("Unexpected failure");

        // WHEN: An unhandled exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: Content-Type is application/problem+json (RFC 7807)
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    [Fact]
    public async Task InvokeAsync_WhenUnhandledExceptionThrown_ResponseBodyContainsProblemDetailsStatusField()
    {
        // GIVEN: ExceptionHandlingMiddleware is configured
        var logger = NullLogger<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>.Instance;
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(logger);
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new Exception("Unexpected failure");

        // WHEN: An unhandled exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: Response body contains the 'status' field (RFC 7807 required field)
        var body = await ReadResponseBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body);
        Assert.NotNull(problem);
        Assert.Equal(500, problem!.Status);
    }

    [Fact]
    public async Task InvokeAsync_WhenUnhandledExceptionThrown_ResponseBodyContainsProblemDetailsTitleField()
    {
        // GIVEN: ExceptionHandlingMiddleware is configured
        var logger = NullLogger<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>.Instance;
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(logger);
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new Exception("Unexpected failure");

        // WHEN: An unhandled exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: Response body contains non-empty 'title' field (RFC 7807 required field)
        var body = await ReadResponseBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body);
        Assert.NotNull(problem);
        Assert.False(string.IsNullOrWhiteSpace(problem!.Title));
    }

    [Fact]
    public async Task InvokeAsync_WhenUnhandledExceptionThrown_ResponseBodyContainsProblemDetailsDetailField()
    {
        // GIVEN: ExceptionHandlingMiddleware is configured
        var logger = NullLogger<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>.Instance;
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(logger);
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new Exception("Internal details that must not leak");

        // WHEN: An unhandled exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: Response body contains non-empty 'detail' field (RFC 7807 required field)
        var body = await ReadResponseBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body);
        Assert.NotNull(problem);
        Assert.False(string.IsNullOrWhiteSpace(problem!.Detail));
    }

    [Fact]
    public async Task InvokeAsync_WhenUnhandledExceptionThrown_ResponseBodyDoesNotContainStackTrace()
    {
        // GIVEN: ExceptionHandlingMiddleware is configured
        // NFR6: No stack trace or internal exception message is exposed
        var logger = NullLogger<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>.Instance;
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(logger);
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new Exception("Secret internal message");

        // WHEN: An unhandled exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: The response body does NOT contain stack trace information (NFR6)
        var body = await ReadResponseBodyAsync(context);
        Assert.DoesNotContain("StackTrace", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("   at ", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task InvokeAsync_WhenUnhandledExceptionThrown_DetailDoesNotExposeInternalExceptionMessage()
    {
        // GIVEN: ExceptionHandlingMiddleware is configured
        // NFR6: Internal exception messages must NOT be exposed in production
        var logger = NullLogger<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>.Instance;
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(logger);
        var context = CreateHttpContext();
        const string internalMessage = "SuperSecretDatabasePassword123";
        RequestDelegate next = _ => throw new Exception(internalMessage);

        // WHEN: An unhandled exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: The raw internal exception message is NOT leaked in the response body
        var body = await ReadResponseBodyAsync(context);
        Assert.DoesNotContain(internalMessage, body);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC4: Domain-level validation failures → correct HTTP status code (404, 409, 400)
    //      Never returns 500 for known domain exceptions.
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenKeyNotFoundExceptionThrown_Returns404StatusCode()
    {
        // GIVEN: ExceptionHandlingMiddleware is configured with KeyNotFoundException → 404 mapping
        var logger = NullLogger<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>.Instance;
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(logger);
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new KeyNotFoundException("Resource not found");

        // WHEN: A KeyNotFoundException propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: HTTP 404 is returned (never 500)
        Assert.Equal(404, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenKeyNotFoundExceptionThrown_ReturnsNotFoundProblemDetailsBody()
    {
        // GIVEN: ExceptionHandlingMiddleware is configured
        var logger = NullLogger<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>.Instance;
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(logger);
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new KeyNotFoundException("Resource not found");

        // WHEN: A KeyNotFoundException propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: Response body is Problem Details with status 404
        var body = await ReadResponseBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body);
        Assert.NotNull(problem);
        Assert.Equal(404, problem!.Status);
    }

    [Fact]
    public async Task InvokeAsync_WhenArgumentExceptionThrown_Returns400StatusCode()
    {
        // GIVEN: ExceptionHandlingMiddleware is configured with ArgumentException → 400 mapping
        var logger = NullLogger<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>.Instance;
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(logger);
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new ArgumentException("Invalid argument provided");

        // WHEN: An ArgumentException propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: HTTP 400 is returned (never 500)
        Assert.Equal(400, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenArgumentExceptionThrown_ReturnsBadRequestProblemDetailsBody()
    {
        // GIVEN: ExceptionHandlingMiddleware is configured
        var logger = NullLogger<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>.Instance;
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(logger);
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new ArgumentException("Invalid argument provided");

        // WHEN: An ArgumentException propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: Response body is Problem Details with status 400
        var body = await ReadResponseBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body);
        Assert.NotNull(problem);
        Assert.Equal(400, problem!.Status);
    }

    [Fact]
    public async Task InvokeAsync_WhenNoExceptionThrown_PassesThroughToNextMiddleware()
    {
        // GIVEN: ExceptionHandlingMiddleware is configured
        var logger = NullLogger<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>.Instance;
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(logger);
        var context = CreateHttpContext();
        var nextCalled = false;
        RequestDelegate next = _ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        // WHEN: No exception occurs
        await middleware.InvokeAsync(context, next);

        // THEN: The next middleware in the pipeline is called (happy path)
        Assert.True(nextCalled);
    }

    [Fact]
    public async Task InvokeAsync_WhenNoExceptionThrown_DoesNotAlterResponseStatusCode()
    {
        // GIVEN: ExceptionHandlingMiddleware is configured
        var logger = NullLogger<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>.Instance;
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(logger);
        var context = CreateHttpContext();
        context.Response.StatusCode = 200;
        RequestDelegate next = _ => Task.CompletedTask;

        // WHEN: No exception occurs
        await middleware.InvokeAsync(context, next);

        // THEN: The response status code is unchanged (middleware is transparent on success)
        Assert.Equal(200, context.Response.StatusCode);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    private static DefaultHttpContext CreateHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static async Task<string> ReadResponseBodyAsync(HttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        return await reader.ReadToEndAsync();
    }
}
