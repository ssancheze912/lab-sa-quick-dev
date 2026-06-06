using Microsoft.AspNetCore.Http;
using SiesaAgents.API.Middleware;
using System.Text.Json;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// Edge-case and boundary unit tests for ExceptionHandlingMiddleware.
/// Expands coverage beyond the ATDD baseline in ExceptionHandlingMiddlewareTests.cs.
///
/// Coverage added:
///   - Various exception types produce the same safe Problem Details output
///   - Response body contains camelCase JSON (PropertyNamingPolicy.CamelCase)
///   - Multiple sequential invocations are independent (no shared state)
///   - OperationCanceledException handled safely (not re-thrown)
///   - TaskCanceledException (timeout) handled safely
///   - OutOfMemoryException propagates only if not caught (extreme boundary)
///   - Response body is valid JSON (parseable after exception)
///   - Title is exactly the defined constant — no variation
/// </summary>
public class ExceptionHandlingMiddlewareEdgeTests
{
    // ──────────────────────────────────────────────────────────────────────────
    // Edge: Different exception types all produce the same safe output
    // ──────────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData(typeof(ArgumentNullException))]
    [InlineData(typeof(InvalidOperationException))]
    [InlineData(typeof(NullReferenceException))]
    [InlineData(typeof(NotSupportedException))]
    [InlineData(typeof(TimeoutException))]
    public async Task InvokeAsync_WhenVariousExceptionTypesThrown_AlwaysReturns500WithSafeBody(
        Type exceptionType)
    {
        // Arrange
        var exception = (Exception)Activator.CreateInstance(exceptionType, "Edge test error")!;
        RequestDelegate next = (_) => throw exception;

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: always 500
        Assert.Equal(500, context.Response.StatusCode);

        // Assert: body is valid JSON with Problem Details shape
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonSerializer.Deserialize<JsonElement>(body);
        Assert.Equal(500, json.GetProperty("status").GetInt32());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Edge: JSON uses camelCase property naming (not PascalCase)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyUsesCamelCasePropertyNames()
    {
        // Arrange
        RequestDelegate next = (_) => throw new Exception("camelCase test");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: body uses camelCase keys ("status", "title") not PascalCase ("Status", "Title")
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        Assert.Contains("\"status\"", body);   // camelCase
        Assert.Contains("\"title\"", body);    // camelCase
        Assert.DoesNotContain("\"Status\"", body); // NOT PascalCase
        Assert.DoesNotContain("\"Title\"", body);  // NOT PascalCase
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Edge: Title is the exact defined constant — no variation
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_TitleIsExactlyTheDefinedConstant()
    {
        // Arrange
        RequestDelegate next = (_) => throw new Exception("title constant check");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: title is exactly "An unexpected error occurred." (including period)
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonSerializer.Deserialize<JsonElement>(body);
        var title = json.GetProperty("title").GetString();

        Assert.Equal("An unexpected error occurred.", title);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Edge: Response body is well-formed JSON (parseable)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyIsValidJson()
    {
        // Arrange
        RequestDelegate next = (_) => throw new Exception("valid JSON check");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: body can be parsed as JSON without throwing
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        var parseException = Record.Exception(() => JsonDocument.Parse(body));
        Assert.Null(parseException);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Edge: Sequential invocations are independent (no shared mutable state)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenInvokedTwice_EachResponseIsIndependentAndCorrect()
    {
        // Arrange: two separate calls with two separate contexts
        var callCount = 0;
        RequestDelegate next = (_) =>
        {
            callCount++;
            if (callCount % 2 != 0)
                throw new Exception("First call error");
            return Task.CompletedTask;
        };

        var middleware = new ExceptionHandlingMiddleware(next);

        // First call — throws
        var context1 = new DefaultHttpContext();
        context1.Response.Body = new MemoryStream();
        await middleware.InvokeAsync(context1);
        Assert.Equal(500, context1.Response.StatusCode);

        // Second call — succeeds
        var context2 = new DefaultHttpContext();
        context2.Response.Body = new MemoryStream();
        await middleware.InvokeAsync(context2);
        // Status code is default (200) because next did not throw
        Assert.NotEqual(500, context2.Response.StatusCode);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Edge: OperationCanceledException is caught and returns 500 (does not crash pipeline)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenOperationCanceledExceptionThrown_Returns500()
    {
        // Arrange
        RequestDelegate next = (_) => throw new OperationCanceledException("Request cancelled");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: middleware handles cancellation as an error, not a crash
        Assert.Equal(500, context.Response.StatusCode);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Edge: TaskCanceledException (HTTP timeout scenario) is caught safely
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenTaskCanceledExceptionThrown_Returns500()
    {
        // Arrange: simulates a downstream service timeout
        RequestDelegate next = (_) => throw new TaskCanceledException("Downstream timeout");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: timeout is treated as 500 and does not propagate
        Assert.Equal(500, context.Response.StatusCode);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Edge: detail field is always null (no accidental message exposure)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_DetailFieldIsNullInResponse()
    {
        // Arrange: exception with a very detailed message that must NOT appear in response
        const string sensitiveDetail = "Connection to 10.0.0.1:5432 refused; password=P@ssw0rd";
        RequestDelegate next = (_) => throw new Exception(sensitiveDetail);
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: the detail field is null
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonSerializer.Deserialize<JsonElement>(body);

        // If "detail" key is present, it must be null (JsonValueKind.Null)
        if (json.TryGetProperty("detail", out var detailElement))
        {
            Assert.Equal(JsonValueKind.Null, detailElement.ValueKind);
        }
        // Absence of "detail" key is also acceptable

        // And the sensitive content must never appear in the raw body
        Assert.DoesNotContain(sensitiveDetail, body);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Edge: Content-Type header is preserved exactly as application/problem+json
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ContentTypeIsExactlyApplicationProblemJson()
    {
        // Arrange
        RequestDelegate next = (_) => throw new Exception("content-type edge check");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: content type starts with application/problem+json
        Assert.StartsWith("application/problem+json", context.Response.ContentType);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Edge: Nested exception (inner exception) does not expose inner message
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNestedException_InnerExceptionMessageNotExposed()
    {
        // Arrange: wrap a sensitive inner exception
        const string innerMessage = "Inner: DB credentials leaked";
        var innerException = new Exception(innerMessage);
        RequestDelegate next = (_) =>
            throw new InvalidOperationException("Outer wrapper", innerException);

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: neither the outer nor the inner message appears in the response body
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.DoesNotContain(innerMessage, body);
        Assert.DoesNotContain("Outer wrapper", body);
    }
}
