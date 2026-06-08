using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using SiesaAgents.API.Middleware;
using System.Text.Json;

namespace SiesaAgents.UnitTests.API;

/// <summary>
/// Edge-case and boundary condition tests for ExceptionHandlingMiddleware.
/// Expands ATDD coverage with error paths and boundary conditions
/// not covered by the acceptance tests in ExceptionHandlingMiddlewareTests.cs.
/// </summary>
public class ExceptionHandlingMiddlewareEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────
    // Response body – valid JSON in all error paths
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyIsValidJson()
    {
        // GIVEN: Middleware wrapping a delegate that throws
        var middleware = BuildMiddleware(_ => throw new Exception("boom"));
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response body must be parseable as JSON (not HTML or plain text)
        var body = await ReadResponseBodyAsync(context);
        var exception = Record.Exception(() => JsonDocument.Parse(body));
        Assert.Null(exception);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Response body – status field numeric value matches HTTP status code
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_StatusFieldMatchesHttpStatusCode()
    {
        // GIVEN: Middleware wrapping a delegate that throws a generic exception
        var middleware = BuildMiddleware(_ => throw new Exception("boom"));
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: The "status" field in the body must equal the HTTP response status code (500)
        var body = await ReadResponseBodyAsync(context);
        var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("status", out var statusEl),
            "Body must have 'status' field");
        Assert.Equal(StatusCodes.Status500InternalServerError, statusEl.GetInt32());
    }

    [Fact]
    public async Task InvokeAsync_WhenArgumentExceptionThrown_StatusFieldIs400()
    {
        // GIVEN: Middleware wrapping a delegate that throws ArgumentException
        var middleware = BuildMiddleware(_ => throw new ArgumentException("bad input"));
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: The "status" field in the body must be 400
        var body = await ReadResponseBodyAsync(context);
        var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("status", out var statusEl));
        Assert.Equal(StatusCodes.Status400BadRequest, statusEl.GetInt32());
    }

    // ─────────────────────────────────────────────────────────────────────
    // Response body – detail field contains exception message
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_DetailFieldContainsExceptionMessage()
    {
        // GIVEN: Middleware wrapping a delegate that throws with a known message
        const string knownMessage = "unique-test-error-message-12345";
        var middleware = BuildMiddleware(_ => throw new InvalidOperationException(knownMessage));
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: The "detail" field must contain the exception message
        var body = await ReadResponseBodyAsync(context);
        var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("detail", out var detailEl),
            "Body must have 'detail' field");
        Assert.Contains(knownMessage, detailEl.GetString());
    }

    // ─────────────────────────────────────────────────────────────────────
    // Response body – instance field contains request path
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_InstanceFieldContainsRequestPath()
    {
        // GIVEN: Middleware with a request to a known path
        var middleware = BuildMiddleware(_ => throw new Exception("boom"));
        var context = BuildHttpContext(path: "/api/test/resource");

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: The "instance" field must match the request path
        var body = await ReadResponseBodyAsync(context);
        var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("instance", out var instanceEl),
            "Body must have 'instance' field");
        Assert.Equal("/api/test/resource", instanceEl.GetString());
    }

    // ─────────────────────────────────────────────────────────────────────
    // Response body – traceId extension field is present
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyContainsTraceId()
    {
        // GIVEN: Middleware wrapping a delegate that throws
        var middleware = BuildMiddleware(_ => throw new Exception("boom"));
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: The response body must contain a "traceId" field (ProblemDetails extension)
        var body = await ReadResponseBodyAsync(context);
        var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("traceId", out _),
            "Problem Details body must contain 'traceId' extension field");
    }

    // ─────────────────────────────────────────────────────────────────────
    // Default fallthrough – unknown exception types map to 500
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNotImplementedExceptionThrown_ReturnsStatus500()
    {
        // GIVEN: Middleware wrapping a delegate that throws NotImplementedException
        var middleware = BuildMiddleware(_ => throw new NotImplementedException("not done"));
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response status must be 500 (default fallthrough)
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenNullReferenceExceptionThrown_ReturnsStatus500()
    {
        // GIVEN: Middleware wrapping a delegate that throws NullReferenceException
        var middleware = BuildMiddleware(_ => throw new NullReferenceException("null ref"));
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response status must be 500 (default fallthrough)
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────
    // ArgumentNullException – derives from ArgumentException, must map to 400
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenArgumentNullExceptionThrown_ReturnsStatus400()
    {
        // GIVEN: Middleware wrapping a delegate that throws ArgumentNullException
        //        (ArgumentNullException is a subclass of ArgumentException)
        var middleware = BuildMiddleware(_ => throw new ArgumentNullException("paramName"));
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response status must be 400 (ArgumentNullException derives from ArgumentException)
        Assert.Equal(StatusCodes.Status400BadRequest, context.Response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Non-exception 404 path – route-not-found returns Problem Details JSON
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNext404WithNoException_ReturnsApplicationProblemJsonContentType()
    {
        // GIVEN: Middleware wrapping a delegate that sets 404 without throwing
        var middleware = BuildMiddleware(ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status404NotFound;
            return Task.CompletedTask;
        });
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Content-Type must be application/problem+json (non-exception 404 path)
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    [Fact]
    public async Task InvokeAsync_WhenNext404WithNoException_ResponseBodyContainsStatusField()
    {
        // GIVEN: Middleware wrapping a delegate that sets 404 without throwing
        var middleware = BuildMiddleware(ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status404NotFound;
            return Task.CompletedTask;
        });
        var context = BuildHttpContext(path: "/api/unknown");

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Response body must contain a "status" field equal to 404
        var body = await ReadResponseBodyAsync(context);
        var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("status", out var statusEl),
            "Non-exception 404 body must contain 'status' field");
        Assert.Equal(404, statusEl.GetInt32());
    }

    [Fact]
    public async Task InvokeAsync_WhenNext404WithNoException_DetailContainsRequestPath()
    {
        // GIVEN: Middleware wrapping a delegate that sets 404 without throwing
        const string path = "/api/nonexistent/resource";
        var middleware = BuildMiddleware(ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status404NotFound;
            return Task.CompletedTask;
        });
        var context = BuildHttpContext(path: path);

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Detail field must reference the missing resource path
        var body = await ReadResponseBodyAsync(context);
        var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("detail", out var detailEl));
        Assert.Contains(path, detailEl.GetString());
    }

    // ─────────────────────────────────────────────────────────────────────
    // Response already started – middleware must NOT write to a started response
    // (simulates the HasStarted guard for 404 non-exception path)
    // ─────────────────────────────────────────────────────────────────────

    [Fact(Skip = "FIXME: DefaultHttpContext with MemoryStream does not simulate HasStarted=true correctly. " +
                 "Healing attempt 1: Added ctx.Response.WriteAsync() to trigger HasStarted — MemoryStream never sets HasStarted=true. " +
                 "Healing attempt 2: Tried HttpResponseFeature.HasStarted mock — DefaultHttpContext ignores feature override in this path. " +
                 "Healing attempt 3: Used a custom IHttpResponseFeature mock — middleware code checks context.Response.HasStarted which " +
                 "reads the underlying feature, but TestHost integration is needed to actually start the response. " +
                 "Manual investigation needed: This guard can only be reliably validated with Microsoft.AspNetCore.TestHost WebApplicationFactory. " +
                 "TODO: Re-enable as an integration test using TestServer/WebApplicationFactory.")]
    public async Task InvokeAsync_WhenResponseAlreadyStartedAnd404_DoesNotOverwriteContentType()
    {
        // GIVEN: Middleware where the inner handler sets 404 AND starts the response
        //        The middleware must not overwrite the already-started response
        // NOTE: DefaultHttpContext + MemoryStream never sets HasStarted=true even after WriteAsync.
        //       The HasStarted guard in the middleware is only exercised with a real HTTP pipeline.
        //       This test is marked Skip/FIXME until an integration test environment is available.
        var middleware = BuildMiddleware(async ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status404NotFound;
            ctx.Response.ContentType = "text/plain";
            await ctx.Response.WriteAsync("already written");
        });
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: Content-Type is text/plain (middleware did not overwrite the started response)
        Assert.Equal("text/plain", context.Response.ContentType);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Security – exception message must NOT expose class type internals
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyDoesNotContainExceptionTypeName()
    {
        // GIVEN: Middleware wrapping a delegate that throws InvalidOperationException
        var middleware = BuildMiddleware(_ => throw new InvalidOperationException("internal failure"));
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: The response body must not contain the exception type name (no class names exposed)
        var body = await ReadResponseBodyAsync(context);
        Assert.DoesNotContain("InvalidOperationException", body, StringComparison.Ordinal);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Title field – must match expected value per exception type
    // ─────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData(typeof(ArgumentException), "Bad Request")]
    [InlineData(typeof(KeyNotFoundException), "Not Found")]
    [InlineData(typeof(UnauthorizedAccessException), "Unauthorized")]
    public async Task InvokeAsync_WhenSpecificExceptionThrown_TitleFieldMatchesExpected(
        Type exceptionType, string expectedTitle)
    {
        // GIVEN: Middleware wrapping a delegate that throws the specified exception type
        var middleware = BuildMiddleware(_ =>
            throw (Exception)Activator.CreateInstance(exceptionType, "test message")!);
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: The "title" field must match the expected value
        var body = await ReadResponseBodyAsync(context);
        var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("title", out var titleEl),
            "Body must have 'title' field");
        Assert.Equal(expectedTitle, titleEl.GetString());
    }

    [Fact]
    public async Task InvokeAsync_WhenGenericExceptionThrown_TitleFieldIsInternalServerError()
    {
        // GIVEN: Middleware wrapping a delegate that throws a generic Exception
        var middleware = BuildMiddleware(_ => throw new Exception("boom"));
        var context = BuildHttpContext();

        // WHEN: The middleware processes the request
        await middleware.InvokeAsync(context);

        // THEN: The "title" field must be "Internal Server Error" for unhandled exceptions
        var body = await ReadResponseBodyAsync(context);
        var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("title", out var titleEl));
        Assert.Equal("Internal Server Error", titleEl.GetString());
    }

    // ─────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────

    private static ExceptionHandlingMiddleware BuildMiddleware(Func<HttpContext, Task> requestDelegate)
    {
        RequestDelegate next = ctx => requestDelegate(ctx);
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        return new ExceptionHandlingMiddleware(next, logger);
    }

    private static DefaultHttpContext BuildHttpContext(string path = "/")
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        context.Request.Path = path;
        return context;
    }

    private static async Task<string> ReadResponseBodyAsync(DefaultHttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        return await reader.ReadToEndAsync();
    }
}
