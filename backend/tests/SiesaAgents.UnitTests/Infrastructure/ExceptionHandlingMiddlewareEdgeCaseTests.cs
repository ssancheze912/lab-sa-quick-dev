using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Edge case and boundary tests for ExceptionHandlingMiddleware (Story 1.3 - AC2).
/// Expands coverage beyond the ATDD phase: exception type variety, response body structure,
/// header completeness, and sequential exception handling stability.
/// </summary>
public class ExceptionHandlingMiddlewareEdgeCaseTests
{
    // -------------------------------------------------------------------------
    // Error path: ArgumentException (common business-layer exception type)
    // -------------------------------------------------------------------------

    [Fact]
    public async Task InvokeAsync_WhenArgumentExceptionThrown_ReturnsStatusCode500()
    {
        // GIVEN: Middleware wraps a delegate that throws ArgumentException
        var middleware = new ExceptionHandlingMiddleware(next: (_) =>
            throw new ArgumentException("Invalid argument value"));

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Status is still 500 — middleware does not rethrow or forward 400 for ArgumentException
        Assert.Equal(500, context.Response.StatusCode);
    }

    // -------------------------------------------------------------------------
    // Error path: NullReferenceException — common unhandled exception in production
    // -------------------------------------------------------------------------

    [Fact]
    public async Task InvokeAsync_WhenNullReferenceExceptionThrown_ReturnsStatusCode500()
    {
        // GIVEN: Middleware wraps a delegate that throws NullReferenceException
        var middleware = new ExceptionHandlingMiddleware(next: (_) =>
            throw new NullReferenceException("Object reference not set to an instance of an object"));

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Returns 500 (generic server error) without leaking NullReferenceException details
        Assert.Equal(500, context.Response.StatusCode);
    }

    // -------------------------------------------------------------------------
    // Error path: InvalidOperationException — typical service-layer exception
    // -------------------------------------------------------------------------

    [Fact]
    public async Task InvokeAsync_WhenInvalidOperationExceptionThrown_ReturnsContentTypeProblemJson()
    {
        // GIVEN: Middleware wraps a delegate that throws InvalidOperationException
        var middleware = new ExceptionHandlingMiddleware(next: (_) =>
            throw new InvalidOperationException("Operation is not valid in the current state"));

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Content-Type is always application/problem+json regardless of exception type
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    // -------------------------------------------------------------------------
    // Boundary: Response body for any exception type must include 'status' and 'title'
    // -------------------------------------------------------------------------

    [Theory]
    [InlineData(typeof(Exception), "Generic base exception")]
    [InlineData(typeof(InvalidOperationException), "Service operation failure")]
    [InlineData(typeof(ArgumentNullException), "Null argument passed")]
    public async Task InvokeAsync_ForAnyExceptionType_ReturnsProblemDetailsWithStatusAndTitle(
        Type exceptionType, string message)
    {
        // GIVEN: Middleware wraps a delegate that throws any common exception type
        var middleware = new ExceptionHandlingMiddleware(next: (_) =>
        {
            throw (Exception)Activator.CreateInstance(exceptionType, message)!;
        });

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Body contains RFC 7807 Problem Details with 'status' = 500 and non-empty 'title'
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();

        var doc = JsonDocument.Parse(body);

        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            "Response must contain 'status' field for any exception type");
        Assert.Equal(500, statusProp.GetInt32());

        Assert.True(doc.RootElement.TryGetProperty("title", out var titleProp),
            "Response must contain 'title' field for any exception type");
        Assert.False(string.IsNullOrWhiteSpace(titleProp.GetString()),
            "'title' must not be empty for any exception type");
    }

    // -------------------------------------------------------------------------
    // Boundary: 'detail' field is null for all exception types (NFR6: no leakage)
    // -------------------------------------------------------------------------

    [Fact]
    public async Task InvokeAsync_ForAnyException_DetailFieldIsNull()
    {
        // GIVEN: Middleware with a faulting delegate (any exception)
        var middleware = new ExceptionHandlingMiddleware(next: (_) =>
            throw new Exception("Internal error that MUST NOT be leaked to caller"));

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: 'detail' field is null — exception message is NOT exposed in the response body
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();

        var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("detail", out var detailProp),
            "'detail' field must be present in Problem Details");

