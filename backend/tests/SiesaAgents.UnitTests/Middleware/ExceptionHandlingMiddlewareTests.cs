using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.API.Middleware;
using Xunit;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// Tests for Story 1.3 — Backend Database Foundation.
/// AC #4: ExceptionHandlingMiddleware returns RFC 7807 Problem Details on unhandled exceptions.
///   - HTTP 500 for generic exceptions (no stack trace, no detail message).
///   - HTTP 404 for KeyNotFoundException.
///   - HTTP 400 for ArgumentException / InvalidOperationException.
///   - HTTP 499 for cancelled requests (no body written).
///   - Content-Type: application/problem+json on all error branches.
/// </summary>
public class ExceptionHandlingMiddlewareTests
{
    // ──────────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────────

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
        return string.IsNullOrWhiteSpace(json)
            ? null
            : JsonSerializer.Deserialize<ProblemDetails>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // AC #4 — Generic unhandled exception → HTTP 500 Problem Details (NFR6)
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_OnUnhandledException_Returns500StatusCode()
    {
        // GIVEN: Middleware wrapping a delegate that throws an unhandled exception
        var middleware = new ExceptionHandlingMiddleware(_ => throw new Exception("Boom"));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response status is 500
        Assert.Equal(500, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_OnUnhandledException_ReturnsProblemJsonContentType()
    {
        // GIVEN: Middleware wrapping a delegate that throws an unhandled exception
        var middleware = new ExceptionHandlingMiddleware(_ => throw new Exception("Boom"));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Content-Type is application/problem+json (RFC 7807)
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    [Fact]
    public async Task InvokeAsync_OnUnhandledException_ResponseBodyContainsStatusField()
    {
        // GIVEN: Middleware wrapping a delegate that throws an unhandled exception
        var middleware = new ExceptionHandlingMiddleware(_ => throw new Exception("Boom"));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response body is a valid RFC 7807 ProblemDetails with status field
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.NotNull(problem);
        Assert.Equal(500, problem!.Status);
    }

    [Fact]
    public async Task InvokeAsync_OnUnhandledException_ResponseBodyContainsTitleField()
    {
        // GIVEN: Middleware wrapping a delegate that throws an unhandled exception
        var middleware = new ExceptionHandlingMiddleware(_ => throw new Exception("Boom"));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response body ProblemDetails has a non-empty title field
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.NotNull(problem?.Title);
        Assert.NotEmpty(problem!.Title!);
    }

    [Fact]
    public async Task InvokeAsync_OnUnhandledException_DetailIsNull_NoInternalMessageExposed()
    {
        // GIVEN: Middleware wrapping a delegate that throws an exception with sensitive message
        var middleware = new ExceptionHandlingMiddleware(_ => throw new Exception("InternalSecret"));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Detail field is null — internal exception message NOT exposed (NFR6)
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.Null(problem?.Detail);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // AC #4 — KeyNotFoundException → HTTP 404 Problem Details
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_OnKeyNotFoundException_Returns404StatusCode()
    {
        // GIVEN: Middleware wrapping a delegate that throws KeyNotFoundException
        var middleware = new ExceptionHandlingMiddleware(_ => throw new KeyNotFoundException("not found"));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response status is 404
        Assert.Equal(404, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_OnKeyNotFoundException_ReturnsProblemJsonContentType()
    {
        // GIVEN: Middleware wrapping a delegate that throws KeyNotFoundException
        var middleware = new ExceptionHandlingMiddleware(_ => throw new KeyNotFoundException("not found"));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Content-Type is application/problem+json
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    [Fact]
    public async Task InvokeAsync_OnKeyNotFoundException_ProblemDetailsTitleIsResourceNotFound()
    {
        // GIVEN: Middleware wrapping a delegate that throws KeyNotFoundException
        var middleware = new ExceptionHandlingMiddleware(_ => throw new KeyNotFoundException("not found"));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: ProblemDetails title is "Resource not found."
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.Equal("Resource not found.", problem?.Title);
    }

    [Fact]
    public async Task InvokeAsync_OnKeyNotFoundException_DetailIsNull_NoInternalMessageExposed()
    {
        // GIVEN: Middleware wrapping a delegate that throws KeyNotFoundException with sensitive message
        var middleware = new ExceptionHandlingMiddleware(_ => throw new KeyNotFoundException("SensitiveData"));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Detail field is null — internal key name NOT exposed (NFR6)
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.Null(problem?.Detail);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // AC #4 — ArgumentException → HTTP 400 Problem Details
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_OnArgumentException_Returns400StatusCode()
    {
        // GIVEN: Middleware wrapping a delegate that throws ArgumentException
        var middleware = new ExceptionHandlingMiddleware(_ => throw new ArgumentException("bad param"));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response status is 400
        Assert.Equal(400, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_OnArgumentException_ReturnsProblemJsonContentType()
    {
        // GIVEN: Middleware wrapping a delegate that throws ArgumentException
        var middleware = new ExceptionHandlingMiddleware(_ => throw new ArgumentException("bad param"));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Content-Type is application/problem+json
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    [Fact]
    public async Task InvokeAsync_OnArgumentException_ProblemDetailsTitleIsInvalidRequest()
    {
        // GIVEN: Middleware wrapping a delegate that throws ArgumentException
        var middleware = new ExceptionHandlingMiddleware(_ => throw new ArgumentException("bad param"));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: ProblemDetails title is "Invalid request."
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.Equal("Invalid request.", problem?.Title);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // AC #4 — InvalidOperationException → HTTP 400 Problem Details
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_OnInvalidOperationException_Returns400StatusCode()
    {
        // GIVEN: Middleware wrapping a delegate that throws InvalidOperationException
        var middleware = new ExceptionHandlingMiddleware(_ => throw new InvalidOperationException("bad state"));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response status is 400
        Assert.Equal(400, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_OnInvalidOperationException_ProblemDetailsTitleIsInvalidRequest()
    {
        // GIVEN: Middleware wrapping a delegate that throws InvalidOperationException
        var middleware = new ExceptionHandlingMiddleware(_ => throw new InvalidOperationException("bad state"));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: ProblemDetails title is "Invalid request."
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.Equal("Invalid request.", problem?.Title);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // AC #4 — Cancelled request → HTTP 499, no response body written
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_OnCancelledRequest_Returns499StatusCode()
    {
        // GIVEN: Middleware wrapping a delegate that throws OperationCanceledException with request cancelled
        var context = CreateHttpContext();
        var cts = new CancellationTokenSource();
        await cts.CancelAsync();
        context.RequestAborted = cts.Token;

        var middleware = new ExceptionHandlingMiddleware(_ => throw new OperationCanceledException(cts.Token));

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response status is 499 (client disconnected, not a server error)
        Assert.Equal(499, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_OnCancelledRequest_NoBodyWritten()
    {
        // GIVEN: Middleware wrapping a delegate that throws OperationCanceledException with request cancelled
        var context = CreateHttpContext();
        var cts = new CancellationTokenSource();
        await cts.CancelAsync();
        context.RequestAborted = cts.Token;

        var middleware = new ExceptionHandlingMiddleware(_ => throw new OperationCanceledException(cts.Token));

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response body is empty — no Problem Details written for cancelled requests
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.Empty(body);
    }
}
