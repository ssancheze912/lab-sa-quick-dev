using System.Text.Json;
using Microsoft.AspNetCore.Http;
using SiesaAgents.API.Middleware;
using Xunit;

namespace SiesaAgents.UnitTests.API;

/// <summary>
/// Unit tests for ExceptionHandlingMiddleware — edge cases and boundary conditions.
/// Complements the ATDD E2E test that verifies Problem Details format at the HTTP level.
///
/// Story 1.3 additions (RED phase — will pass once ExceptionHandlingMiddleware adds the
/// Type = "https://tools.ietf.org/html/rfc7807" field per AC2):
///   - InvokeAsync_ShouldIncludeTypeField_WithRfc7807Uri_InProblemDetailsResponse
///   - InvokeAsync_ShouldNotExposeStackTrace_InResponseBody
/// </summary>
public class ExceptionHandlingMiddlewareTests
{
    // ─── Happy path: exception-free request passes through unchanged ──────────

    [Fact]
    public async Task InvokeAsync_ShouldCallNext_WhenNoExceptionIsThrown()
    {
        // Arrange
        var nextCalled = false;
        RequestDelegate next = _ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.True(nextCalled, "next delegate must be called when no exception is thrown");
    }

    [Fact]
    public async Task InvokeAsync_ShouldNotModifyStatusCode_WhenNoExceptionIsThrown()
    {
        // Arrange
        RequestDelegate next = ctx =>
        {
            ctx.Response.StatusCode = 200;
            return Task.CompletedTask;
        };

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — middleware must not overwrite the downstream status code
        Assert.Equal(200, context.Response.StatusCode);
    }

    // ─── Exception path: correct RFC 7807 Problem Details response ───────────

