using Microsoft.AspNetCore.Http;
using Npgsql;
using SiesaAgents.API.Middleware;
using System.Net.Http;
using System.Text.Json;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// Advanced edge-case unit tests for ExceptionHandlingMiddleware.
/// Covers boundary behaviors not present in the ATDD baseline or prior edge suites.
///
/// Coverage added:
///   - [P1] NpgsqlException 503 response body is valid JSON
///   - [P1] NpgsqlException title is exactly "Database unavailable." (constant verification)
///   - [P1] NpgsqlException response does NOT contain any property from the exception
///   - [P1] AggregateException is caught and returns 500 (not re-thrown)
///   - [P1] HttpRequestException (upstream service failure) returns 500 safely
///   - [P2] Middleware does not overwrite response status when next succeeds
///   - [P2] NpgsqlException response body uses camelCase property names
///   - [P2] NpgsqlException status field is 503 in JSON body (matches HTTP status)
///   - [P2] Concurrent invocations with independent contexts do not interfere
/// </summary>
public class ExceptionHandlingMiddlewareAdvancedTests
{
    // ──────────────────────────────────────────────────────────────────────────
    // [P1] NpgsqlException 503 response body is valid, parseable JSON
    // (parallel to the 500 JSON validity check in ExceptionHandlingMiddlewareEdgeTests)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNpgsqlExceptionThrown_ResponseBodyIsValidJson()
    {
        // Arrange
        RequestDelegate next = (_) => throw new NpgsqlException("Connection refused");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: body can be parsed as JSON without throwing
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var parseException = Record.Exception(() => JsonDocument.Parse(body));
        Assert.Null(parseException);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P1] NpgsqlException title is exactly the defined constant including period
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNpgsqlExceptionThrown_TitleIsExactlyDatabaseUnavailable()
    {
        // Arrange
        RequestDelegate next = (_) => throw new NpgsqlException("Any DB error");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: title is exactly "Database unavailable." (including trailing period)
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonSerializer.Deserialize<JsonElement>(body);
        var title = json.GetProperty("title").GetString();

        Assert.Equal("Database unavailable.", title);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P1] NpgsqlException response body uses camelCase property names
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNpgsqlExceptionThrown_ResponseBodyUsesCamelCaseProperties()
    {
        // Arrange
        RequestDelegate next = (_) => throw new NpgsqlException("DB error");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: camelCase keys present, PascalCase absent
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        Assert.Contains("\"status\"", body);   // camelCase
        Assert.Contains("\"title\"", body);    // camelCase
        Assert.DoesNotContain("\"Status\"", body); // NOT PascalCase
        Assert.DoesNotContain("\"Title\"", body);  // NOT PascalCase
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P1] NpgsqlException status field in JSON matches HTTP 503 status code
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNpgsqlExceptionThrown_JsonStatusMatches503()
    {
        // Arrange
        RequestDelegate next = (_) => throw new NpgsqlException("Service unavailable");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: both HTTP status and JSON "status" field are 503
        Assert.Equal(503, context.Response.StatusCode);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonSerializer.Deserialize<JsonElement>(body);
        Assert.Equal(503, json.GetProperty("status").GetInt32());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P1] AggregateException is caught and returns 500 (not re-thrown to caller)
    // Critical boundary: AggregateException wraps async failures
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenAggregateExceptionThrown_Returns500AndDoesNotPropagate()
    {
        // Arrange: AggregateException can occur from Task.WhenAll failures
        var aggregate = new AggregateException(
            new Exception("Task 1 failed"),
            new Exception("Task 2 failed"));
        RequestDelegate next = (_) => throw aggregate;

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act: must NOT throw AggregateException from InvokeAsync
        var invokeException = await Record.ExceptionAsync(() => middleware.InvokeAsync(context));

        // Assert: exception is swallowed and converted to 500
        Assert.Null(invokeException);
        Assert.Equal(500, context.Response.StatusCode);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P1] HttpRequestException (upstream service call failure) returns 500 safely
    // Critical path: downstream API dependencies failing must not leak details
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenHttpRequestExceptionThrown_Returns500WithSafeBody()
    {
        // Arrange: simulates an upstream HTTP dependency failure
        const string sensitiveUrl = "http://internal-service.local/api/secret-endpoint";
        RequestDelegate next = (_) => throw new HttpRequestException($"Failed to reach {sensitiveUrl}");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: returns 500 and does not expose internal service URL
        Assert.Equal(500, context.Response.StatusCode);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.DoesNotContain(sensitiveUrl, body);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P2] Middleware does NOT modify response status when next delegate succeeds
    // Passthrough behavior: successful requests must be transparent
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNextSucceeds_DoesNotOverwriteResponseStatus()
    {
        // Arrange: next sets a custom 201 Created status
        RequestDelegate next = (ctx) =>
        {
            ctx.Response.StatusCode = 201;
            return Task.CompletedTask;
        };

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: middleware did not interfere with the 201 status
        Assert.Equal(201, context.Response.StatusCode);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P2] Concurrent invocations with independent HttpContexts do not interfere
    // Thread-safety boundary: static JsonOptions must be read-only
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenCalledConcurrently_AllInvocationsReturnCorrectStatus()
    {
        // Arrange
        RequestDelegate next = (_) => throw new Exception("Concurrent error");
        var middleware = new ExceptionHandlingMiddleware(next);

        var tasks = Enumerable.Range(0, 10).Select(_ =>
        {
            var ctx = new DefaultHttpContext();
            ctx.Response.Body = new MemoryStream();
            return middleware.InvokeAsync(ctx).ContinueWith(t => ctx);
        }).ToList();

        // Act
        var contexts = await Task.WhenAll(tasks);

        // Assert: all 10 independent invocations returned 500
        foreach (var ctx in contexts)
        {
            Assert.Equal(500, ctx.Response.StatusCode);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // [P2] NpgsqlException detail field is null in response (never exposes DB details)
    // Parallel to GenericException_Returns500_NeverExposesMessage in DbTests
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNpgsqlExceptionThrown_DetailFieldIsNull()
    {
        // Arrange
        const string sensitiveDbMessage = "password authentication failed for user 'postgres'";
        RequestDelegate next = (_) => throw new NpgsqlException(sensitiveDbMessage);

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert: detail is null and sensitive message is not in body
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonSerializer.Deserialize<JsonElement>(body);

        if (json.TryGetProperty("detail", out var detailElement))
        {
            Assert.Equal(JsonValueKind.Null, detailElement.ValueKind);
        }

        Assert.DoesNotContain(sensitiveDbMessage, body);
    }
}
