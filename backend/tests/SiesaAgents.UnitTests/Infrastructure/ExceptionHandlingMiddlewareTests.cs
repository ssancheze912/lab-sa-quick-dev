using Microsoft.AspNetCore.Http;
using SiesaAgents.API.Middleware;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

public class ExceptionHandlingMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_Returns500WithProblemDetails()
    {
        // Arrange
        var middleware = new ExceptionHandlingMiddleware((_) => throw new Exception("Test error"));
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(500, context.Response.StatusCode);
        Assert.Contains("application/problem+json", context.Response.ContentType);
    }

    [Fact]
    public async Task InvokeAsync_WhenNoException_PassesThroughToNextMiddleware()
    {
        // Arrange
        var nextCalled = false;
        var middleware = new ExceptionHandlingMiddleware((ctx) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.True(nextCalled);
    }
}