    [Fact]
    public async Task InvokeAsync_ShouldReturn500_WhenExceptionIsThrown()
    {
        // Arrange
        RequestDelegate next = _ => throw new InvalidOperationException("boom");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(500, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_ShouldSetContentType_ToProblemJson_WhenExceptionIsThrown()
    {
        // Arrange
        RequestDelegate next = _ => throw new Exception("any error");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — RFC 7807 requires application/problem+json
        Assert.Contains("application/problem+json", context.Response.ContentType);
    }

    [Fact]
    public async Task InvokeAsync_ShouldNotExposeExceptionMessage_InResponseBody()
    {
        // Arrange — the Detail field MUST be null (never expose ex.Message)
        const string sensitiveMessage = "SUPER_SECRET_DB_PASSWORD_IN_STACK_TRACE";
        RequestDelegate next = _ => throw new Exception(sensitiveMessage);

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — sensitive details must NOT appear in the response
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.DoesNotContain(sensitiveMessage, body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task InvokeAsync_ShouldReturnValidJson_WhenExceptionIsThrown()
    {
        // Arrange
        RequestDelegate next = _ => throw new ArgumentNullException("param");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — body must be parseable JSON (not HTML error page)
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.False(string.IsNullOrWhiteSpace(body), "Response body must not be empty");

        var exception = Record.Exception(() => JsonDocument.Parse(body));
        Assert.Null(exception); // valid JSON — no parse error
    }

    [Fact]
    public async Task InvokeAsync_ShouldIncludeTitleField_InProblemDetailsResponse()
    {
        // Arrange
        RequestDelegate next = _ => throw new Exception("ignored detail");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — RFC 7807 "title" field must be present and non-empty
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        using var doc = JsonDocument.Parse(body);
        var hasTitle = doc.RootElement.TryGetProperty("title", out var titleElement);
        Assert.True(hasTitle, "Problem Details must contain a 'title' field");
        Assert.False(string.IsNullOrWhiteSpace(titleElement.GetString()), "title must not be blank");
    }

    [Fact]
    public async Task InvokeAsync_ShouldIncludeStatusField500_InProblemDetailsBody()
    {
        // Arrange
        RequestDelegate next = _ => throw new NotImplementedException();

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — RFC 7807 "status" field must echo the HTTP status code
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        using var doc = JsonDocument.Parse(body);
        var hasStatus = doc.RootElement.TryGetProperty("status", out var statusElement);
        Assert.True(hasStatus, "Problem Details must contain a 'status' field");
        Assert.Equal(500, statusElement.GetInt32());
    }

    // ─── AC2 (Story 1.3) — RFC 7807 strict compliance: Type field ────────────

    /// <summary>
    /// Given an unhandled exception occurs in the backend,
    /// When the error reaches the middleware,
    /// Then the response body includes a "type" field equal to
    /// "https://tools.ietf.org/html/rfc7807" for strict RFC 7807 compliance.
    ///
    /// RED: This test will FAIL until ExceptionHandlingMiddleware sets
    /// Type = "https://tools.ietf.org/html/rfc7807" in ProblemDetails.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_ShouldIncludeTypeField_WithRfc7807Uri_InProblemDetailsResponse()
    {
        // Arrange
        RequestDelegate next = _ => throw new Exception("any error");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — RFC 7807 "type" field must be the standard problem-details URI
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        using var doc = JsonDocument.Parse(body);
        var hasType = doc.RootElement.TryGetProperty("type", out var typeElement);
        Assert.True(hasType, "Problem Details must contain a 'type' field (RFC 7807 strict compliance)");
        Assert.Equal("https://tools.ietf.org/html/rfc7807", typeElement.GetString());
    }

    /// <summary>
    /// Given an unhandled exception occurs,
    /// When the error reaches the middleware,
    /// Then the response body does NOT contain a "stackTrace" or "stack_trace" field —
    /// no stack trace is exposed to the client (NFR6 / security requirement).
    ///
    /// RED: This test verifies the absence of stackTrace exposure — should already pass
    /// given Detail = null in Story 1.1 implementation, but added here as explicit guard.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_ShouldNotExposeStackTrace_InResponseBody()
    {
        // Arrange
        RequestDelegate next = _ => throw new Exception("some error with stacktrace");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — no stackTrace or stack_trace key in response
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.False(
            doc.RootElement.TryGetProperty("stackTrace", out _),
            "Problem Details must NOT contain a 'stackTrace' field");
        Assert.False(
            doc.RootElement.TryGetProperty("stack_trace", out _),
            "Problem Details must NOT contain a 'stack_trace' field");
        Assert.False(
            doc.RootElement.TryGetProperty("detail", out var detailProp)
                && detailProp.ValueKind != JsonValueKind.Null,
            "Problem Details 'detail' field must be null — never expose ex.Message or stack traces");
    }

    // ─── Boundary: different exception types all produce 500 ─────────────────

    [Theory]
    [InlineData(typeof(InvalidOperationException))]
    [InlineData(typeof(ArgumentNullException))]
    [InlineData(typeof(NotImplementedException))]
    [InlineData(typeof(TimeoutException))]
    [InlineData(typeof(DivideByZeroException))]
    public async Task InvokeAsync_ShouldAlwaysReturn500_ForAnyUnhandledException(Type exceptionType)
    {
        // Arrange
        var exception = (Exception)Activator.CreateInstance(exceptionType)!;
        RequestDelegate next = _ => throw exception;

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — all unhandled exception types must return HTTP 500
        Assert.Equal(500, context.Response.StatusCode);
    }

    // ─── Edge cases: body content and structure ───────────────────────────────

    [Fact]
    public async Task InvokeAsync_ShouldProduceNonEmptyResponseBody_WhenExceptionIsThrown()
    {
        // Arrange — response body must always have bytes (not an empty 500)
        RequestDelegate next = _ => throw new Exception("any error");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — body must have written bytes (ensures WriteAsJsonAsync was called)
        Assert.True(context.Response.Body.Length > 0, "Response body must not be empty after exception handling");
    }

    [Fact]
    public async Task InvokeAsync_ShouldNotIncludeDetailField_OrDetailMustBeNull_WhenExceptionIsThrown()
    {
        // Arrange — "detail" field must be absent or explicitly null (never contain ex.Message)
        RequestDelegate next = _ => throw new Exception("should not appear as detail");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        using var doc = JsonDocument.Parse(body);

        if (doc.RootElement.TryGetProperty("detail", out var detailProp))
        {
            // If "detail" key exists it MUST be null
            Assert.Equal(JsonValueKind.Null, detailProp.ValueKind);
        }
        // else: "detail" absent is equally acceptable
    }

    [Fact]
    public async Task InvokeAsync_ShouldNotIncludeErrorsField_InResponseBody()
    {
        // Arrange — "errors" is a ValidationProblemDetails field; plain 500 MUST NOT have it
        RequestDelegate next = _ => throw new Exception("generic error");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — unhandled-exception response is not a validation problem details
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.False(
            doc.RootElement.TryGetProperty("errors", out _),
            "A generic 500 ProblemDetails must NOT contain an 'errors' field");
    }

    // ─── Edge cases: aggregate and wrapped exceptions ─────────────────────────

    [Fact]
    public async Task InvokeAsync_ShouldReturn500_WhenAggregateExceptionIsThrown()
    {
        // Arrange — AggregateException wrapping multiple inner exceptions
        var inner1 = new InvalidOperationException("inner one");
        var inner2 = new TimeoutException("inner two");
        RequestDelegate next = _ => throw new AggregateException(inner1, inner2);

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — AggregateException is still an unhandled exception → 500
        Assert.Equal(500, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_ShouldNotExposeInnerExceptionMessages_WhenAggregateExceptionIsThrown()
    {
        // Arrange — inner exception messages must not leak into the response
        const string sensitiveInner = "INNER_SECRET_DB_CREDENTIALS";
        var inner = new InvalidOperationException(sensitiveInner);
        RequestDelegate next = _ => throw new AggregateException("aggregate wrapper", inner);

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.DoesNotContain(sensitiveInner, body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task InvokeAsync_ShouldReturn500_WhenExceptionWithNullMessage_IsThrown()
    {
        // Arrange — exception with null/empty message (boundary: middleware must not crash)
        RequestDelegate next = _ => throw new Exception(null!);

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        var ex = await Record.ExceptionAsync(() => middleware.InvokeAsync(context));

        // Assert — middleware must not re-throw; must return 500
        Assert.Null(ex);
        Assert.Equal(500, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_ShouldReturn500_WhenOperationCanceledExceptionIsThrown()
    {
        // Arrange — cancellation exceptions can propagate from async pipelines
        RequestDelegate next = _ => throw new OperationCanceledException();

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — OperationCanceledException is caught like any other exception → 500
        Assert.Equal(500, context.Response.StatusCode);
    }

    // ─── Edge case: middleware does NOT re-throw ──────────────────────────────

    [Fact]
    public async Task InvokeAsync_ShouldNotRethrowException_AfterHandling()
    {
        // Arrange — the middleware must swallow the exception and not propagate it
        RequestDelegate next = _ => throw new InvalidOperationException("should be swallowed");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act — record whether middleware itself throws
        var propagatedException = await Record.ExceptionAsync(() => middleware.InvokeAsync(context));

        // Assert — no exception escapes the middleware
        Assert.Null(propagatedException);
    }

    // ─── Concurrency boundary: multiple concurrent requests ───────────────────

    [Fact]
    public async Task InvokeAsync_ShouldHandle_MultipleConcurrentExceptions_Independently()
    {
        // Arrange — simulate several concurrent requests hitting the middleware at the same time
        const int concurrency = 10;

        var tasks = Enumerable.Range(0, concurrency).Select(async _ =>
        {
            RequestDelegate next = _ => throw new Exception("concurrent error");
            var middleware = new ExceptionHandlingMiddleware(next);
            var ctx = new DefaultHttpContext();
            ctx.Response.Body = new MemoryStream();
            await middleware.InvokeAsync(ctx);
            return ctx.Response.StatusCode;
        });

        // Act
        var results = await Task.WhenAll(tasks);

        // Assert — every concurrent invocation must independently produce 500
        Assert.All(results, statusCode => Assert.Equal(500, statusCode));
    }
}
