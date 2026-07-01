using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// Expands AC #2 (Story 1.3) coverage for ExceptionHandlingMiddleware beyond the ATDD
/// integration tests (ExceptionHandlingMiddlewareTests in SiesaAgents.IntegrationTests, which
/// exercise the middleware through a full WebApplicationFactory HTTP pipeline). These unit
/// tests isolate InvokeAsync() directly with a no-op "next" delegate and a recording fake
/// ILogger (no Moq/NSubstitute dependency in this project), covering behavior the ATDD suite
/// does not: the happy path (no exception thrown) is fully untouched, the exact JSON shape
/// (status as a number, detail as a JSON null literal, exactly 3 keys), and that the
/// exception is actually logged via ILogger before the response is written.
/// </summary>
public class ExceptionHandlingMiddlewareTests
{
    private sealed class RecordingLogger : ILogger<ExceptionHandlingMiddleware>
    {
        public int ErrorCallCount { get; private set; }
        public Exception? LastException { get; private set; }

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            if (logLevel == LogLevel.Error)
            {
                ErrorCallCount++;
                LastException = exception;
            }
        }
    }

    private static HttpContext CreateHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    [Fact]
    public async Task InvokeAsync_NoExceptionThrown_DoesNotModifyResponseStatusCode()
    {
        // GIVEN a middleware instance whose "next" delegate completes without throwing
        var logger = new RecordingLogger();
        var middleware = new ExceptionHandlingMiddleware(_ => Task.CompletedTask, logger);
        var context = CreateHttpContext();
        context.Response.StatusCode = StatusCodes.Status200OK;

        // WHEN invoking the middleware
        await middleware.InvokeAsync(context);

        // THEN the response status code is left untouched (happy path is not intercepted)
        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_NoExceptionThrown_DoesNotWriteResponseBody()
    {
        // GIVEN a middleware instance whose "next" delegate completes without throwing
        var logger = new RecordingLogger();
        var middleware = new ExceptionHandlingMiddleware(_ => Task.CompletedTask, logger);
        var context = CreateHttpContext();

        // WHEN invoking the middleware
        await middleware.InvokeAsync(context);

        // THEN no response body is written (middleware only acts on exceptions)
        Assert.Equal(0, context.Response.Body.Length);
    }

    [Fact]
    public async Task InvokeAsync_NoExceptionThrown_DoesNotLogError()
    {
        // GIVEN a middleware instance whose "next" delegate completes without throwing
        var logger = new RecordingLogger();
        var middleware = new ExceptionHandlingMiddleware(_ => Task.CompletedTask, logger);
        var context = CreateHttpContext();

        // WHEN invoking the middleware
        await middleware.InvokeAsync(context);

        // THEN no error is logged (nothing went wrong)
        Assert.Equal(0, logger.ErrorCallCount);
    }

    [Fact]
    public async Task InvokeAsync_ExceptionThrown_LogsErrorWithOriginalExceptionBeforeResponding()
    {
        // GIVEN a middleware instance whose "next" delegate throws
        var logger = new RecordingLogger();
        var thrown = new InvalidOperationException("boom");
        var middleware = new ExceptionHandlingMiddleware(_ => throw thrown, logger);
        var context = CreateHttpContext();

        // WHEN invoking the middleware
        await middleware.InvokeAsync(context);

        // THEN the exact exception instance was logged exactly once at Error level
        Assert.Equal(1, logger.ErrorCallCount);
        Assert.Same(thrown, logger.LastException);
    }

    [Fact]
    public async Task InvokeAsync_ExceptionThrown_SwallowsExceptionInsteadOfPropagating()
    {
        // GIVEN a middleware instance whose "next" delegate throws
        var logger = new RecordingLogger();
        var middleware = new ExceptionHandlingMiddleware(_ => throw new InvalidOperationException("boom"), logger);
        var context = CreateHttpContext();

        // WHEN invoking the middleware
        // THEN no exception escapes InvokeAsync (the middleware is the last line of defense)
        var exception = await Record.ExceptionAsync(() => middleware.InvokeAsync(context));
        Assert.Null(exception);
    }

    [Fact]
    public async Task InvokeAsync_ExceptionThrown_ResponseBodyContainsExactlyThreeKeys()
    {
        // GIVEN a middleware instance whose "next" delegate throws
        var logger = new RecordingLogger();
        var middleware = new ExceptionHandlingMiddleware(_ => throw new InvalidOperationException("boom"), logger);
        var context = CreateHttpContext();

        // WHEN invoking the middleware
        await middleware.InvokeAsync(context);
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var json = await JsonDocument.ParseAsync(context.Response.Body);

        // THEN the response body has exactly 3 top-level keys (status, title, detail) — no
        // extra diagnostic fields are ever added
        var propertyNames = json.RootElement.EnumerateObject().Select(p => p.Name).ToList();
        Assert.Equal(3, propertyNames.Count);
        Assert.Contains("status", propertyNames);
        Assert.Contains("title", propertyNames);
        Assert.Contains("detail", propertyNames);
    }

    [Fact]
    public async Task InvokeAsync_ExceptionThrown_StatusFieldIsJsonNumberNotString()
    {
        // GIVEN a middleware instance whose "next" delegate throws
        var logger = new RecordingLogger();
        var middleware = new ExceptionHandlingMiddleware(_ => throw new InvalidOperationException("boom"), logger);
        var context = CreateHttpContext();

        // WHEN invoking the middleware
        await middleware.InvokeAsync(context);
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var json = await JsonDocument.ParseAsync(context.Response.Body);

        // THEN "status" is serialized as a JSON number (500), not a string, matching RFC 7807
        var status = json.RootElement.GetProperty("status");
        Assert.Equal(JsonValueKind.Number, status.ValueKind);
        Assert.Equal(500, status.GetInt32());
    }

    [Fact]
    public async Task InvokeAsync_ExceptionThrown_DetailFieldIsJsonNullLiteralNotOmitted()
    {
        // GIVEN a middleware instance whose "next" delegate throws
        var logger = new RecordingLogger();
        var middleware = new ExceptionHandlingMiddleware(_ => throw new InvalidOperationException("boom"), logger);
        var context = CreateHttpContext();

        // WHEN invoking the middleware
        await middleware.InvokeAsync(context);
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var json = await JsonDocument.ParseAsync(context.Response.Body);

        // THEN "detail" is present as an explicit JSON null (not omitted from the payload) —
        // this guards the fix documented in the Dev Agent Record for the
        // [JsonIgnore(Condition = WhenWritingNull)] attribute on ProblemDetails.Detail
        var detail = json.RootElement.GetProperty("detail");
        Assert.Equal(JsonValueKind.Null, detail.ValueKind);
    }

    [Fact]
    public async Task InvokeAsync_ExceptionThrown_SetsContentTypeHeaderDirectlyOnResponse()
    {
        // GIVEN a middleware instance whose "next" delegate throws
        var logger = new RecordingLogger();
        var middleware = new ExceptionHandlingMiddleware(_ => throw new InvalidOperationException("boom"), logger);
        var context = CreateHttpContext();

        // WHEN invoking the middleware
        await middleware.InvokeAsync(context);

        // THEN the Content-Type header is application/problem+json (verified at the
        // HttpContext level, independent of any HttpClient/WebApplicationFactory parsing)
        Assert.StartsWith("application/problem+json", context.Response.ContentType);
    }
}
