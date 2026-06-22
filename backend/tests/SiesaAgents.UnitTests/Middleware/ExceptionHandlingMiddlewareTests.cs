using System.IO;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// Unit tests for ExceptionHandlingMiddleware — Story 1.3 AC2 / NFR6.
/// These tests are in RED phase. They will fail until ExceptionHandlingMiddleware
/// is created at backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs.
///
/// Test IDs: UNIT-F-04, UNIT-F-05
/// </summary>
public class ExceptionHandlingMiddlewareTests
{
    /// <summary>
    /// UNIT-F-04 (P1 — AC2)
    /// Given an unhandled exception occurs during request processing
    /// When the ExceptionHandlingMiddleware catches the exception
    /// Then the HTTP response status is 500 (Internal Server Error)
    /// And the response body is valid JSON with status, title, and detail fields (RFC 7807)
    /// </summary>
    [Fact]
    public async Task InvokeAsync_UnhandledException_ReturnsProblemDetailsWithRequiredFields()
    {
        // Arrange
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception("boom"),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonDocument.Parse(body).RootElement;

        // Assert — HTTP status must be 500
        Assert.Equal(500, context.Response.StatusCode);

        // Assert — Problem Details RFC 7807 required fields must be present
        Assert.True(json.TryGetProperty("status", out var statusProp),
            "Problem Details must contain 'status' field");
        Assert.Equal(JsonValueKind.Number, statusProp.ValueKind);

        Assert.True(json.TryGetProperty("title", out var titleProp),
            "Problem Details must contain 'title' field");
        Assert.Equal(JsonValueKind.String, titleProp.ValueKind);
        Assert.False(string.IsNullOrWhiteSpace(titleProp.GetString()),
            "'title' field must not be empty");

        Assert.True(json.TryGetProperty("detail", out var detailProp),
            "Problem Details must contain 'detail' field");
        Assert.Equal(JsonValueKind.String, detailProp.ValueKind);
    }

    /// <summary>
    /// UNIT-F-05 (P1 — AC2 / NFR6)
    /// Given an unhandled exception with sensitive details (stack trace, type name)
    /// When the ExceptionHandlingMiddleware catches and serializes the exception
    /// Then the response body does NOT contain stackTrace in any form
    /// And the response body does NOT contain the exception type name
    /// And the response body does NOT contain the original exception message
    /// </summary>
    [Fact]
    public async Task InvokeAsync_UnhandledException_DoesNotExposeStackTraceOrExceptionType()
    {
        // Arrange — use an exception with an identifiable message to confirm it is NOT leaked
        const string sensitiveMessage = "secret-internal-database-password-leak-test";
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new InvalidOperationException(sensitiveMessage),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        // Assert — no stack trace fields (NFR6)
        Assert.DoesNotContain("stackTrace", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("stack_trace", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("StackTrace", body);

        // Assert — no exception type names in response
        Assert.DoesNotContain("InvalidOperationException", body);
        Assert.DoesNotContain("System.", body);
        Assert.DoesNotContain("Exception", body);

        // Assert — sensitive exception message must not leak
        Assert.DoesNotContain(sensitiveMessage, body);

        // Assert — no " at " patterns from stack traces
        Assert.DoesNotContain(" at ", body, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// UNIT-F-04b (P1 — AC2)
    /// Given an ArgumentException (bad request type) occurs during request processing
    /// When the ExceptionHandlingMiddleware catches the exception
    /// Then the HTTP response status is 400 (Bad Request)
    /// And the response body is valid RFC 7807 Problem Details
    /// </summary>
    [Fact]
    public async Task InvokeAsync_ArgumentException_Returns400BadRequest()
    {
        // Arrange
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new ArgumentException("invalid input"),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonDocument.Parse(body).RootElement;

        // Assert
        Assert.Equal(400, context.Response.StatusCode);
        Assert.True(json.TryGetProperty("status", out _),
            "Problem Details must contain 'status' field");
        Assert.True(json.TryGetProperty("title", out _),
            "Problem Details must contain 'title' field");
    }

    /// <summary>
    /// UNIT-F-04c (P1 — AC2)
    /// Given a KeyNotFoundException (not found type) occurs during request processing
    /// When the ExceptionHandlingMiddleware catches the exception
    /// Then the HTTP response status is 404 (Not Found)
    /// And the response body contains Problem Details with status = 404
    /// </summary>
    [Fact]
    public async Task InvokeAsync_KeyNotFoundException_Returns404NotFound()
    {
        // Arrange
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new KeyNotFoundException("resource not found"),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonDocument.Parse(body).RootElement;

        // Assert
        Assert.Equal(404, context.Response.StatusCode);
        Assert.True(json.TryGetProperty("status", out var statusProp));
        Assert.Equal(404, statusProp.GetInt32());
    }

    /// <summary>
    /// UNIT-F-04d (P1 — AC2)
    /// Given an unhandled exception occurs
    /// When the middleware writes the response
    /// Then the Content-Type header is application/problem+json (RFC 7807)
    /// And NOT plain application/json
    /// </summary>
    [Fact]
    public async Task InvokeAsync_UnhandledException_SetsContentTypeToProblemJson()
    {
        // Arrange
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception("test"),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — Content-Type must contain problem+json per RFC 7807 (AC2)
        var contentType = context.Response.ContentType ?? string.Empty;
        Assert.Contains("problem+json", contentType, StringComparison.OrdinalIgnoreCase);
    }
}
