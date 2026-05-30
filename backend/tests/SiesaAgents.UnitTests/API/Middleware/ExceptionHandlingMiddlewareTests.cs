// Story 1.3 - Backend Database Foundation
// ATDD Unit Tests: ExceptionHandlingMiddleware
// Status: RED - Tests define the REQUIRED behavior per AC#3.
//         Some tests may compile-fail until the middleware constructor signature
//         is adjusted to match the implementation required by the story.
// AC covered: AC#3 (Problem Details RFC 7807 response for unhandled exceptions, NFR6)

using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using SiesaAgents.API.Middleware;
using Xunit;

namespace SiesaAgents.UnitTests.API.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    // -------------------------------------------------------------------------
    // Helper: build a DefaultHttpContext with a real writable response body
    // -------------------------------------------------------------------------
    private static HttpContext BuildHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static async Task<string> ReadResponseBodyAsync(HttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        return await new StreamReader(context.Response.Body, Encoding.UTF8).ReadToEndAsync();
    }

    // =========================================================================
    // AC#3 — Unhandled exception → HTTP 500
    // =========================================================================

    [Fact]
    public async Task GivenUnhandledException_WhenMiddlewareInvoked_ThenStatusCodeIs500()
    {
        // GIVEN: Next delegate throws an unhandled generic exception
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception("boom"),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = BuildHttpContext();

        // WHEN: Middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: HTTP status code must be 500 Internal Server Error
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
    }

    [Fact]
    public async Task GivenUnhandledException_WhenMiddlewareInvoked_ThenContentTypeIsProblemJson()
    {
        // GIVEN: Next delegate throws an unhandled exception
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception("any error"),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = BuildHttpContext();

        // WHEN: Middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Content-Type must be application/problem+json (RFC 7807 requirement)
        Assert.StartsWith("application/problem+json", context.Response.ContentType);
    }

    [Fact]
    public async Task GivenUnhandledException_WhenMiddlewareInvoked_ThenBodyContainsStatusField()
    {
        // GIVEN: Next delegate throws an unhandled exception
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new InvalidOperationException("some state conflict"),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = BuildHttpContext();

        // WHEN: Middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: RFC 7807 body must contain a 'status' field
        var body = await ReadResponseBodyAsync(context);
        Assert.Contains("\"status\"", body);
    }

    [Fact]
    public async Task GivenUnhandledException_WhenMiddlewareInvoked_ThenBodyContainsTitleField()
    {
        // GIVEN: Next delegate throws an unhandled exception
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception("some internal error"),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = BuildHttpContext();

        // WHEN: Middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: RFC 7807 body must contain a 'title' field
        var body = await ReadResponseBodyAsync(context);
        Assert.Contains("\"title\"", body);
    }

    [Fact]
    public async Task GivenUnhandledException_WhenMiddlewareInvoked_ThenDetailFieldIsNullOrAbsent()
    {
        // GIVEN: Next delegate throws an exception with an internal message
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception("SECRET_CONNECTION_STRING_PASSWORD_123"),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = BuildHttpContext();

        // WHEN: Middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: The 'detail' field must be null — exception message must NOT be exposed (NFR6)
        var body = await ReadResponseBodyAsync(context);
        using var doc = JsonDocument.Parse(body);
        if (doc.RootElement.TryGetProperty("detail", out var detailElement))
        {
            Assert.Equal(JsonValueKind.Null, detailElement.ValueKind);
        }
        // If 'detail' is absent entirely, that also satisfies the requirement
    }

    [Fact]
    public async Task GivenUnhandledException_WhenMiddlewareInvoked_ThenBodyDoesNotExposeExceptionMessage()
    {
        // GIVEN: Next delegate throws an exception with a sensitive message
        const string sensitiveMessage = "SECRET_DB_PASSWORD_EXPOSED";
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception(sensitiveMessage),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = BuildHttpContext();

        // WHEN: Middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Sensitive message must NOT appear in the response body (NFR6)
        var body = await ReadResponseBodyAsync(context);
        Assert.DoesNotContain(sensitiveMessage, body);
    }

    [Fact]
    public async Task GivenUnhandledException_WhenMiddlewareInvoked_ThenBodyDoesNotContainStackTrace()
    {
        // GIVEN: Next delegate throws an exception
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception("boom"),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = BuildHttpContext();

        // WHEN: Middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Stack trace must NOT be exposed in the response body (NFR6)
        var body = await ReadResponseBodyAsync(context);
        Assert.DoesNotContain("StackTrace", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("   at ", body); // stack frame pattern
    }

    [Fact]
    public async Task GivenUnhandledException_WhenMiddlewareInvoked_ThenStatusValueInBodyIs500()
    {
        // GIVEN: Next delegate throws a generic unhandled exception
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception("boom"),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = BuildHttpContext();

        // WHEN: Middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: The 'status' field value in the JSON body must equal 500
        var body = await ReadResponseBodyAsync(context);
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("status", out var statusElement));
        Assert.Equal(500, statusElement.GetInt32());
    }

    [Fact]
    public async Task GivenUnhandledException_WhenMiddlewareInvoked_ThenTitleIsNotEmpty()
    {
        // GIVEN: Next delegate throws an unhandled exception
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception("boom"),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = BuildHttpContext();

        // WHEN: Middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: The 'title' field must be a non-empty string describing the error
        var body = await ReadResponseBodyAsync(context);
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("title", out var titleElement));
        Assert.False(string.IsNullOrWhiteSpace(titleElement.GetString()));
    }

    // =========================================================================
    // AC#3 — Happy path: no exception → response passes through unchanged
    // =========================================================================

    [Fact]
    public async Task GivenNoException_WhenMiddlewareInvoked_ThenResponseStatusCodeIsNotChanged()
    {
        // GIVEN: Next delegate completes successfully with 200
        var middleware = new ExceptionHandlingMiddleware(
            next: ctx =>
            {
                ctx.Response.StatusCode = StatusCodes.Status200OK;
                return Task.CompletedTask;
            },
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = BuildHttpContext();

        // WHEN: Middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Status code must be the one set by the next delegate, not 500
        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
    }

    [Fact]
    public async Task GivenNoException_WhenMiddlewareInvoked_ThenContentTypeIsNotOverriddenToProblemJson()
    {
        // GIVEN: Next delegate sets application/json content type
        var middleware = new ExceptionHandlingMiddleware(
            next: ctx =>
            {
                ctx.Response.ContentType = "application/json";
                ctx.Response.StatusCode = StatusCodes.Status200OK;
                return Task.CompletedTask;
            },
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = BuildHttpContext();

        // WHEN: Middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Middleware must not change content type when no exception occurs
        Assert.Equal("application/json", context.Response.ContentType);
    }
}
