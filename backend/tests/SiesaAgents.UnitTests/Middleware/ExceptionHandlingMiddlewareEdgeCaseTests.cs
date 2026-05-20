using System.IO;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// Edge-case and boundary tests for ExceptionHandlingMiddleware — Story 1.3.
/// Expands ATDD coverage with error paths and boundary conditions not
/// covered in ExceptionHandlingMiddlewareTests.
/// </summary>
public class ExceptionHandlingMiddlewareEdgeCaseTests
{
    // ────────────────────────────────────────────────────────────────
    // Exception-to-status-code mapping — boundary / exhaustive
    // ────────────────────────────────────────────────────────────────

    /// <summary>
    /// InvalidOperationException MUST map to 409 Conflict per the middleware switch expression.
    /// This maps the third explicit branch that was not covered by ATDD tests.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_InvalidOperationException_Returns409Conflict()
    {
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new InvalidOperationException("state conflict"),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonDocument.Parse(body).RootElement;

        Assert.Equal(409, context.Response.StatusCode);
        Assert.True(json.TryGetProperty("status", out var statusProp));
        Assert.Equal(409, statusProp.GetInt32());
        Assert.True(json.TryGetProperty("title", out var titleProp));
        Assert.Equal("Conflict", titleProp.GetString());
    }

    /// <summary>
    /// An unknown/unregistered exception type (e.g. NotSupportedException)
    /// MUST fall through to 500 Internal Server Error — the default branch.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_UnknownExceptionType_Returns500InternalServerError()
    {
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new NotSupportedException("operation not supported"),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonDocument.Parse(body).RootElement;

        Assert.Equal(500, context.Response.StatusCode);
        Assert.True(json.TryGetProperty("status", out var statusProp));
        Assert.Equal(500, statusProp.GetInt32());
    }

    /// <summary>
    /// A derived exception (ArgumentNullException extends ArgumentException)
    /// MUST map to 400 — derived types match the base type in switch expressions.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_ArgumentNullException_Returns400BadRequest()
    {
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new ArgumentNullException("paramName"),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        Assert.Equal(400, context.Response.StatusCode);
    }

    // ────────────────────────────────────────────────────────────────
    // 4xx non-exception path — WriteStatusCodeProblemDetailsAsync
    // ────────────────────────────────────────────────────────────────

