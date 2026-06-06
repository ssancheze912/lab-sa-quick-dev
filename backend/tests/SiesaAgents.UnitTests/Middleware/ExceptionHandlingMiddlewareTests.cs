using Microsoft.AspNetCore.Http;
using SiesaAgents.API.Middleware;
using System.Text.Json;

namespace SiesaAgents.UnitTests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_WhenNoException_CallsNext()
    {
        // Arrange
        var nextCalled = false;
        RequestDelegate next = (_) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.True(nextCalled);
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_Returns500WithProblemDetails()
    {
        // Arrange
        RequestDelegate next = (_) => throw new InvalidOperationException("Test error");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(500, context.Response.StatusCode);
        Assert.Equal("application/problem+json", context.Response.ContentType);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var problemDetails = JsonSerializer.Deserialize<JsonElement>(body);

        Assert.Equal(500, problemDetails.GetProperty("status").GetInt32());
        Assert.Equal("An unexpected error occurred.", problemDetails.GetProperty("title").GetString());
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_DoesNotExposeErrorDetails()
    {
        // Arrange
        const string sensitiveMessage = "Database connection string: secret";
        RequestDelegate next = (_) => throw new Exception(sensitiveMessage);

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        Assert.DoesNotContain(sensitiveMessage, body);
    }
}
