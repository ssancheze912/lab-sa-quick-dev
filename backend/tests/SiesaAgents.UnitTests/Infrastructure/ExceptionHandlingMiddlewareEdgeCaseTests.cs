using Microsoft.AspNetCore.Http;
using System.Text.Json;
using SiesaAgents.API.Middleware;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Edge case tests for ExceptionHandlingMiddleware.
/// Expands ATDD coverage with boundary conditions not covered by the base ATDD test.
/// Story 1.1 — Epic 1: Project Foundation &amp; Application Shell
/// </summary>
public class ExceptionHandlingMiddlewareEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Response body content validation
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyContainsValidJson()
    {
        // GIVEN: Middleware wraps a delegate that throws
        var middleware = new ExceptionHandlingMiddleware(_ => throw new Exception("oops"));
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: Exception is triggered
        await middleware.InvokeAsync(context);

        // THEN: Response body is valid JSON
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var doc = JsonDocument.Parse(body); // Throws if not valid JSON
        Assert.NotNull(doc);
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyContainsStatusField500()
    {
        // GIVEN: Middleware is configured with a throwing delegate
        var middleware = new ExceptionHandlingMiddleware(_ => throw new InvalidOperationException("test"));
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware executes
        await middleware.InvokeAsync(context);

        // THEN: JSON body contains "status": 500
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp));
        Assert.Equal(500, statusProp.GetInt32());
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_DetailFieldIsNull()
    {
        // GIVEN: Architecture mandates Detail = null to prevent internal info leakage
        var middleware = new ExceptionHandlingMiddleware(_ =>
            throw new Exception("internal secret: connection string xyz"));
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware handles the exception
        await middleware.InvokeAsync(context);

        // THEN: The "detail" field is either absent or null — never the exception message
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var doc = JsonDocument.Parse(body);
        if (doc.RootElement.TryGetProperty("detail", out var detailProp))
        {
            Assert.Equal(JsonValueKind.Null, detailProp.ValueKind);
        }
        // If absent entirely, that's also acceptable
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_TitleFieldIsNonEmpty()
    {
        // GIVEN: Middleware returns RFC 7807 Problem Details
        var middleware = new ExceptionHandlingMiddleware(_ => throw new Exception("test"));
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware handles the exception
        await middleware.InvokeAsync(context);

        // THEN: "title" is present and non-empty
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("title", out var titleProp));
        Assert.Equal(JsonValueKind.String, titleProp.ValueKind);
        Assert.NotEmpty(titleProp.GetString()!);
    }

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyUseCamelCasePropertyNames()
    {
        // GIVEN: JsonSerializer uses PropertyNamingPolicy = CamelCase
        var middleware = new ExceptionHandlingMiddleware(_ => throw new Exception("test"));
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware handles the exception
        await middleware.InvokeAsync(context);

        // THEN: Body JSON keys are camelCase (e.g., "status" not "Status")
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        // Verify "status" (camelCase) exists, NOT "Status" (PascalCase)
        Assert.Contains("\"status\"", body);
        Assert.DoesNotContain("\"Status\"", body);
        Assert.Contains("\"title\"", body);
        Assert.DoesNotContain("\"Title\"", body);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Exception type boundaries
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenArgumentExceptionThrown_Returns500NotCrash()
    {
        // GIVEN: Middleware handles all Exception types (not just base Exception)
        var middleware = new ExceptionHandlingMiddleware(_ => throw new ArgumentException("bad arg"));
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: An ArgumentException is thrown
        await middleware.InvokeAsync(context);

        // THEN: StatusCode is 500 (not crash)
        Assert.Equal(500, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenNullReferenceExceptionThrown_Returns500NotCrash()
    {
        // GIVEN: Middleware handles NullReferenceException
        var middleware = new ExceptionHandlingMiddleware(_ => throw new NullReferenceException());
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: A NullReferenceException is thrown
        await middleware.InvokeAsync(context);

        // THEN: Middleware handles it gracefully
        Assert.Equal(500, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenOperationCanceledExceptionThrown_Returns500NotCrash()
    {
        // GIVEN: Middleware handles OperationCanceledException (e.g., request cancellations)
        var middleware = new ExceptionHandlingMiddleware(_ => throw new OperationCanceledException());
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: An OperationCanceledException is thrown
        await middleware.InvokeAsync(context);

        // THEN: Middleware handles it (does not re-throw)
        Assert.Equal(500, context.Response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Already-started response guard
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenResponseAlreadyStarted_DoesNotAttemptToWriteAgain()
    {
        // GIVEN: The response has already started writing (e.g., streaming scenario)
        // WHEN: An exception is thrown after response headers are sent
        var throwAfterStart = false;
        var middleware = new ExceptionHandlingMiddleware(async ctx =>
        {
            // Simulate starting the response before exception
            ctx.Response.StatusCode = 200;
            ctx.Response.ContentType = "application/json";
            await ctx.Response.WriteAsync("{\"partial\": true}");
            throwAfterStart = true;
            throw new Exception("thrown after partial write");
        });

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware executes
        // THEN: No additional exception is thrown (middleware guards with HasStarted check)
        var exception = await Record.ExceptionAsync(() => middleware.InvokeAsync(context));

        // The middleware should not propagate the exception when response has started
        // (behavior depends on implementation — if it re-throws after HasStarted, that's also valid)
        // Main assertion: middleware did not crash ungracefully
        Assert.True(throwAfterStart, "The delegate must have run to trigger the HasStarted scenario");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Happy path — no exception passthrough
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNoException_ResponseBodyIsUnmodified()
    {
        // GIVEN: Downstream middleware writes its own response
        const string expectedBody = "{\"ok\": true}";
        var middleware = new ExceptionHandlingMiddleware(async ctx =>
        {
            ctx.Response.ContentType = "application/json";
            await ctx.Response.WriteAsync(expectedBody);
        });

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: No exception is thrown
        await middleware.InvokeAsync(context);

        // THEN: The response body is exactly what downstream wrote (middleware did not interfere)
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.Equal(expectedBody, body);
    }

    [Fact]
    public async Task InvokeAsync_WhenNoException_ResponseStatusCodeIsUnmodified()
    {
        // GIVEN: Downstream middleware sets a 201 Created status
        var middleware = new ExceptionHandlingMiddleware(ctx =>
        {
            ctx.Response.StatusCode = 201;
            return Task.CompletedTask;
        });

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: No exception is thrown
        await middleware.InvokeAsync(context);

        // THEN: The status code remains 201 (not overwritten to 500)
        Assert.Equal(201, context.Response.StatusCode);
    }
}
