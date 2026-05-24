using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.API.Middleware;
using System.Text.Json;
using Xunit;

namespace SiesaAgents.UnitTests.API;

public class ExceptionHandlingMiddlewareTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Happy path — next middleware does not throw, response is untouched
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNextDoesNotThrow_PassesThroughWithoutModifyingResponse()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Response.Body = new MemoryStream();

        var nextCalled = false;
        RequestDelegate next = (_) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new ExceptionHandlingMiddleware(next);

        // Act
        await middleware.InvokeAsync(httpContext);

        // Assert
        Assert.True(nextCalled);
        // Status was not overridden (default 200)
        Assert.Equal(200, httpContext.Response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Exception path — unhandled exception produces RFC 7807 Problem Details
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNextThrows_ReturnsStatus500()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Response.Body = new MemoryStream();

        RequestDelegate next = (_) => throw new InvalidOperationException("Simulated error");
        var middleware = new ExceptionHandlingMiddleware(next);

        // Act
        await middleware.InvokeAsync(httpContext);

        // Assert
        Assert.Equal(500, httpContext.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenNextThrows_SetsContentTypeToApplicationProblemJson()
    {
        // Arrange: architecture spec mandates application/problem+json content type
        var httpContext = new DefaultHttpContext();
        httpContext.Response.Body = new MemoryStream();

        RequestDelegate next = (_) => throw new Exception("Any exception");
        var middleware = new ExceptionHandlingMiddleware(next);

        // Act
        await middleware.InvokeAsync(httpContext);

        // Assert
        Assert.Equal("application/problem+json", httpContext.Response.ContentType);
    }

    [Fact]
    public async Task InvokeAsync_WhenNextThrows_ResponseBodyContainsTitleField()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Response.Body = new MemoryStream();

        RequestDelegate next = (_) => throw new Exception("internal detail");
        var middleware = new ExceptionHandlingMiddleware(next);

        // Act
        await middleware.InvokeAsync(httpContext);

        // Read response body
        httpContext.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(httpContext.Response.Body).ReadToEndAsync();
        var problemDetails = JsonSerializer.Deserialize<ProblemDetails>(
            body,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        );

        // Assert: Title is present with the generic message
        Assert.NotNull(problemDetails);
        Assert.Equal("An unexpected error occurred.", problemDetails!.Title);
    }

    [Fact]
    public async Task InvokeAsync_WhenNextThrows_DetailIsNull_NoExceptionLeakage()
    {
        // Arrange: architecture mandates Detail = null (never expose ex.Message)
        var httpContext = new DefaultHttpContext();
        httpContext.Response.Body = new MemoryStream();

        var sensitiveMessage = "SensitiveInternalDatabasePassword123";
        RequestDelegate next = (_) => throw new Exception(sensitiveMessage);
        var middleware = new ExceptionHandlingMiddleware(next);

        // Act
        await middleware.InvokeAsync(httpContext);

        // Assert: the sensitive message must NOT appear in the response body
        httpContext.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(httpContext.Response.Body).ReadToEndAsync();

        Assert.DoesNotContain(sensitiveMessage, body);
    }

    [Fact]
    public async Task InvokeAsync_WhenNextThrows_StatusFieldInBodyIs500()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Response.Body = new MemoryStream();

        RequestDelegate next = (_) => throw new ArgumentException("bad arg");
        var middleware = new ExceptionHandlingMiddleware(next);

        // Act
        await middleware.InvokeAsync(httpContext);

        // Read and parse body
        httpContext.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(httpContext.Response.Body).ReadToEndAsync();
        var problemDetails = JsonSerializer.Deserialize<ProblemDetails>(
            body,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        );

        // Assert: Status field in Problem Details body is 500
        Assert.NotNull(problemDetails);
        Assert.Equal(500, problemDetails!.Status);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge case — different exception types are all handled uniformly
    // ─────────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData(typeof(NullReferenceException))]
    [InlineData(typeof(InvalidOperationException))]
    [InlineData(typeof(UnauthorizedAccessException))]
    [InlineData(typeof(NotImplementedException))]
    public async Task InvokeAsync_ForAnyExceptionType_ReturnsUniform500Response(Type exceptionType)
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Response.Body = new MemoryStream();

        RequestDelegate next = (_) =>
        {
            var ex = (Exception)Activator.CreateInstance(exceptionType)!;
            throw ex;
        };
        var middleware = new ExceptionHandlingMiddleware(next);

        // Act
        await middleware.InvokeAsync(httpContext);

        // Assert: all exception types produce the same 500 status and content type
        Assert.Equal(500, httpContext.Response.StatusCode);
        Assert.Equal("application/problem+json", httpContext.Response.ContentType);
    }
}