        // Per architecture spec: detail must be null — never the raw exception message
        Assert.Equal(JsonValueKind.Null, detailProp.ValueKind);
    }

    // -------------------------------------------------------------------------
    // Boundary: Exception message text must NOT appear in the response body
    // -------------------------------------------------------------------------

    [Fact]
    public async Task InvokeAsync_WhenExceptionHasSensitiveMessage_DoesNotExposeMessageInBody()
    {
        // GIVEN: Middleware catches an exception with a sensitive internal message
        const string sensitiveMessage = "ConnectionString=postgres://admin:SuperSecret@db:5432/prod";

        var middleware = new ExceptionHandlingMiddleware(next: (_) =>
            throw new Exception(sensitiveMessage));

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: The sensitive message does NOT appear in the response body
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();

        Assert.DoesNotContain(sensitiveMessage, body);
        Assert.DoesNotContain("SuperSecret", body);
        Assert.DoesNotContain("ConnectionString", body);
    }

    // -------------------------------------------------------------------------
    // Boundary: Sequential exceptions — middleware handles multiple calls correctly
    // -------------------------------------------------------------------------

    [Fact]
    public async Task InvokeAsync_CalledMultipleTimes_EachCallReturns500Independently()
    {
        // GIVEN: A middleware instance used for multiple requests (singleton-like scenario)
        var middleware = new ExceptionHandlingMiddleware(next: (_) =>
            throw new Exception("Repeated failure"));

        // WHEN: The middleware is invoked sequentially for multiple requests
        for (int i = 0; i < 3; i++)
        {
            var context = new DefaultHttpContext();
            context.Response.Body = new MemoryStream();

            await middleware.InvokeAsync(context);

            // THEN: Each call independently returns 500 with Problem Details
            Assert.Equal(500, context.Response.StatusCode);
            Assert.Equal("application/problem+json", context.Response.ContentType);
        }
    }

    // -------------------------------------------------------------------------
    // Boundary: Middleware does not modify status code when no exception occurs
    //           (middleware must be transparent on the happy path)
    // -------------------------------------------------------------------------

    [Fact]
    public async Task InvokeAsync_WhenNoException_ContentTypeIsNotOverwritten()
    {
        // GIVEN: A next delegate that sets its own Content-Type and status
        var middleware = new ExceptionHandlingMiddleware(next: async (ctx) =>
        {
            ctx.Response.StatusCode = 200;
            ctx.Response.ContentType = "application/json";
            await ctx.Response.WriteAsync("{\"result\":\"ok\"}");
        });

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware processes a successful request
        await middleware.InvokeAsync(context);

        // THEN: Content-Type is left as-is — middleware does NOT overwrite success responses
        Assert.Equal("application/json", context.Response.ContentType);
        Assert.Equal(200, context.Response.StatusCode);
    }

    // -------------------------------------------------------------------------
    // Boundary: Deeply nested exception causes (inner exceptions) — must not be leaked
    // -------------------------------------------------------------------------

    [Fact]
    public async Task InvokeAsync_WhenExceptionHasInnerException_DoesNotExposeInnerExceptionInBody()
    {
        // GIVEN: Middleware catches an exception with nested inner exceptions
        var inner = new InvalidOperationException("Inner: DB connection refused at 10.0.0.5:5432");
        var outer = new Exception("Outer: Service initialization failed", inner);

        var middleware = new ExceptionHandlingMiddleware(next: (_) => throw outer);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Neither the inner nor the outer exception messages appear in the response body
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();

        Assert.DoesNotContain("DB connection refused", body);
        Assert.DoesNotContain("10.0.0.5", body);
        Assert.DoesNotContain("Service initialization failed", body);
        Assert.DoesNotContain("InnerException", body, StringComparison.OrdinalIgnoreCase);
    }

    // -------------------------------------------------------------------------
    // Boundary: Problem Details response is valid JSON (parseable without error)
    // -------------------------------------------------------------------------

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyIsValidJson()
    {
        // GIVEN: Middleware wraps a faulting delegate
        var middleware = new ExceptionHandlingMiddleware(next: (_) =>
            throw new Exception("Any unhandled error"));

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: The response body parses as valid JSON without throwing
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();

        var exception = Record.Exception(() => JsonDocument.Parse(body));
        Assert.Null(exception);
    }
}
