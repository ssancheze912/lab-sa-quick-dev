using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests;

public class ExceptionHandlingMiddlewareTests
{
    [Fact]
    public async Task When_Inner_Pipeline_Throws_Then_Returns_ProblemDetails_500()
    {
        // Arrange
        RequestDelegate next = _ => throw new InvalidOperationException("boom — should not leak");
        var middleware = new ExceptionHandlingMiddleware(next, NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        using var stream = new MemoryStream();
        context.Response.Body = stream;
        context.Request.Path = "/some/path";

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal((int)HttpStatusCode.InternalServerError, context.Response.StatusCode);
        Assert.Equal("application/problem+json", context.Response.ContentType);

        stream.Position = 0;
        using var doc = await JsonDocument.ParseAsync(stream);
        var root = doc.RootElement;

        Assert.Equal(500, root.GetProperty("status").GetInt32());
        Assert.False(string.IsNullOrWhiteSpace(root.GetProperty("title").GetString()));

        // CRITICAL: Sensitive details MUST NOT be exposed (NFR6)
        var body = JsonSerializer.Serialize(root);
        Assert.DoesNotContain("boom", body);
        Assert.DoesNotContain("InvalidOperationException", body);
    }

    [Fact]
    public async Task When_No_Exception_Then_Pipeline_Continues_Normally()
    {
        // Arrange
        var nextCalled = false;
        RequestDelegate next = _ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };
        var middleware = new ExceptionHandlingMiddleware(next, NullLogger<ExceptionHandlingMiddleware>.Instance);
        var context = new DefaultHttpContext();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.True(nextCalled);
        Assert.Equal(200, context.Response.StatusCode);
    }
}
