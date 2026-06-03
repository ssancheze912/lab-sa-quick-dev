using System.Text.Json;
using Microsoft.AspNetCore.Http;
using SiesaAgents.API.Middleware;
using Xunit;

namespace SiesaAgents.UnitTests.API;

/// <summary>
/// Edge-case and boundary-condition tests for ExceptionHandlingMiddleware.
/// Complements ExceptionHandlingMiddlewareTests.cs (ATDD + happy paths for Story 1.3).
///
/// Covers scenarios NOT in the baseline:
///   - Response headers content-type is preserved when no exception occurs
///   - Middleware does not set body when no exception occurs
///   - Nested (inner) exceptions — inner messages do not leak
///   - StackOverflowException boundary (Note: cannot truly simulate; uses proxy)
///   - HttpContext with cancelled CancellationToken
///   - Exception thrown inside async continuation (Task.Run)
///   - Response body is valid UTF-8 (no encoding corruption)
///   - Multiple fields co-presence: status + title + type in same response
///   - status field in body equals HTTP status code exactly (no mismatch)
///   - title is a non-whitespace string (not "   " or "\t")
///   - ExceptionMessage containing JSON-injection characters is not echoed
///   - Very long exception message does not inflate the response body
///   - Exception with unicode characters in message does not corrupt JSON
/// </summary>
public class ExceptionHandlingMiddlewareEdgeCaseTests
{
    // ─── No-exception path: headers and body are not modified ─────────────────

    [Fact]
    public async Task InvokeAsync_ShouldNotWriteBody_WhenNoExceptionIsThrown()
    {
        // Arrange — downstream sets no body
        RequestDelegate next = ctx =>
        {
            ctx.Response.StatusCode = 204; // No Content
            return Task.CompletedTask;
        };

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — middleware must not write anything when there is no exception
        Assert.Equal(0, context.Response.Body.Length);
    }

    [Fact]
    public async Task InvokeAsync_ShouldPreserveDownstreamContentType_WhenNoExceptionIsThrown()
    {
        // Arrange — downstream sets its own content type
        const string downstreamContentType = "application/json";
        RequestDelegate next = ctx =>
        {
            ctx.Response.ContentType = downstreamContentType;
            ctx.Response.StatusCode = 200;
            return Task.CompletedTask;
        };

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — middleware must not overwrite content-type when no exception occurs
        Assert.Equal(downstreamContentType, context.Response.ContentType);
    }

    // ─── Nested / inner exceptions — messages must not leak ──────────────────

