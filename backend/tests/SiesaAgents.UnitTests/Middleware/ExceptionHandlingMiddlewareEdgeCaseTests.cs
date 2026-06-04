using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.API.Middleware;
using Xunit;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// Edge case, error path, and boundary tests for ExceptionHandlingMiddleware (Story 1.3 expansion).
/// Covers paths not addressed in the ATDD tests:
///   - Happy path: next delegate succeeds — no response interference.
///   - OperationCanceledException when request is NOT cancelled → falls through to 500.
///   - TaskCanceledException (subclass of OperationCanceledException) with cancelled token → 499, no body.
///   - ArgumentNullException (subclass of ArgumentException) → 400.
///   - NullReferenceException (generic Exception subclass) → 500.
///   - Exception thrown with empty message → detail is still null (NFR6 boundary).
///   - Middleware preserves 200 status code on success.
///   - Multiple sequential exception types handled independently.
/// </summary>
public class ExceptionHandlingMiddlewareEdgeCaseTests
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
    // Happy path — next delegate completes without exception
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNextSucceeds_DoesNotAlterResponseStatus()
    {
        // GIVEN: Middleware wrapping a delegate that completes successfully
        var middleware = new ExceptionHandlingMiddleware(ctx =>
        {
            ctx.Response.StatusCode = 200;
            return Task.CompletedTask;
        });
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response status remains 200 — middleware does not interfere with success responses
        Assert.Equal(200, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenNextSucceeds_NoBodyWrittenByMiddleware()
    {
        // GIVEN: Middleware wrapping a delegate that writes no body
        var middleware = new ExceptionHandlingMiddleware(_ => Task.CompletedTask);
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response body is empty — middleware does not inject content on success
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.Empty(body);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Boundary — OperationCanceledException thrown when request is NOT cancelled
    // This must NOT return 499 — it is an application-level cancel, treated as 500
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_OnOperationCanceled_WhenRequestNotAborted_Returns500()
    {
        // GIVEN: Middleware where next throws OperationCanceledException
        //        but the HttpContext request is NOT aborted (client still connected)
        var context = CreateHttpContext();
        // RequestAborted is not cancelled — context.RequestAborted.IsCancellationRequested == false
        var middleware = new ExceptionHandlingMiddleware(_ => throw new OperationCanceledException("app-level cancel"));

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Middleware treats this as a generic 500 (not a client disconnect 499)
        Assert.Equal(500, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_OnOperationCanceled_WhenRequestNotAborted_ReturnsProblemJson()
    {
        // GIVEN: OperationCanceledException thrown when request is not aborted
        var context = CreateHttpContext();
        var middleware = new ExceptionHandlingMiddleware(_ => throw new OperationCanceledException("app-level cancel"));

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Content-Type is application/problem+json — not treated as silent 499
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Boundary — TaskCanceledException (subclass of OperationCanceledException)
    // with cancelled token → must be treated as 499, no body
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_OnTaskCanceledException_WithCancelledToken_Returns499()
    {
        // GIVEN: Middleware where next throws TaskCanceledException with a cancelled request token
        var context = CreateHttpContext();
        var cts = new CancellationTokenSource();
        await cts.CancelAsync();
        context.RequestAborted = cts.Token;

        var middleware = new ExceptionHandlingMiddleware(_ => throw new TaskCanceledException("task cancelled", null, cts.Token));

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Returns 499 — TaskCanceledException is a subclass of OperationCanceledException
        Assert.Equal(499, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_OnTaskCanceledException_WithCancelledToken_NoBodyWritten()
    {
        // GIVEN: TaskCanceledException with cancelled request token
        var context = CreateHttpContext();
        var cts = new CancellationTokenSource();
        await cts.CancelAsync();
        context.RequestAborted = cts.Token;

        var middleware = new ExceptionHandlingMiddleware(_ => throw new TaskCanceledException("task cancelled", null, cts.Token));

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: No response body written for client disconnection
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.Empty(body);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Boundary — ArgumentNullException (subclass of ArgumentException) → 400
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_OnArgumentNullException_Returns400()
    {
        // GIVEN: Middleware wrapping a delegate that throws ArgumentNullException
        //        (ArgumentNullException IS-A ArgumentException)
        var middleware = new ExceptionHandlingMiddleware(_ => throw new ArgumentNullException("paramName"));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Status is 400 — ArgumentNullException inherits from ArgumentException catch block
        Assert.Equal(400, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_OnArgumentNullException_TitleIsInvalidRequest()
    {
        // GIVEN: ArgumentNullException thrown
        var middleware = new ExceptionHandlingMiddleware(_ => throw new ArgumentNullException("paramName"));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: ProblemDetails title is "Invalid request."
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.Equal("Invalid request.", problem?.Title);
    }

    [Fact]
    public async Task InvokeAsync_OnArgumentNullException_DetailIsNull_NoParamNameExposed()
    {
        // GIVEN: ArgumentNullException with a sensitive parameter name
        var middleware = new ExceptionHandlingMiddleware(_ => throw new ArgumentNullException("sensitiveParam"));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Detail is null — parameter name NOT exposed (NFR6)
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.Null(problem?.Detail);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Boundary — NullReferenceException falls to generic 500
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_OnNullReferenceException_Returns500()
    {
        // GIVEN: Middleware wrapping a delegate that throws NullReferenceException
        var middleware = new ExceptionHandlingMiddleware(_ => throw new NullReferenceException("object ref not set"));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Falls to generic 500 handler
        Assert.Equal(500, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_OnNullReferenceException_DetailIsNull_NoInternalMessageExposed()
    {
        // GIVEN: NullReferenceException with internal details
        var middleware = new ExceptionHandlingMiddleware(_ => throw new NullReferenceException("InternalDetails"));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Detail is null — internal message NOT exposed (NFR6)
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.Null(problem?.Detail);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Boundary — Exception with empty message → detail is still null
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_OnExceptionWithEmptyMessage_DetailIsNull()
    {
        // GIVEN: Exception with empty message string
        var middleware = new ExceptionHandlingMiddleware(_ => throw new Exception(string.Empty));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Detail is null regardless of exception message content (NFR6)
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.Null(problem?.Detail);
    }

    [Fact]
    public async Task InvokeAsync_OnExceptionWithEmptyMessage_Returns500()
    {
        // GIVEN: Exception with empty message string
        var middleware = new ExceptionHandlingMiddleware(_ => throw new Exception(string.Empty));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Returns 500 regardless of message content
        Assert.Equal(500, context.Response.StatusCode);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Boundary — KeyNotFoundException with empty message → detail still null
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_OnKeyNotFoundExceptionWithEmptyMessage_DetailIsNull()
    {
        // GIVEN: KeyNotFoundException with no message
        var middleware = new ExceptionHandlingMiddleware(_ => throw new KeyNotFoundException());
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Detail is null (default no-arg constructor) — NFR6 enforced in all branches
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.Null(problem?.Detail);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Boundary — Nested exception (inner exception) → outer is what matters
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_OnKeyNotFoundWrappingInnerException_Returns404()
    {
        // GIVEN: KeyNotFoundException wrapping an inner exception with sensitive data
        var inner = new Exception("SensitiveInnerDetail");
        var middleware = new ExceptionHandlingMiddleware(_ => throw new KeyNotFoundException("outer", inner));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Returns 404 based on outer exception type, NOT 500
        Assert.Equal(404, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_OnKeyNotFoundWrappingInnerException_InnerDetailNotExposed()
    {
        // GIVEN: KeyNotFoundException wrapping an inner exception with sensitive data
        var inner = new Exception("SensitiveInnerDetail");
        var middleware = new ExceptionHandlingMiddleware(_ => throw new KeyNotFoundException("outer", inner));
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Detail is null — inner exception message NOT exposed (NFR6)
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.Null(problem?.Detail);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Boundary — Exception thrown synchronously in next delegate (not async)
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNextThrowsSynchronously_HandlesGracefully()
    {
        // GIVEN: Next delegate throws synchronously (not via Task)
        RequestDelegate synchronousThrow = _ =>
        {
            throw new InvalidOperationException("sync throw");
#pragma warning disable CS0162
            return Task.CompletedTask;
#pragma warning restore CS0162
        };

        var middleware = new ExceptionHandlingMiddleware(synchronousThrow);
        var context = CreateHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Middleware catches synchronous throw → returns 400
        Assert.Equal(400, context.Response.StatusCode);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Boundary — Multiple independent middleware invocations do not share state
    // ──────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_CalledTwiceOnSameInstance_SecondCallIsIndependent()
    {
        // GIVEN: Single middleware instance, two independent request contexts
        var middleware = new ExceptionHandlingMiddleware(_ => throw new KeyNotFoundException());
        var context1 = CreateHttpContext();
        var context2 = CreateHttpContext();

        // WHEN: Middleware is invoked twice with different contexts
        await middleware.InvokeAsync(context1);
        await middleware.InvokeAsync(context2);

        // THEN: Both contexts receive 404 independently — no shared state between calls
        Assert.Equal(404, context1.Response.StatusCode);
        Assert.Equal(404, context2.Response.StatusCode);
    }
}
