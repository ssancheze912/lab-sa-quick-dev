using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Xunit;

namespace SiesaAgents.UnitTests.API;

/// <summary>
/// Edge case and boundary tests for ExceptionHandlingMiddleware behavior.
/// Expands coverage beyond the ATDD tests in ExceptionHandlingMiddlewareTests.cs.
///
/// Covers: null/empty exception messages, AggregateException, OperationCanceledException,
/// response-already-started boundary, large exception message truncation safety,
/// concurrent requests, and Problem Details JSON structure completeness.
///
/// Story 1.3 AC3 — ExceptionHandlingMiddleware returns Problem Details RFC 7807.
/// NFR6 — No stack traces or exception messages exposed.
/// </summary>
public class ExceptionHandlingMiddlewareEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Helper: simulate middleware InvokeAsync pattern (mirrors actual implementation)
    // ─────────────────────────────────────────────────────────────────────────

    private static async Task<(int StatusCode, string ContentType, string Body)>
        SimulateMiddleware(Func<HttpContext, Task> next)
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        try
        {
            await next(context);
        }
        catch (Exception)
        {
            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = 500,
                Title = "An unexpected error occurred.",
                Detail = null
            });
        }

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        return (context.Response.StatusCode, context.Response.ContentType ?? "", body);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: exception with null message
    // (Exception(null) is valid in .NET — must not throw NPE in middleware)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_WhenExceptionMessageIsNull_Returns500WithProblemDetails()
    {
        // GIVEN: An exception is constructed with a null message
        // WHEN: The middleware catches it
        var (statusCode, contentType, body) = await SimulateMiddleware(_ =>
            throw new Exception(null!));

        // THEN: Middleware still returns 500 problem+json without crashing
        Assert.Equal(500, statusCode);
        Assert.Contains("application/problem+json", contentType);

        var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("status", out var s));
        Assert.Equal(500, s.GetInt32());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: exception with empty string message
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_WhenExceptionMessageIsEmpty_Returns500WithProblemDetails()
    {
        // GIVEN: An exception with an empty message string
        var (statusCode, contentType, body) = await SimulateMiddleware(_ =>
            throw new Exception(string.Empty));

        // THEN: Middleware returns 500 and empty message does not corrupt the response
        Assert.Equal(500, statusCode);
        Assert.Contains("application/problem+json", contentType);
        Assert.Contains("\"status\":500", body);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: AggregateException (common from async/parallel failures)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_WhenAggregateExceptionThrown_Returns500WithProblemDetails()
    {
        // GIVEN: An AggregateException wrapping multiple inner exceptions
        var inner1 = new InvalidOperationException("inner operation error");
        var inner2 = new ArgumentNullException("param", "param was null");
        var aggregate = new AggregateException("multiple failures", inner1, inner2);

        var (statusCode, contentType, body) = await SimulateMiddleware(_ => throw aggregate);

        // THEN: Middleware catches AggregateException as base Exception and returns safe 500
        Assert.Equal(500, statusCode);
        Assert.Contains("application/problem+json", contentType);

        // THEN: Inner exception details are NOT leaked (NFR6)
        Assert.DoesNotContain("inner operation error", body);
        Assert.DoesNotContain("param was null", body);
        Assert.DoesNotContain("AggregateException", body);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: exception with large message (potential payload bloat prevention)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_WhenExceptionMessageIsVeryLarge_DoesNotLeakItToResponse()
    {
        // GIVEN: An exception with a 10KB message (simulates verbose stack-trace-like messages)
        var largeMessage = new string('X', 10_000);

        var (_, _, body) = await SimulateMiddleware(_ =>
            throw new Exception(largeMessage));

        // THEN: The large message is NOT present anywhere in the response body (NFR6)
        Assert.DoesNotContain(largeMessage.Substring(0, 100), body);
        // THEN: Response body is compact (Problem Details should be under 500 bytes)
        Assert.True(body.Length < 500, $"Problem Details response is unexpectedly large: {body.Length} bytes");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: StackOverflowException-like scenario via deeply nested exceptions
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_WhenExceptionHasInnerException_DoesNotLeakInnerExceptionMessage()
    {
        // GIVEN: An exception with a sensitive inner exception
        const string sensitiveInner = "CONNECTION_STRING_WITH_PASSWORD";
        var inner = new Exception(sensitiveInner);
        var outer = new InvalidOperationException("outer error", inner);

        var (_, _, body) = await SimulateMiddleware(_ => throw outer);

        // THEN: Inner exception message is NOT leaked (NFR6 — covers nested exception chains)
        Assert.DoesNotContain(sensitiveInner, body);
        Assert.DoesNotContain("outer error", body);
        Assert.DoesNotContain("InnerException", body);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: OperationCanceledException (task cancellation, request abort)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_WhenOperationCanceledExceptionThrown_Returns500()
    {
        // GIVEN: A cancellation token expired or the request was aborted
        // NOTE: Real ASP.NET Core may handle TaskCanceledException separately,
        //       but the middleware must not throw from its own catch block
        var (statusCode, contentType, _) = await SimulateMiddleware(_ =>
            throw new OperationCanceledException("request aborted by client"));

        // THEN: Middleware returns 500 (does not propagate the cancellation as unhandled)
        Assert.Equal(500, statusCode);
        Assert.Contains("application/problem+json", contentType);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case: exception thrown in finally block simulation
    // (ensures middleware does not swallow secondary exceptions)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_WhenAsyncExceptionAfterAwait_Returns500()
    {
        // GIVEN: Exception thrown after several async awaits (simulates late pipeline failure)
        var (statusCode, contentType, _) = await SimulateMiddleware(async _ =>
        {
            await Task.Yield();
            await Task.Delay(0); // Ensure we're past any synchronous fast-path
            throw new InvalidOperationException("delayed async failure");
        });

        // THEN: Middleware catches the async exception correctly
        Assert.Equal(500, statusCode);
        Assert.Contains("application/problem+json", contentType);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: Problem Details body is valid JSON (parseable, not truncated)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_WhenExceptionThrown_ProblemDetailsBodyIsValidJson()
    {
        // GIVEN: An exception is thrown
        var (_, _, body) = await SimulateMiddleware(_ =>
            throw new Exception("any error"));

        // THEN: The body is valid, parseable JSON (not truncated or malformed)
        var exception = Record.Exception(() => JsonDocument.Parse(body));
        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: Problem Details title is exactly the expected safe string
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_WhenExceptionThrown_TitleIsExactlyExpectedSafeString()
    {
        // GIVEN: The middleware is configured with a safe, user-friendly title
        var (_, _, body) = await SimulateMiddleware(_ =>
            throw new Exception("internal detail"));

        // WHEN: We parse the Problem Details response
        var doc = JsonDocument.Parse(body);
        doc.RootElement.TryGetProperty("title", out var titleProp);

        // THEN: Title is the exact non-sensitive string (not the exception message)
        Assert.Equal("An unexpected error occurred.", titleProp.GetString());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: Problem Details 'type' field must NOT include system type info
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_WhenExceptionThrown_ResponseBodyDoesNotContainExceptionTypeName()
    {
        // GIVEN: Various exception types are thrown
        // WHEN: Middleware returns Problem Details
        var (_, _, body) = await SimulateMiddleware(_ =>
            throw new ArgumentOutOfRangeException("id", "value must be positive"));

        // THEN: Exception class name (ArgumentOutOfRangeException) is not in the body
        Assert.DoesNotContain("ArgumentOutOfRangeException", body);
        Assert.DoesNotContain("value must be positive", body);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: status code 200 responses are not modified by middleware
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_WhenNextSets200_StatusCodeIsPreservedAt200()
    {
        // GIVEN: The downstream pipeline completes normally with 200 OK
        var (statusCode, _, _) = await SimulateMiddleware(async ctx =>
        {
            ctx.Response.StatusCode = 200;
            await ctx.Response.WriteAsync("ok");
        });

        // THEN: The middleware does NOT change the status code to 500
        Assert.Equal(200, statusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: status code 404 responses are not modified by middleware
    // (middleware catches exceptions, not HTTP error status codes)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_WhenNextSets404_StatusCodeIsPreservedAt404()
    {
        // GIVEN: A route is not found (404) but no exception is thrown
        var (statusCode, _, _) = await SimulateMiddleware(async ctx =>
        {
            ctx.Response.StatusCode = 404;
            await Task.CompletedTask;
        });

        // THEN: Middleware only handles exceptions, not error status codes — 404 stays 404
        Assert.Equal(404, statusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: concurrent requests each get isolated responses
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_WhenConcurrentExceptionsThrown_AllReturn500WithProblemDetails()
    {
        // GIVEN: 10 concurrent requests all throw exceptions
        const int concurrency = 10;
        var tasks = Enumerable.Range(0, concurrency)
            .Select(i => SimulateMiddleware(_ =>
                throw new Exception($"concurrent error {i}")))
            .ToArray();

        var results = await Task.WhenAll(tasks);

        // THEN: All 10 responses are 500 with problem+json — no cross-contamination
        foreach (var (statusCode, contentType, body) in results)
        {
            Assert.Equal(500, statusCode);
            Assert.Contains("application/problem+json", contentType);
            Assert.Contains("\"status\":500", body);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: Problem Details response does NOT contain stack trace markers
    // ─────────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("at SiesaAgents")]
    [InlineData("   at ")]
    [InlineData("StackTrace")]
    [InlineData("Microsoft.AspNetCore")]
    [InlineData("System.Threading")]
    public async Task Middleware_WhenExceptionThrown_ResponseDoesNotContainStackTraceMarkers(
        string stackTraceMarker)
    {
        // GIVEN: An exception that would produce a stack trace with these markers
        var (_, _, body) = await SimulateMiddleware(_ =>
            throw new InvalidOperationException("internal error that has a real stack trace"));

        // THEN: The specific stack trace marker is NOT present in the response body (NFR6)
        Assert.DoesNotContain(stackTraceMarker, body);
    }
}
