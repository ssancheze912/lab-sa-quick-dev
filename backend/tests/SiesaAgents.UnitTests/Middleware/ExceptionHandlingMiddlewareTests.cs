// Story 1.3: Backend Database Foundation
// Epic 1: Project Foundation & Application Shell
//
// ATDD Unit Tests — RED Phase (xUnit)
// These tests INTENTIONALLY FAIL until implementation is complete.
//
// Acceptance Criteria covered:
//   AC3 — Unhandled exceptions return Problem Details RFC 7807 (HTTP 500, no stack trace)
//
// Test Structure: Arrange / Act / Assert

using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests.Middleware;

public sealed class ExceptionHandlingMiddlewareTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // AC3 — Test 1: Unhandled exception triggers HTTP 500 with correct Content-Type
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC3 — Returns HTTP 500 when next delegate throws an unhandled exception")]
    public async Task InvokeAsync_WhenNextThrows_Returns500StatusCode()
    {
        // GIVEN: A middleware configured with a next delegate that always throws
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;

        RequestDelegate throwingNext = _ => throw new InvalidOperationException("Simulated unhandled exception");

        var middleware = new ExceptionHandlingMiddleware(throwingNext, logger);
        var context = new DefaultHttpContext();
        context.Response.Body = new System.IO.MemoryStream();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response status code is 500
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
    }

    [Fact(DisplayName = "AC3 — Returns Content-Type application/problem+json for unhandled exceptions")]
    public async Task InvokeAsync_WhenNextThrows_SetsContentTypeToProblemJson()
    {
        // GIVEN: A middleware configured with a throwing next delegate
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;

        RequestDelegate throwingNext = _ => throw new InvalidOperationException("Simulated unhandled exception");

        var middleware = new ExceptionHandlingMiddleware(throwingNext, logger);
        var context = new DefaultHttpContext();
        context.Response.Body = new System.IO.MemoryStream();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Content-Type is application/problem+json (RFC 7807 requirement)
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    [Fact(DisplayName = "AC3 — Returns RFC 7807 body with status 500 and safe title")]
    public async Task InvokeAsync_WhenNextThrows_ReturnsProblemDetailsBodyWithCorrectFields()
    {
        // GIVEN: A middleware configured with a throwing next delegate
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;

        RequestDelegate throwingNext = _ => throw new InvalidOperationException("Simulated unhandled exception");

        var middleware = new ExceptionHandlingMiddleware(throwingNext, logger);
        var context = new DefaultHttpContext();
        context.Response.Body = new System.IO.MemoryStream();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Deserialize the response body as ProblemDetails
        context.Response.Body.Seek(0, System.IO.SeekOrigin.Begin);
        var body = await JsonSerializer.DeserializeAsync<ProblemDetails>(
            context.Response.Body,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(body);
        // Status field must be 500
        Assert.Equal(StatusCodes.Status500InternalServerError, body!.Status);
        // Title must be the safe generic message — never the raw exception message
        Assert.Equal("An unexpected error occurred.", body.Title);
    }

    [Fact(DisplayName = "AC3 — Detail field is null — never exposes exception message or stack trace")]
    public async Task InvokeAsync_WhenNextThrows_DetailFieldIsNull()
    {
        // GIVEN: A middleware configured to never expose internal exception details
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;

        const string internalMessage = "SECRET_DATABASE_PASSWORD_LEAK_TEST_12345";
        RequestDelegate throwingNext = _ => throw new InvalidOperationException(internalMessage);

        var middleware = new ExceptionHandlingMiddleware(throwingNext, logger);
        var context = new DefaultHttpContext();
        context.Response.Body = new System.IO.MemoryStream();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: The response body does NOT contain the internal exception message
        context.Response.Body.Seek(0, System.IO.SeekOrigin.Begin);
        var body = await JsonSerializer.DeserializeAsync<ProblemDetails>(
            context.Response.Body,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(body);
        Assert.Null(body!.Detail);

        // AND: The raw body text does not contain the internal message
        context.Response.Body.Seek(0, System.IO.SeekOrigin.Begin);
        using var reader = new System.IO.StreamReader(context.Response.Body);
        var rawBody = await reader.ReadToEndAsync();
        Assert.DoesNotContain(internalMessage, rawBody, StringComparison.OrdinalIgnoreCase);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3 — Test 2: Happy path — no exception → middleware calls next and passes through
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC3 — Calls next delegate and passes through when no exception is thrown")]
    public async Task InvokeAsync_WhenNextSucceeds_CallsNextWithoutModification()
    {
        // GIVEN: A middleware configured with a next delegate that succeeds
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;

        var nextWasCalled = false;
        RequestDelegate successNext = ctx =>
        {
            nextWasCalled = true;
            ctx.Response.StatusCode = StatusCodes.Status200OK;
            return Task.CompletedTask;
        };

        var middleware = new ExceptionHandlingMiddleware(successNext, logger);
        var context = new DefaultHttpContext();
        context.Response.Body = new System.IO.MemoryStream();

        // WHEN: The middleware processes a request that succeeds
        await middleware.InvokeAsync(context);

        // THEN: Next was called
        Assert.True(nextWasCalled);
        // AND: Response status is untouched (200 set by next delegate)
        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
    }

    [Fact(DisplayName = "AC3 — Does not override response when no exception is thrown")]
    public async Task InvokeAsync_WhenNextSucceeds_DoesNotOverrideResponseStatus()
    {
        // GIVEN: A middleware and a next delegate that sets 204 No Content
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;

        RequestDelegate noContentNext = ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status204NoContent;
            return Task.CompletedTask;
        };

        var middleware = new ExceptionHandlingMiddleware(noContentNext, logger);
        var context = new DefaultHttpContext();
        context.Response.Body = new System.IO.MemoryStream();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: The status code remains 204 — middleware did not interfere
        Assert.Equal(StatusCodes.Status204NoContent, context.Response.StatusCode);
    }
}