    /// <summary>
    /// When _next sets a 404 status code without throwing and without writing a body,
    /// the middleware MUST call WriteStatusCodeProblemDetailsAsync to produce a
    /// Problem Details response with status=404 and content-type=application/problem+json.
    /// This is the "Handle non-exception 4xx/5xx responses" branch.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_NextSets404WithoutThrowing_WritesProblemDetails()
    {
        var middleware = new ExceptionHandlingMiddleware(
            next: ctx =>
            {
                ctx.Response.StatusCode = 404;
                return Task.CompletedTask;
            },
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonDocument.Parse(body).RootElement;

        Assert.Equal(404, context.Response.StatusCode);
        Assert.Contains("problem+json", context.Response.ContentType ?? string.Empty,
            StringComparison.OrdinalIgnoreCase);
        Assert.True(json.TryGetProperty("status", out var statusProp));
        Assert.Equal(404, statusProp.GetInt32());
        Assert.True(json.TryGetProperty("title", out var titleProp));
        Assert.False(string.IsNullOrWhiteSpace(titleProp.GetString()));
    }

    /// <summary>
    /// When _next sets a 400 status code without throwing (e.g. model binding failure
    /// returning early), the middleware MUST produce Problem Details with status=400.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_NextSets400WithoutThrowing_WritesProblemDetails()
    {
        var middleware = new ExceptionHandlingMiddleware(
            next: ctx =>
            {
                ctx.Response.StatusCode = 400;
                return Task.CompletedTask;
            },
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var bodyText = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonDocument.Parse(bodyText).RootElement;

        Assert.Equal(400, context.Response.StatusCode);
        Assert.True(json.TryGetProperty("status", out var statusProp));
        Assert.Equal(400, statusProp.GetInt32());
    }

    /// <summary>
    /// When _next returns a 2xx success response, the middleware MUST pass through
    /// without writing a Problem Details body — the status-code branch only fires for 400+.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_NextSucceeds200_DoesNotOverwriteResponse()
    {
        const string expectedBody = "OK";
        var middleware = new ExceptionHandlingMiddleware(
            next: async ctx =>
            {
                ctx.Response.StatusCode = 200;
                await ctx.Response.WriteAsync(expectedBody);
            },
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        Assert.Equal(200, context.Response.StatusCode);
        Assert.Equal(expectedBody, body);
    }

    // ────────────────────────────────────────────────────────────────
    // Security: no internal details exposed in any error path
    // ────────────────────────────────────────────────────────────────

    /// <summary>
    /// For a 409 Conflict response triggered by exception, the body must
    /// not contain the original exception message or any internal details.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_InvalidOperationException_DoesNotLeakExceptionMessage()
    {
        const string sensitiveMsg = "internal-conflict-detail-must-not-leak";
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new InvalidOperationException(sensitiveMsg),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        Assert.DoesNotContain(sensitiveMsg, body);
        Assert.DoesNotContain("InvalidOperationException", body);
        Assert.DoesNotContain("System.", body);
    }

    // ────────────────────────────────────────────────────────────────
    // Response shape — camelCase JSON per RFC 7807
    // ────────────────────────────────────────────────────────────────

    /// <summary>
    /// The Problem Details JSON MUST use camelCase property names (status, title, detail)
    /// and NOT PascalCase (Status, Title, Detail).
    /// </summary>
    [Fact]
    public async Task InvokeAsync_Exception_ResponseBodyUsesCamelCasePropertyNames()
    {
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception("any error"),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var rawBody = await new StreamReader(context.Response.Body).ReadToEndAsync();

        // camelCase keys must be present
        Assert.Contains("\"status\"", rawBody);
        Assert.Contains("\"title\"", rawBody);
        Assert.Contains("\"detail\"", rawBody);

        // PascalCase keys must NOT appear (JsonNamingPolicy.CamelCase must be applied)
        Assert.DoesNotContain("\"Status\"", rawBody);
        Assert.DoesNotContain("\"Title\"", rawBody);
        Assert.DoesNotContain("\"Detail\"", rawBody);
    }

    /// <summary>
    /// The Problem Details body for the status-code path (no exception) also
    /// MUST use camelCase property names.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_StatusCodePath_ResponseBodyUsesCamelCasePropertyNames()
    {
        var middleware = new ExceptionHandlingMiddleware(
            next: ctx =>
            {
                ctx.Response.StatusCode = 404;
                return Task.CompletedTask;
            },
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var rawBody = await new StreamReader(context.Response.Body).ReadToEndAsync();

        Assert.Contains("\"status\"", rawBody);
        Assert.Contains("\"title\"", rawBody);
        Assert.DoesNotContain("\"Status\"", rawBody);
        Assert.DoesNotContain("\"Title\"", rawBody);
    }

    // ────────────────────────────────────────────────────────────────
    // Constructor null guard (boundary)
    // ────────────────────────────────────────────────────────────────

    /// <summary>
    /// When the middleware is constructed with a null logger, it MUST throw
    /// ArgumentNullException before handling any request (constructor guard).
    /// Note: NullLogger is used in production; this test passes a literal null.
    /// </summary>
    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        RequestDelegate next = _ => Task.CompletedTask;

        Assert.Throws<ArgumentNullException>(() =>
            new ExceptionHandlingMiddleware(next, logger: null!));
    }

    /// <summary>
    /// When the middleware is constructed with a null next delegate, it MUST throw
    /// ArgumentNullException at construction time (before any request arrives).
    /// </summary>
    [Fact]
    public void Constructor_NullNextDelegate_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new ExceptionHandlingMiddleware(
                next: null!,
                logger: NullLogger<ExceptionHandlingMiddleware>.Instance));
    }
}