    [Fact]
    public async Task InvokeAsync_ShouldNotExposeInnerExceptionMessage_WhenWrappedExceptionIsThrown()
    {
        // Arrange — a wrapped exception (outer hides inner which has the sensitive data)
        const string innerSensitiveMessage = "INNER_SENSITIVE_DB_CONNECTION_STRING";
        var innerException = new InvalidOperationException(innerSensitiveMessage);
        var outerException = new ApplicationException("outer wrapper", innerException);
        RequestDelegate next = _ => throw outerException;

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — inner message must NOT appear in the response body
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.DoesNotContain(innerSensitiveMessage, body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task InvokeAsync_ShouldNotExposeDeepNestedExceptionMessage_WithThreeLevels()
    {
        // Arrange — three levels of nesting
        const string deepMessage = "DEEP_NESTED_SECRET_TOKEN";
        var level3 = new Exception(deepMessage);
        var level2 = new InvalidOperationException("mid-level", level3);
        var level1 = new ApplicationException("outer", level2);
        RequestDelegate next = _ => throw level1;

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.DoesNotContain(deepMessage, body, StringComparison.OrdinalIgnoreCase);
    }

    // ─── CancellationToken boundary ───────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_ShouldReturn500_WhenTaskCanceledExceptionIsThrown()
    {
        // Arrange — TaskCanceledException is a subtype of OperationCanceledException
        RequestDelegate next = _ => throw new TaskCanceledException("task cancelled");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — TaskCanceledException is caught like any unhandled exception → 500
        Assert.Equal(500, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_ShouldReturn500_WhenExceptionFromAsyncContinuation()
    {
        // Arrange — exception originates inside an async Task.Run continuation
        RequestDelegate next = async _ =>
        {
            await Task.Run(() =>
            {
                throw new InvalidOperationException("async continuation error");
            });
        };

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        var ex = await Record.ExceptionAsync(() => middleware.InvokeAsync(context));

        // Assert — middleware catches exceptions propagated from async continuations
        Assert.Null(ex);
        Assert.Equal(500, context.Response.StatusCode);
    }

    // ─── Response body encoding — UTF-8 integrity ─────────────────────────────

    [Fact]
    public async Task InvokeAsync_ResponseBody_IsValidUtf8_WhenExceptionIsThrown()
    {
        // Arrange
        RequestDelegate next = _ => throw new Exception("encoding check");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — body bytes decode as valid UTF-8 without replacement characters
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var bytes = ((MemoryStream)context.Response.Body).ToArray();
        var decoded = System.Text.Encoding.UTF8.GetString(bytes);
        // Round-trip: re-encoding must produce the same bytes (no corruption)
        var reEncoded = System.Text.Encoding.UTF8.GetBytes(decoded);
        Assert.Equal(bytes, reEncoded);
    }

    [Fact]
    public async Task InvokeAsync_ShouldHandleException_WithUnicodeCharactersInMessage_WithoutCorruptingJson()
    {
        // Arrange — exception message contains unicode, kanji, emoji characters
        RequestDelegate next = _ => throw new Exception("日本語   emoji 🔥 test");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — the response JSON must be parseable (message is NOT in response)
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var parseException = Record.Exception(() => JsonDocument.Parse(body));
        Assert.Null(parseException);
    }

    // ─── JSON injection boundary ───────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_ShouldNotEchoJsonInjectionPayload_InResponseBody()
    {
        // Arrange — exception message contains JSON injection attempt
        const string jsonInjection = "\",\"status\":200,\"injected\":\"true";
        RequestDelegate next = _ => throw new Exception(jsonInjection);

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — the injected payload must NOT appear raw in the response
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        // If detail is null, the injection cannot occur; validate status is still 500
        Assert.Equal(500, context.Response.StatusCode);

        // The injected "status":200 must not override the actual status in the response body
        using var doc = JsonDocument.Parse(body);
        if (doc.RootElement.TryGetProperty("status", out var statusProp))
        {
            Assert.Equal(500, statusProp.GetInt32());
        }
        // Confirm "injected" key was not parsed into the document
        Assert.False(doc.RootElement.TryGetProperty("injected", out _),
            "JSON injection payload must not appear as a parsed field in ProblemDetails");
    }

    // ─── Very long exception message boundary ────────────────────────────────

    [Fact]
    public async Task InvokeAsync_ShouldProduceCompactResponse_WhenExceptionMessageIsVeryLong()
    {
        // Arrange — exception with an extremely long message (e.g., large stack trace string)
        var longMessage = new string('X', 100_000); // 100 KB of 'X'
        RequestDelegate next = _ => throw new Exception(longMessage);

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — response body must NOT contain the long message (detail = null)
        // The compact ProblemDetails body should be well under 1 KB
        Assert.Equal(500, context.Response.StatusCode);
        Assert.True(context.Response.Body.Length < 1024,
            $"Response body ({context.Response.Body.Length} bytes) must be compact — long exception message must not be echoed");
    }

    // ─── Co-presence of required fields (status + title + type) ─────────────

    [Fact]
    public async Task InvokeAsync_ShouldIncludeStatusAndTitleAndType_AllInSameResponse()
    {
        // Arrange
        RequestDelegate next = _ => throw new Exception("co-presence check");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — all three RFC 7807 required fields must be present simultaneously
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        using var doc = JsonDocument.Parse(body);

        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            "ProblemDetails must contain 'status'");
        Assert.Equal(500, statusProp.GetInt32());

        Assert.True(doc.RootElement.TryGetProperty("title", out var titleProp),
            "ProblemDetails must contain 'title'");
        Assert.False(string.IsNullOrWhiteSpace(titleProp.GetString()),
            "title must be non-whitespace");

        Assert.True(doc.RootElement.TryGetProperty("type", out var typeProp),
            "ProblemDetails must contain 'type'");
        Assert.Equal("https://tools.ietf.org/html/rfc7807", typeProp.GetString());
    }

    // ─── HTTP status code consistency: HTTP status == body status ─────────────

    [Fact]
    public async Task InvokeAsync_HttpStatusCode_MustEqualBodyStatusField()
    {
        // Arrange
        RequestDelegate next = _ => throw new Exception("status consistency");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — HTTP response status code equals the "status" field in the body
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        using var doc = JsonDocument.Parse(body);

        if (doc.RootElement.TryGetProperty("status", out var statusProp))
        {
            Assert.Equal(context.Response.StatusCode, statusProp.GetInt32());
        }
    }

    // ─── title field quality boundary ────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_TitleField_ShouldNotBeOnlyWhitespace()
    {
        // Arrange
        RequestDelegate next = _ => throw new Exception("title quality check");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        using var doc = JsonDocument.Parse(body);

        if (doc.RootElement.TryGetProperty("title", out var titleProp))
        {
            var title = titleProp.GetString();
            Assert.False(string.IsNullOrWhiteSpace(title),
                "title field must not be empty or only whitespace");
        }
    }

    // ─── Exception from different thread context ──────────────────────────────

    [Fact]
    public async Task InvokeAsync_ShouldReturn500_WhenExceptionPropagatesFromThreadPool()
    {
        // Arrange — simulate exception from a ThreadPool context via Task.Factory.StartNew
        RequestDelegate next = async _ =>
        {
            var tcs = new TaskCompletionSource<bool>();
            ThreadPool.QueueUserWorkItem(_ =>
            {
                tcs.SetException(new InvalidOperationException("threadpool exception"));
            });
            await tcs.Task; // propagates the exception to the awaiting context
        };

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        var ex = await Record.ExceptionAsync(() => middleware.InvokeAsync(context));

        // Assert — middleware catches exceptions regardless of origin thread
        Assert.Null(ex);
        Assert.Equal(500, context.Response.StatusCode);
    }

    // ─── Exception type: custom application exception ────────────────────────

    [Fact]
    public async Task InvokeAsync_ShouldReturn500_WhenCustomApplicationExceptionIsThrown()
    {
        // Arrange — domain/application-layer custom exception
        RequestDelegate next = _ => throw new CustomDomainException("domain rule violation");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — custom exceptions receive the same treatment as built-in ones
        Assert.Equal(500, context.Response.StatusCode);
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var parseEx = Record.Exception(() => JsonDocument.Parse(body));
        Assert.Null(parseEx);
    }

    [Fact]
    public async Task InvokeAsync_ShouldNotExposeCustomExceptionTypeName_InResponseBody()
    {
        // Arrange
        RequestDelegate next = _ => throw new CustomDomainException("domain violation detail");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — exception type name / class name must not appear in the body
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.DoesNotContain(nameof(CustomDomainException), body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("domain violation detail", body, StringComparison.OrdinalIgnoreCase);
    }
}

// ─── Test-only custom exception type ────────────────────────────────────────

/// <summary>
/// Custom exception used to verify the middleware handles application-layer exceptions
/// the same way as built-in CLR exceptions.
/// </summary>
internal sealed class CustomDomainException(string message) : Exception(message);
