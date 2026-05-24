/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (Unit Level)
 * These tests are intentionally FAILING until implementation is verified/complete.
 *
 * Acceptance Criteria covered:
 *   AC3 — Unhandled exception returns RFC 7807 Problem Details with Content-Type: application/problem+json
 *          and no stack traces exposed (NFR6). Middleware must be registered FIRST in the pipeline.
 *
 * Test Framework: xUnit
 * Test Pattern: Arrange / Act / Assert (maps to Given / When / Then)
 * Dependency: Microsoft.AspNetCore.TestHost (WebApplicationFactory pattern via DefaultHttpContext)
 */

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Xunit;

// NOTE: These tests will fail to COMPILE until:
//   1. SiesaAgents.API project reference is added to SiesaAgents.UnitTests.csproj
//   2. Microsoft.AspNetCore.App framework reference is available (implicit in net10.0 SDK)

namespace SiesaAgents.UnitTests.API;

public class ExceptionHandlingMiddlewareTests
{
    /// <summary>
    /// AC3: When an unhandled exception reaches the middleware, the response StatusCode must be 500.
    /// RED: Fails until ExceptionHandlingMiddleware is implemented and verifiable.
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenExceptionThrown_ShouldSetStatusCode500()
    {
        // GIVEN: A middleware instance wired to a next-delegate that throws an exception
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(
            next: _ => throw new InvalidOperationException("Simulated unhandled exception"));

        var context = new DefaultHttpContext();
        context.Response.Body = new System.IO.MemoryStream();

        // WHEN: The middleware invokes the next delegate and catches the exception
        await middleware.InvokeAsync(context);

        // THEN: The HTTP response status code is 500
        Assert.Equal(500, context.Response.StatusCode);
    }

    /// <summary>
    /// AC3 + NFR6: The Content-Type header must be "application/problem+json" — never plain JSON.
    /// RED: Fails until ExceptionHandlingMiddleware sets context.Response.ContentType correctly.
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenExceptionThrown_ShouldSetContentTypeApplicationProblemJson()
    {
        // GIVEN: A middleware instance whose next delegate throws
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(
            next: _ => throw new Exception("Boom"));

        var context = new DefaultHttpContext();
        context.Response.Body = new System.IO.MemoryStream();

        // WHEN: The middleware handles the exception
        await middleware.InvokeAsync(context);

        // THEN: Content-Type is "application/problem+json" (RFC 7807 requirement)
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    /// <summary>
    /// AC3: The response body must deserialize to a valid ProblemDetails object with non-null Status and Title.
    /// RED: Fails until the middleware writes a correctly shaped ProblemDetails payload.
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenExceptionThrown_ShouldWriteProblemDetailsBody()
    {
        // GIVEN: A middleware instance whose next delegate throws
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(
            next: _ => throw new Exception("Boom"));

        var context = new DefaultHttpContext();
        var responseBody = new System.IO.MemoryStream();
        context.Response.Body = responseBody;

        // WHEN: The middleware handles the exception
        await middleware.InvokeAsync(context);

        // THEN: The response body is a valid ProblemDetails JSON object
        responseBody.Seek(0, System.IO.SeekOrigin.Begin);
        var bodyJson = await new System.IO.StreamReader(responseBody).ReadToEndAsync();

        Assert.False(string.IsNullOrWhiteSpace(bodyJson),
            "Response body must not be empty when an exception is handled.");

        var problemDetails = JsonSerializer.Deserialize<ProblemDetails>(bodyJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(problemDetails);
        Assert.NotNull(problemDetails!.Status);
        Assert.Equal(500, problemDetails.Status);
        Assert.NotNull(problemDetails.Title);
        Assert.False(string.IsNullOrWhiteSpace(problemDetails.Title),
            "ProblemDetails.Title must not be null or empty.");
    }

    /// <summary>
    /// AC3 + NFR6: The Detail field MUST be null — no stack traces or exception messages exposed.
    /// RED: Fails until ExceptionHandlingMiddleware sets Detail = null in its ProblemDetails response.
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenExceptionThrown_ShouldNotExposeStackTraceInDetail()
    {
        // GIVEN: A middleware instance whose next delegate throws an exception with a recognizable message
        const string sensitiveMessage = "SECRET_INTERNAL_ERROR_DETAILS";
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(
            next: _ => throw new InvalidOperationException(sensitiveMessage));

        var context = new DefaultHttpContext();
        var responseBody = new System.IO.MemoryStream();
        context.Response.Body = responseBody;

        // WHEN: The middleware handles the exception
        await middleware.InvokeAsync(context);

        // THEN: The response body does NOT contain the exception message (NFR6 — no stack trace exposure)
        responseBody.Seek(0, System.IO.SeekOrigin.Begin);
        var bodyJson = await new System.IO.StreamReader(responseBody).ReadToEndAsync();

        Assert.DoesNotContain(sensitiveMessage, bodyJson,
            StringComparison.OrdinalIgnoreCase);

        // AND: ProblemDetails.Detail is explicitly null
        var problemDetails = JsonSerializer.Deserialize<ProblemDetails>(bodyJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(problemDetails);
        Assert.Null(problemDetails!.Detail);
    }

    /// <summary>
    /// AC3: When no exception occurs, the middleware passes the request through to the next delegate unchanged.
    /// RED: Fails until middleware correctly invokes the next delegate on the happy path.
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenNoExceptionThrown_ShouldPassThroughToNextDelegate()
    {
        // GIVEN: A middleware instance whose next delegate completes successfully and sets status 200
        var nextWasCalled = false;
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(
            next: ctx =>
            {
                nextWasCalled = true;
                ctx.Response.StatusCode = 200;
                return Task.CompletedTask;
            });

        var context = new DefaultHttpContext();
        context.Response.Body = new System.IO.MemoryStream();

        // WHEN: The middleware processes a successful request
        await middleware.InvokeAsync(context);

        // THEN: The next delegate was called and the status is 200 (not 500)
        Assert.True(nextWasCalled, "The next middleware delegate must be called on the happy path.");
        Assert.Equal(200, context.Response.StatusCode);
    }
}
