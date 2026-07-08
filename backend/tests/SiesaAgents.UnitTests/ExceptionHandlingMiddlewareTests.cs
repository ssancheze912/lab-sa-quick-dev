using System.Text.Json;
using Microsoft.AspNetCore.Http;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests;

/// <summary>
/// Story 1.1: Project Initialization & Repository Structure.
///
/// Unit-level edge cases for <see cref="ExceptionHandlingMiddleware"/> that the
/// ATDD suite (e2e/tests/api/backend-initialization.api.spec.ts) intentionally
/// deferred: that test only proves an unrelated 404 route returns JSON via
/// UseStatusCodePages, not that an actual unhandled exception thrown deeper in
/// the pipeline is caught, converted to a safe Problem Details response, and
/// never leaks exception details (message/stack trace) to the client.
/// </summary>
public class ExceptionHandlingMiddlewareTests
{
    private static HttpContext CreateContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static async Task<JsonDocument> ReadResponseBodyAsJsonAsync(HttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();
        return JsonDocument.Parse(body);
    }

    [Fact]
    public async Task InvokeAsync_WhenNextThrows_Returns500WithProblemJsonContentType()
    {
        // GIVEN: a middleware whose next delegate throws an unhandled exception
        var middleware = new ExceptionHandlingMiddleware(_ => throw new InvalidOperationException("boom"));
        var context = CreateContext();

        // WHEN: the middleware handles the request
        await middleware.InvokeAsync(context);

        // THEN: the response is a 500 with RFC 7807 problem+json content type
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    [Fact]
    public async Task InvokeAsync_WhenNextThrows_DoesNotExposeExceptionMessageOrStackTrace()
    {
        // GIVEN: an exception containing sensitive internal details
        const string sensitiveMessage = "Connection string: Host=internal-db;Password=SuperSecret123";
        var middleware = new ExceptionHandlingMiddleware(_ => throw new InvalidOperationException(sensitiveMessage));
        var context = CreateContext();

        // WHEN: the middleware handles the request
        await middleware.InvokeAsync(context);

        // THEN: the serialized Problem Details body never contains the raw exception message
        var json = await ReadResponseBodyAsJsonAsync(context);
        var raw = json.RootElement.GetRawText();

        Assert.DoesNotContain(sensitiveMessage, raw);
        Assert.DoesNotContain("SuperSecret123", raw);
        Assert.False(
            json.RootElement.TryGetProperty("detail", out var detail) && detail.ValueKind != JsonValueKind.Null,
            "Detail must be null — never expose ex.Message or stack traces (per Dev Notes)."
        );
    }

    [Fact]
    public async Task InvokeAsync_WhenNextThrows_ReturnsGenericTitle()
    {
        // GIVEN: any unhandled exception
        var middleware = new ExceptionHandlingMiddleware(_ => throw new Exception("irrelevant"));
        var context = CreateContext();

        // WHEN: the middleware handles the request
        await middleware.InvokeAsync(context);

        // THEN: the client receives a generic, non-identifying title
        var json = await ReadResponseBodyAsJsonAsync(context);
        Assert.Equal("An unexpected error occurred.", json.RootElement.GetProperty("title").GetString());
        Assert.Equal(500, json.RootElement.GetProperty("status").GetInt32());
    }

    [Fact]
    public async Task InvokeAsync_WhenNextSucceeds_PassesThroughWithoutModifyingResponse()
    {
        // GIVEN: a downstream delegate that completes successfully (happy path,
        // asserting the middleware is transparent when there's nothing to catch)
        var nextCalled = false;
        var middleware = new ExceptionHandlingMiddleware(ctx =>
        {
            nextCalled = true;
            ctx.Response.StatusCode = StatusCodes.Status200OK;
            return Task.CompletedTask;
        });
        var context = CreateContext();

        // WHEN: the middleware handles the request
        await middleware.InvokeAsync(context);

        // THEN: the next delegate ran and the original response is untouched
        Assert.True(nextCalled);
        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenNextThrowsAggregateException_StillReturns500WithoutCrashing()
    {
        // GIVEN: a wrapped/aggregate exception (boundary case for async fan-out errors)
        var inner = new InvalidOperationException("inner failure");
        var middleware = new ExceptionHandlingMiddleware(_ => throw new AggregateException(inner));
        var context = CreateContext();

        // WHEN: the middleware handles the request
        await middleware.InvokeAsync(context);

        // THEN: the middleware degrades gracefully instead of rethrowing/crashing the host
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
        var json = await ReadResponseBodyAsJsonAsync(context);
        Assert.DoesNotContain("inner failure", json.RootElement.GetRawText());
    }
}
