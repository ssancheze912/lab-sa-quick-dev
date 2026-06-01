// Story 1.3: Backend Database Foundation
// Epic 1: Project Foundation & Application Shell
//
// Unit Tests — RED Phase (xUnit)
// These tests verify ExceptionHandlingMiddleware behavior (originally from Story 1.1,
// formally validated in Story 1.3 AC2).
//
// Acceptance Criteria covered:
//   AC2 — Unhandled exceptions return Problem Details RFC 7807 format
//          (status, title, detail=null, no stack traces, Content-Type: application/problem+json)

using System.IO;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// Unit tests for ExceptionHandlingMiddleware — RED Phase.
/// Tests verify RFC 7807 Problem Details compliance per NFR6.
/// These tests reference ExceptionHandlingMiddleware at
/// backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs
/// </summary>
public class ExceptionHandlingMiddlewareTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // AC2 — HTTP 500 with Content-Type application/problem+json
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC2: Given an unhandled exception, When middleware processes it, Then response status is 500")]
    public async Task InvokeAsync_WhenExceptionThrown_ReturnsStatus500()
    {
        // GIVEN: ExceptionHandlingMiddleware wrapping a RequestDelegate that throws
        RequestDelegate throwingDelegate = _ => throw new InvalidOperationException("Simulated failure");
        var middleware = new ExceptionHandlingMiddleware(throwingDelegate);

        var context = CreateHttpContext();

        // WHEN: InvokeAsync is called and the inner delegate throws
        await middleware.InvokeAsync(context);

        // THEN: HTTP response status code is 500
        Assert.Equal(500, context.Response.StatusCode);
    }

    [Fact(DisplayName = "AC2: Given an unhandled exception, When middleware processes it, Then Content-Type is application/problem+json")]
    public async Task InvokeAsync_WhenExceptionThrown_SetsContentTypeApplicationProblemJson()
    {
        // GIVEN: ExceptionHandlingMiddleware wrapping a throwing delegate
        RequestDelegate throwingDelegate = _ => throw new NullReferenceException("Simulated null");
        var middleware = new ExceptionHandlingMiddleware(throwingDelegate);

        var context = CreateHttpContext();

        // WHEN: InvokeAsync is called and an exception is thrown
        await middleware.InvokeAsync(context);

        // THEN: Content-Type header is application/problem+json (RFC 7807 requirement)
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    [Fact(DisplayName = "AC2: Given an unhandled exception, When middleware processes it, Then response body contains status 500")]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyContainsStatus500()
    {
        // GIVEN: ExceptionHandlingMiddleware wrapping a throwing delegate
        RequestDelegate throwingDelegate = _ => throw new Exception("Any exception");
        var middleware = new ExceptionHandlingMiddleware(throwingDelegate);

        var context = CreateHttpContext();

        // WHEN: InvokeAsync is called and an exception is thrown
        await middleware.InvokeAsync(context);

        // THEN: Response body JSON contains "status": 500
        var body = await ReadResponseBodyAsync(context);
        using var doc = JsonDocument.Parse(body);
        var statusProp = doc.RootElement.GetProperty("status");
        Assert.Equal(500, statusProp.GetInt32());
    }

    [Fact(DisplayName = "AC2: Given an unhandled exception, When middleware processes it, Then response body contains a non-empty title field")]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyContainsNonEmptyTitle()
    {
        // GIVEN: ExceptionHandlingMiddleware wrapping a throwing delegate
        RequestDelegate throwingDelegate = _ => throw new Exception("Any exception");
        var middleware = new ExceptionHandlingMiddleware(throwingDelegate);

        var context = CreateHttpContext();

        // WHEN: InvokeAsync is called and an exception is thrown
        await middleware.InvokeAsync(context);

        // THEN: Response body JSON contains a "title" field with non-empty string
        var body = await ReadResponseBodyAsync(context);
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("title", out var titleProp));
        Assert.Equal(JsonValueKind.String, titleProp.ValueKind);
        Assert.NotEmpty(titleProp.GetString()!);
    }

    [Fact(DisplayName = "AC2: Given an unhandled exception, When middleware processes it, Then title is the generic approved message")]
    public async Task InvokeAsync_WhenExceptionThrown_TitleIsGenericMessage()
    {
        // GIVEN: ExceptionHandlingMiddleware using fixed title (not ex.Message per NFR6)
        RequestDelegate throwingDelegate = _ => throw new Exception("SECRET internal error details");
        var middleware = new ExceptionHandlingMiddleware(throwingDelegate);

        var context = CreateHttpContext();

        // WHEN: InvokeAsync is called and an exception is thrown
        await middleware.InvokeAsync(context);

        // THEN: Title is the generic approved message — NOT the real exception message
        var body = await ReadResponseBodyAsync(context);
        using var doc = JsonDocument.Parse(body);
        var title = doc.RootElement.GetProperty("title").GetString();
        Assert.Equal("An unexpected error occurred.", title);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC2 — Detail must be null — no stack trace exposure (NFR6)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC2 (NFR6): Given an unhandled exception, When middleware processes it, Then detail field is null (no stack trace exposure)")]
    public async Task InvokeAsync_WhenExceptionThrown_DetailFieldIsNull()
    {
        // GIVEN: ExceptionHandlingMiddleware with Detail = null (NFR6 — no ex.Message or stack trace)
        RequestDelegate throwingDelegate = _ => throw new Exception("SECRET: this must not appear in response");
        var middleware = new ExceptionHandlingMiddleware(throwingDelegate);

        var context = CreateHttpContext();

        // WHEN: InvokeAsync is called and an exception is thrown
        await middleware.InvokeAsync(context);

        // THEN: "detail" field is absent or null in the response body
        var body = await ReadResponseBodyAsync(context);
        using var doc = JsonDocument.Parse(body);
        if (doc.RootElement.TryGetProperty("detail", out var detailProp))
        {
            Assert.Equal(JsonValueKind.Null, detailProp.ValueKind);
        }
        // If "detail" is absent entirely, the test passes (null = not exposed)
    }

    [Fact(DisplayName = "AC2 (NFR6): Given an unhandled exception, When middleware processes it, Then response body does NOT contain stack trace markers")]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyDoesNotContainStackTrace()
    {
        // GIVEN: ExceptionHandlingMiddleware that NEVER exposes ex.Message or stack traces
        RequestDelegate throwingDelegate = _ => throw new InvalidOperationException("Sensitive internal error");
        var middleware = new ExceptionHandlingMiddleware(throwingDelegate);

        var context = CreateHttpContext();

        // WHEN: InvokeAsync is called and an exception is thrown
        await middleware.InvokeAsync(context);

        // THEN: Response body does not contain stack trace markers (NFR6 — security requirement)
        var body = await ReadResponseBodyAsync(context);
        Assert.DoesNotContain("StackTrace", body);
        Assert.DoesNotContain("at System.", body);
        Assert.DoesNotContain(".cs:line", body);
        Assert.DoesNotContain("InvalidOperationException", body);
        Assert.DoesNotContain("Sensitive internal error", body);
    }

    [Fact(DisplayName = "AC2: Given NO exception occurs, When middleware processes request, Then next delegate executes normally (passthrough)")]
    public async Task InvokeAsync_WhenNoException_CallsNextDelegateNormally()
    {
        // GIVEN: ExceptionHandlingMiddleware wrapping a delegate that succeeds
        var nextCalled = false;
        RequestDelegate successDelegate = _ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };
        var middleware = new ExceptionHandlingMiddleware(successDelegate);

        var context = CreateHttpContext();

        // WHEN: InvokeAsync is called and no exception is thrown
        await middleware.InvokeAsync(context);

        // THEN: The next delegate was called (middleware is transparent on happy path)
        Assert.True(nextCalled);
    }

    [Fact(DisplayName = "AC2: Given NO exception occurs, When middleware processes request, Then response status remains 200")]
    public async Task InvokeAsync_WhenNoException_ResponseStatusRemains200()
    {
        // GIVEN: ExceptionHandlingMiddleware wrapping a delegate that sets 200
        RequestDelegate successDelegate = ctx =>
        {
            ctx.Response.StatusCode = 200;
            return Task.CompletedTask;
        };
        var middleware = new ExceptionHandlingMiddleware(successDelegate);

        var context = CreateHttpContext();

        // WHEN: InvokeAsync is called without exception
        await middleware.InvokeAsync(context);

        // THEN: Response status is 200 (middleware does not interfere on success)
        Assert.Equal(200, context.Response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private static DefaultHttpContext CreateHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static async Task<string> ReadResponseBodyAsync(HttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body, Encoding.UTF8, leaveOpen: true);
        return await reader.ReadToEndAsync();
    }
}
