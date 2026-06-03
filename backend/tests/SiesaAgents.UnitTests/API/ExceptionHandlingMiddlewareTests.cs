using System.Text.Json;
using Microsoft.AspNetCore.Http;
using SiesaAgents.API.Middleware;
using Xunit;

namespace SiesaAgents.UnitTests.API;

/// <summary>
/// Unit tests for ExceptionHandlingMiddleware — edge cases and boundary conditions.
/// Complements the ATDD E2E test that verifies Problem Details format at the HTTP level.
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
}
