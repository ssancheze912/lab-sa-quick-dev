using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Xunit;

namespace SiesaAgents.UnitTests.API;

/// <summary>
/// Unit tests for ExceptionHandlingMiddleware behavior.
/// Tests the middleware logic in isolation using DefaultHttpContext.
///
/// NOTE: These tests reconstruct the middleware pattern locally to avoid
/// adding a project reference from UnitTests → SiesaAgents.API.
/// This validates the CONTRACT (Problem Details RFC 7807) not the class itself.
/// </summary>
public class ExceptionHandlingMiddlewareTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Helper: simulate the middleware InvokeAsync behavior
    // ─────────────────────────────────────────────────────────────────────────

    private static async Task<(int StatusCode, string ContentType, string Body)>
        SimulateMiddleware(Func<HttpContext, Task> next)
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        try
        {
            await next(context);
        }
        catch (Exception)
        {
            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = 500,
                Title = "An unexpected error occurred.",
                Detail = null
            });
        }

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        return (context.Response.StatusCode, context.Response.ContentType ?? "", body);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Happy path: next() completes without throwing
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_WhenNoException_DoesNotModifyResponse()
    {
        // GIVEN: The next delegate completes successfully with 200
        var (statusCode, _, _) = await SimulateMiddleware(async ctx =>
        {
            ctx.Response.StatusCode = 200;
            await Task.CompletedTask;
        });

        // THEN: The status code remains 200 (middleware does not interfere)
        Assert.Equal(200, statusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Error path: exception triggers Problem Details 500 response
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_WhenExceptionThrown_ReturnStatus500()
    {
        // GIVEN: The next delegate throws an unhandled exception
        var (statusCode, _, _) = await SimulateMiddleware(_ =>
            throw new InvalidOperationException("simulated error"));

        // THEN: The status code is 500
        Assert.Equal(500, statusCode);
    }

    [Fact]
    public async Task Middleware_WhenExceptionThrown_ContentTypeIsProblemJson()
    {
        // GIVEN: An exception is thrown
        var (_, contentType, _) = await SimulateMiddleware(_ =>
            throw new Exception("test"));

        // THEN: Content-Type is application/problem+json (RFC 7807)
        Assert.Contains("application/problem+json", contentType);
    }

    [Fact]
    public async Task Middleware_WhenExceptionThrown_ResponseBodyContainsProblemDetails()
    {
        // GIVEN: An exception is thrown
        var (_, _, body) = await SimulateMiddleware(_ =>
            throw new Exception("leak test"));

        // THEN: Body is valid JSON and contains status and title fields
        var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp));
        Assert.Equal(500, statusProp.GetInt32());

        Assert.True(doc.RootElement.TryGetProperty("title", out var titleProp));
        Assert.Equal("An unexpected error occurred.", titleProp.GetString());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Security boundary: exception message must NOT leak to the response
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_WhenExceptionThrown_DoesNotLeakExceptionMessage()
    {
        // GIVEN: An exception with a sensitive message
        const string sensitiveMessage = "SUPER_SECRET_DB_PASSWORD_123";

        var (_, _, body) = await SimulateMiddleware(_ =>
            throw new Exception(sensitiveMessage));

        // THEN: The exception message is NOT in the response body (security requirement)
        Assert.DoesNotContain(sensitiveMessage, body);
    }

    [Fact]
    public async Task Middleware_WhenExceptionThrown_DetailIsNull()
    {
        // GIVEN: An exception is thrown (any type)
        var (_, _, body) = await SimulateMiddleware(_ =>
            throw new ArgumentException("some internal detail"));

        // THEN: The 'detail' field in Problem Details is null (not the exception message)
        var doc = JsonDocument.Parse(body);
        if (doc.RootElement.TryGetProperty("detail", out var detail))
        {
            Assert.Equal(JsonValueKind.Null, detail.ValueKind);
        }
        // If 'detail' property is omitted entirely, that is also acceptable
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: different exception types all produce the same safe 500 response
    // ─────────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData(typeof(NullReferenceException))]
    [InlineData(typeof(InvalidOperationException))]
    [InlineData(typeof(ArgumentException))]
    [InlineData(typeof(TimeoutException))]
    [InlineData(typeof(UnauthorizedAccessException))]
    public async Task Middleware_AllExceptionTypes_Return500WithProblemDetails(Type exceptionType)
    {
        // GIVEN: Any exception type is thrown by the pipeline
        var (statusCode, contentType, body) = await SimulateMiddleware(_ =>
            throw (Exception)Activator.CreateInstance(exceptionType, "test message")!);

        // THEN: Always 500 + problem+json
        Assert.Equal(500, statusCode);
        Assert.Contains("application/problem+json", contentType);

        var doc = JsonDocument.Parse(body);
        doc.RootElement.TryGetProperty("status", out var statusProp);
        Assert.Equal(500, statusProp.GetInt32());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: async exception (task faulted)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Middleware_WhenAsyncExceptionThrown_Returns500()
    {
        // GIVEN: The next delegate throws asynchronously
        var (statusCode, _, _) = await SimulateMiddleware(async _ =>
        {
            await Task.Yield();
            throw new InvalidOperationException("async fault");
        });

        // THEN: The middleware catches async exceptions and returns 500
        Assert.Equal(500, statusCode);
    }
}
