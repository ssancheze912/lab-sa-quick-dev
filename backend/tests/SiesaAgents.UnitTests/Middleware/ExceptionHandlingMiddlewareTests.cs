// Story 1.3: Backend Database Foundation
// Epic 1: Project Foundation & Application Shell
//
// ATDD Acceptance Tests — RED Phase (Unit Level)
// AC5 — Unit test for ExceptionHandlingMiddleware
//
// These tests are intentionally in RED phase until implementation is wired up.
// AC5: ExceptionHandlingMiddleware catches unhandled exceptions and returns
//      HTTP 500 with Problem Details RFC 7807 body (status + title keys).

using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.API.Middleware;
using Xunit;

namespace SiesaAgents.UnitTests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // AC5-a: Normal flow — next delegate is called when no exception occurs
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNoException_CallsNext()
    {
        // GIVEN: A middleware instance wrapping a next delegate that completes normally
        var nextCalled = false;
        RequestDelegate next = _ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: InvokeAsync is called without any exception being thrown
        await middleware.InvokeAsync(context);

        // THEN: The next delegate was called (middleware did not short-circuit)
        Assert.True(nextCalled, "The next delegate must be called when no exception is thrown.");
    }

    [Fact]
    public async Task InvokeAsync_WhenNoException_ResponseStatusIs200()
    {
        // GIVEN: A middleware instance wrapping a next delegate that completes normally
        RequestDelegate next = _ => Task.CompletedTask;
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: InvokeAsync is called without any exception
        await middleware.InvokeAsync(context);

        // THEN: The response status code remains 200 (default — middleware did not alter it)
        Assert.Equal(200, context.Response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC5-b: Exception flow — returns HTTP 500
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_Returns500StatusCode()
    {
        // GIVEN: A next delegate that throws an unhandled exception
        RequestDelegate next = _ => throw new Exception("test error");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: InvokeAsync is called
        await middleware.InvokeAsync(context);

        // THEN: The HTTP response status is 500 Internal Server Error
        Assert.Equal(500, context.Response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC5-c: Content-Type must be application/problem+json (RFC 7807)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_SetsContentTypeApplicationProblemJson()
    {
        // GIVEN: A next delegate that throws an unhandled exception
        RequestDelegate next = _ => throw new Exception("test error");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: InvokeAsync handles the exception
        await middleware.InvokeAsync(context);

        // THEN: Content-Type is application/problem+json (RFC 7807 requirement)
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC5-d: Response body contains "status" key (Problem Details RFC 7807)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyContainsStatusKey()
    {
        // GIVEN: A next delegate that throws an unhandled exception
        RequestDelegate next = _ => throw new Exception("test error");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: InvokeAsync handles the exception
        await middleware.InvokeAsync(context);

        // THEN: The response JSON body contains the "status" key with value 500
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(
            doc.RootElement.TryGetProperty("status", out var statusProp),
            "Problem Details body must contain 'status' key (RFC 7807)."
        );
        Assert.Equal(500, statusProp.GetInt32());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC5-e: Response body contains "title" key (Problem Details RFC 7807)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyContainsTitleKey()
    {
        // GIVEN: A next delegate that throws an unhandled exception
        RequestDelegate next = _ => throw new Exception("test error");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: InvokeAsync handles the exception
        await middleware.InvokeAsync(context);

        // THEN: The response JSON body contains a non-empty "title" key (RFC 7807)
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(
            doc.RootElement.TryGetProperty("title", out var titleProp),
            "Problem Details body must contain 'title' key (RFC 7807)."
        );
        var titleValue = titleProp.GetString();
        Assert.NotNull(titleValue);
        Assert.NotEmpty(titleValue);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC5-f (NFR6): Stack trace must NOT be exposed in the response body
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_DoesNotExposeStackTrace()
    {
        // GIVEN: A next delegate that throws a typed exception containing internal info
        RequestDelegate next = _ => throw new InvalidOperationException("internal secret");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: InvokeAsync handles the exception
        await middleware.InvokeAsync(context);

        // THEN: The response body does NOT contain stack trace indicators (NFR6)
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        Assert.DoesNotContain("StackTrace", body);
        Assert.DoesNotContain("at System.", body);
        Assert.DoesNotContain("at SiesaAgents.", body);
        Assert.DoesNotContain("System.InvalidOperationException", body);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC5-g (NFR6): Raw exception message must NOT be exposed in the response body
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_DoesNotExposeInternalExceptionMessage()
    {
        // GIVEN: A next delegate that throws an exception with a specific internal message
        const string internalMessage = "internal secret database error";
        RequestDelegate next = _ => throw new Exception(internalMessage);
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: InvokeAsync handles the exception
        await middleware.InvokeAsync(context);

        // THEN: The internal exception message is NOT echoed back in the response (NFR6)
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.DoesNotContain(internalMessage, body);
    }
}
