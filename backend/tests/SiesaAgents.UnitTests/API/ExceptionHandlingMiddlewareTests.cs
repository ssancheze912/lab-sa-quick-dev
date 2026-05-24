using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.API.Middleware;
using Xunit;

namespace SiesaAgents.UnitTests.API;

public class ExceptionHandlingMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ReturnsContentTypeProblemJson()
    {
        // Arrange
        var context = CreateHttpContext();
        var middleware = new ExceptionHandlingMiddleware(_ => throw new Exception("test error"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ReturnsStatusCode500()
    {
        // Arrange
        var context = CreateHttpContext();
        var middleware = new ExceptionHandlingMiddleware(_ => throw new Exception("test error"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(500, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_DetailFieldIsNull()
    {
        // Arrange
        var context = CreateHttpContext();
        var middleware = new ExceptionHandlingMiddleware(_ => throw new Exception("sensitive details"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert — read body and verify detail is null
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var problemDetails = JsonSerializer.Deserialize<ProblemDetails>(body, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.Null(problemDetails?.Detail);
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyContainsNoStackTrace()
    {
        // Arrange
        var context = CreateHttpContext();
        var middleware = new ExceptionHandlingMiddleware(_ => throw new Exception("test error"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert — verify no stack trace in body
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        Assert.DoesNotContain("StackTrace", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("at SiesaAgents", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task InvokeAsync_WhenNoException_PassesThrough()
    {
        // Arrange
        var context = CreateHttpContext();
        var called = false;
        var middleware = new ExceptionHandlingMiddleware(_ =>
        {
            called = true;
            return Task.CompletedTask;
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.True(called);
        Assert.Equal(200, context.Response.StatusCode);
    }

    private static DefaultHttpContext CreateHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }
}
