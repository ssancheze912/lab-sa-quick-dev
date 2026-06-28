using Microsoft.AspNetCore.Http;
using SiesaAgents.API.Middleware;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

public class ExceptionHandlingMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_Returns500WithProblemDetails()
    {
        // GIVEN: Middleware wraps a delegate that throws
        var middleware = new ExceptionHandlingMiddleware((_) => throw new Exception("Test error"));
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware executes
        await middleware.InvokeAsync(context);

        // THEN: HTTP 500 is returned with application/problem+json content type
        Assert.Equal(500, context.Response.StatusCode);
        Assert.Contains("application/problem+json", context.Response.ContentType);
    }

    [Fact]
    public async Task InvokeAsync_WhenNoException_PassesThroughToNextMiddleware()
    {
        // GIVEN: Middleware wraps a delegate that succeeds
        var nextCalled = false;
        var middleware = new ExceptionHandlingMiddleware((ctx) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware executes without exception
        await middleware.InvokeAsync(context);

        // THEN: The next delegate was invoked (pass-through)
        Assert.True(nextCalled);
    }
}
