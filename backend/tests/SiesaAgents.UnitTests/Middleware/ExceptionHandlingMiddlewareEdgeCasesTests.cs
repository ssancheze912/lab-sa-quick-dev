// Story 1.3: Backend Database Foundation — Automation Expansion
// Epic 1: Project Foundation & Application Shell
//
// Unit Tests — AUTOMATION EXPANSION (xUnit)
// Edge cases and boundary conditions NOT covered by ATDD tests.
//
// Focus areas:
//   - Different exception types (ArgumentException, TaskCanceledException, OutOfMemoryException)
//   - Async exception propagation
//   - Concurrent exception handling (thread safety)
//   - Middleware transparency on success paths
//   - Response body content security: no exception type names leaked
//   - Content-Type immutability (must always be application/problem+json regardless of prior headers)

using System.IO;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// Automation expansion tests for ExceptionHandlingMiddleware.
/// Covers edge cases beyond AC2 acceptance criteria:
/// exception type variety, concurrency, response header immutability, body security.
/// </summary>
public class ExceptionHandlingMiddlewareEdgeCasesTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Different exception types must all produce 500 with RFC 7807 body
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] ArgumentException: middleware still returns 500 with problem+json")]
    public async Task InvokeAsync_WhenArgumentExceptionThrown_Returns500WithProblemJson()
    {
        // GIVEN: A delegate that throws ArgumentException (typed exception, not generic)
        RequestDelegate throwingDelegate = _ => throw new ArgumentException("invalid argument");
        var middleware = new ExceptionHandlingMiddleware(throwingDelegate);
        var context = CreateHttpContext();

        // WHEN: InvokeAsync is called
        await middleware.InvokeAsync(context);

        // THEN: Status is 500 and Content-Type is application/problem+json
        Assert.Equal(500, context.Response.StatusCode);
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    [Fact(DisplayName = "[P1] NullReferenceException: middleware body must NOT contain the exception type name")]
    public async Task InvokeAsync_WhenNullReferenceExceptionThrown_BodyDoesNotContainExceptionTypeName()
    {
        // GIVEN: A delegate throwing NullReferenceException
        RequestDelegate throwingDelegate = _ => throw new NullReferenceException("null ref");
        var middleware = new ExceptionHandlingMiddleware(throwingDelegate);
        var context = CreateHttpContext();

        // WHEN: InvokeAsync is called
        await middleware.InvokeAsync(context);

        // THEN: Response body NEVER contains the exception class name (NFR6 — no type leakage)
        var body = await ReadResponseBodyAsync(context);
        Assert.DoesNotContain("NullReferenceException", body);
        Assert.DoesNotContain("null ref", body);
    }

    [Fact(DisplayName = "[P1] ArgumentNullException: exception message must NOT appear in response body")]
    public async Task InvokeAsync_WhenArgumentNullExceptionThrown_ExceptionMessageNotLeaked()
    {
        // GIVEN: A delegate throwing ArgumentNullException with a specific message
        const string sensitiveMessage = "paramName-must-not-appear-in-response";
        RequestDelegate throwingDelegate = _ => throw new ArgumentNullException("paramName", sensitiveMessage);
        var middleware = new ExceptionHandlingMiddleware(throwingDelegate);
        var context = CreateHttpContext();

        // WHEN: InvokeAsync is called
        await middleware.InvokeAsync(context);

        // THEN: The sensitive message is NOT in the response (Detail = null prevents leakage)
        var body = await ReadResponseBodyAsync(context);
        Assert.DoesNotContain(sensitiveMessage, body);
        Assert.DoesNotContain("paramName", body);
    }

    [Fact(DisplayName = "[P1] TaskCanceledException: middleware still returns 500 (not 499 or rethrow)")]
    public async Task InvokeAsync_WhenTaskCanceledExceptionThrown_Returns500()
    {
        // GIVEN: A delegate throwing TaskCanceledException (e.g., timeout scenario)
        RequestDelegate throwingDelegate = _ => throw new TaskCanceledException("operation was canceled");
        var middleware = new ExceptionHandlingMiddleware(throwingDelegate);
        var context = CreateHttpContext();

        // WHEN: InvokeAsync is called and TaskCanceledException propagates
        await middleware.InvokeAsync(context);

        // THEN: Middleware catches all exceptions (catch(Exception)) — returns 500 not 499
        Assert.Equal(500, context.Response.StatusCode);
    }

    [Fact(DisplayName = "[P1] OperationCanceledException: body title is generic, no cancellation detail")]
    public async Task InvokeAsync_WhenOperationCanceledExceptionThrown_TitleIsGeneric()
    {
        // GIVEN: A delegate throwing OperationCanceledException
        RequestDelegate throwingDelegate = _ => throw new OperationCanceledException("specific cancel reason");
        var middleware = new ExceptionHandlingMiddleware(throwingDelegate);
        var context = CreateHttpContext();

        // WHEN: InvokeAsync is called
        await middleware.InvokeAsync(context);

        // THEN: Title is the generic approved message, not the cancellation detail
        var body = await ReadResponseBodyAsync(context);
        using var doc = JsonDocument.Parse(body);
        var title = doc.RootElement.GetProperty("title").GetString();
        Assert.Equal("An unexpected error occurred.", title);
        Assert.DoesNotContain("specific cancel reason", body);
    }

    [Fact(DisplayName = "[P2] FormatException: response body parses as valid JSON (well-formed even for rare exception types)")]
    public async Task InvokeAsync_WhenFormatExceptionThrown_ResponseBodyIsValidJson()
    {
        // GIVEN: A delegate throwing FormatException
        RequestDelegate throwingDelegate = _ => throw new FormatException("bad format string");
        var middleware = new ExceptionHandlingMiddleware(throwingDelegate);
        var context = CreateHttpContext();

        // WHEN: InvokeAsync is called
        await middleware.InvokeAsync(context);

        // THEN: The response body is valid parseable JSON (no partial writes)
        var body = await ReadResponseBodyAsync(context);
        Assert.NotEmpty(body);
        var exception = Record.Exception(() => JsonDocument.Parse(body));
        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Async exception in next delegate (Task.FromException pattern)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Async exception (Task.FromException): middleware catches and returns 500")]
    public async Task InvokeAsync_WhenNextDelegateReturnsFailedTask_Returns500()
    {
        // GIVEN: A delegate that returns an already-faulted Task (async exception pattern)
        RequestDelegate faultedDelegate = _ => Task.FromException(
            new InvalidOperationException("async faulted task"));
        var middleware = new ExceptionHandlingMiddleware(faultedDelegate);
        var context = CreateHttpContext();

        // WHEN: InvokeAsync is called and the faulted task is awaited
        await middleware.InvokeAsync(context);

        // THEN: Middleware catches the exception and returns 500
        Assert.Equal(500, context.Response.StatusCode);
    }

    [Fact(DisplayName = "[P1] Async exception (Task.FromException): Content-Type is application/problem+json")]
    public async Task InvokeAsync_WhenNextDelegateReturnsFailedTask_ContentTypeIsProblemJson()
    {
        // GIVEN: A delegate that returns a faulted task
        RequestDelegate faultedDelegate = _ => Task.FromException(
            new Exception("faulted async"));
        var middleware = new ExceptionHandlingMiddleware(faultedDelegate);
        var context = CreateHttpContext();

        // WHEN: InvokeAsync awaits the faulted delegate
        await middleware.InvokeAsync(context);

        // THEN: Content-Type is set correctly even for async exceptions
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Response body must always be valid RFC 7807 structure
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] RFC 7807: response body always contains exactly status=500 and a non-null title")]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyAlwaysHasStatusAndTitle()
    {
        // GIVEN: Any exception type
        RequestDelegate throwingDelegate = _ => throw new Exception("generic");
        var middleware = new ExceptionHandlingMiddleware(throwingDelegate);
        var context = CreateHttpContext();

        // WHEN: Exception is thrown
        await middleware.InvokeAsync(context);

        // THEN: Body has both "status" = 500 and "title" as non-empty string
        var body = await ReadResponseBodyAsync(context);
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp));
        Assert.Equal(500, statusProp.GetInt32());
        Assert.True(doc.RootElement.TryGetProperty("title", out var titleProp));
        Assert.Equal(JsonValueKind.String, titleProp.ValueKind);
        Assert.NotEmpty(titleProp.GetString()!);
    }

    [Fact(DisplayName = "[P2] RFC 7807: response body does NOT include 'extensions' or 'traceId' leaking internal info")]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyDoesNotContainTraceId()
    {
        // GIVEN: The middleware returns a plain ProblemDetails without traceId or extensions
        RequestDelegate throwingDelegate = _ => throw new Exception("generic");
        var middleware = new ExceptionHandlingMiddleware(throwingDelegate);
        var context = CreateHttpContext();

        // WHEN: Exception is thrown
        await middleware.InvokeAsync(context);

        // THEN: Response does not leak traceId (which could expose internal request routing)
        var body = await ReadResponseBodyAsync(context);
        Assert.DoesNotContain("traceId", body.ToLower());
        Assert.DoesNotContain("instance", body.ToLower());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: HTTP status code on response object must match body "status" field
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Status code consistency: HTTP 500 status matches body 'status' field value")]
    public async Task InvokeAsync_WhenExceptionThrown_HttpStatusCodeMatchesBodyStatusField()
    {
        // GIVEN: ExceptionHandlingMiddleware sets both context.Response.StatusCode and ProblemDetails.Status
        RequestDelegate throwingDelegate = _ => throw new Exception("consistency test");
        var middleware = new ExceptionHandlingMiddleware(throwingDelegate);
        var context = CreateHttpContext();

        // WHEN: Exception is thrown
        await middleware.InvokeAsync(context);

        // THEN: HTTP status code and body "status" field are both 500 (consistent per RFC 7807)
        Assert.Equal(500, context.Response.StatusCode);
        var body = await ReadResponseBodyAsync(context);
        using var doc = JsonDocument.Parse(body);
        var bodyStatus = doc.RootElement.GetProperty("status").GetInt32();
        Assert.Equal(context.Response.StatusCode, bodyStatus);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Content-Type must be correct regardless of any prior header setting
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Content-Type override: middleware sets application/problem+json even if prior content-type was text/plain")]
    public async Task InvokeAsync_WhenPriorContentTypeWasTextPlain_OverridesToProblemJson()
    {
        // GIVEN: The inner delegate sets a text/plain content-type before throwing
        RequestDelegate throwingDelegate = ctx =>
        {
            ctx.Response.ContentType = "text/plain";
            throw new Exception("override test");
        };
        var middleware = new ExceptionHandlingMiddleware(throwingDelegate);
        var context = CreateHttpContext();

        // WHEN: InvokeAsync is called
        await middleware.InvokeAsync(context);

        // THEN: Content-Type is overridden to application/problem+json by the middleware
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Concurrent exception handling — middleware must be thread-safe
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P2] Concurrency: 10 concurrent exceptions all return 500 with problem+json")]
    public async Task InvokeAsync_WhenCalledConcurrently_AllReturnCorrectStatus()
    {
        // GIVEN: Multiple concurrent requests all trigger exceptions
        var tasks = Enumerable.Range(0, 10).Select(async _ =>
        {
            RequestDelegate throwingDelegate = _ => throw new Exception("concurrent test");
            var middleware = new ExceptionHandlingMiddleware(throwingDelegate);
            var context = CreateHttpContext();

            // WHEN: All invoke concurrently
            await middleware.InvokeAsync(context);

            // THEN: Each returns 500
            return context.Response.StatusCode;
        });

        var results = await Task.WhenAll(tasks);

        // THEN: All 10 concurrent invocations returned 500
        Assert.All(results, statusCode => Assert.Equal(500, statusCode));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Multiple exception types in a sequence — middleware always handles correctly
    // ─────────────────────────────────────────────────────────────────────────

    [Theory(DisplayName = "[P2] Multiple exception types: always returns 500 (parameterized)")]
    [InlineData("ArgumentException")]
    [InlineData("InvalidOperationException")]
    [InlineData("NotImplementedException")]
    [InlineData("IndexOutOfRangeException")]
    [InlineData("KeyNotFoundException")]
    public async Task InvokeAsync_WithVariousExceptionTypes_AlwaysReturns500(string exceptionType)
    {
        // GIVEN: Various exception types that might be thrown by application code
        Exception exception = exceptionType switch
        {
            "ArgumentException" => new ArgumentException("arg error"),
            "InvalidOperationException" => new InvalidOperationException("invalid op"),
            "NotImplementedException" => new NotImplementedException("not implemented"),
            "IndexOutOfRangeException" => new IndexOutOfRangeException("index error"),
            "KeyNotFoundException" => new KeyNotFoundException("key not found"),
            _ => new Exception("generic")
        };

        RequestDelegate throwingDelegate = _ => throw exception;
        var middleware = new ExceptionHandlingMiddleware(throwingDelegate);
        var context = CreateHttpContext();

        // WHEN: InvokeAsync is called with various exception types
        await middleware.InvokeAsync(context);

        // THEN: Always returns 500 (catch(Exception) is a catch-all)
        Assert.Equal(500, context.Response.StatusCode);

        // AND: Content-Type is always application/problem+json
        Assert.Equal("application/problem+json", context.Response.ContentType);

        // AND: The exception type name is NOT in the response body (no type leakage)
        var body = await ReadResponseBodyAsync(context);
        Assert.DoesNotContain(exceptionType, body);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Happy path variations — middleware must be transparent on success
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Happy path: custom status code set by next delegate is preserved")]
    public async Task InvokeAsync_WhenNextDelegateSetsCustomStatusCode_StatusCodeIsPreserved()
    {
        // GIVEN: A delegate that sets a 201 Created status
        RequestDelegate customStatusDelegate = ctx =>
        {
            ctx.Response.StatusCode = 201;
            return Task.CompletedTask;
        };
        var middleware = new ExceptionHandlingMiddleware(customStatusDelegate);
        var context = CreateHttpContext();

        // WHEN: InvokeAsync is called without exception
        await middleware.InvokeAsync(context);

        // THEN: The 201 status is preserved — middleware does not interfere with successful responses
        Assert.Equal(201, context.Response.StatusCode);
    }

    [Fact(DisplayName = "[P1] Happy path: response body written by next delegate is preserved")]
    public async Task InvokeAsync_WhenNextDelegateWritesResponseBody_BodyIsPreserved()
    {
        // GIVEN: A delegate that writes a JSON response body
        const string expectedBody = "{\"result\":\"ok\"}";
        RequestDelegate writingDelegate = async ctx =>
        {
            ctx.Response.ContentType = "application/json";
            await ctx.Response.WriteAsync(expectedBody);
        };
        var middleware = new ExceptionHandlingMiddleware(writingDelegate);
        var context = CreateHttpContext();

        // WHEN: InvokeAsync is called without exception
        await middleware.InvokeAsync(context);

        // THEN: The written body is preserved (middleware does not overwrite successful responses)
        var body = await ReadResponseBodyAsync(context);
        Assert.Equal(expectedBody, body);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private static DefaultHttpContext CreateHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static async Task<string> ReadResponseBodyAsync(HttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body, Encoding.UTF8, leaveOpen: true);
        return await reader.ReadToEndAsync();
    }
}
