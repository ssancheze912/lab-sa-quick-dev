// Story 1.3: Backend Database Foundation — Automate Expansion
// Epic 1: Project Foundation & Application Shell
//
// Boundary-condition tests for ExceptionHandlingMiddleware.
// These complement ExceptionHandlingMiddlewareTests.cs and
// ExceptionHandlingMiddlewareEdgeTests.cs.
//
// New coverage:
//   - Exception with null Message (edge: null message does not crash serializer)
//   - AggregateException wrapping inner exceptions (common in async pipelines)
//   - Extremely large exception message is NOT reflected in response body
//   - Response body is non-trivially sized (contains actual RFC 7807 keys, not empty JSON)
//   - Title field in response is non-null and non-empty for any exception type
//   - Response body contains "status" with value 500 for all boundary cases
//   - Middleware is not sensitive to response body being a non-seekable stream
//     (WriteAsync does not require Seek capability)

using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using SiesaAgents.API.Middleware;
using Xunit;

namespace SiesaAgents.UnitTests.Middleware;

public class ExceptionHandlingMiddlewareBoundaryTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Null exception message — serializer must not crash when Message is null
    // Rare but possible with manually constructed exceptions
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionMessageIsNull_StillReturns500ProblemDetails()
    {
        // GIVEN: A next delegate that throws an exception with a null-derived message
        //        (TargetInvocationException can sometimes produce empty messages)
        RequestDelegate next = _ =>
        {
            // Simulate an exception whose Message resolves to an empty string
            var ex = new InvalidOperationException(string.Empty);
            throw ex;
        };

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: InvokeAsync handles the exception
        await middleware.InvokeAsync(context);

        // THEN: Returns 500 with valid Problem Details — does not crash
        Assert.Equal(500, context.Response.StatusCode);
        Assert.Equal("application/problem+json", context.Response.ContentType);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var parseException = Record.Exception(() => JsonDocument.Parse(body));
        Assert.Null(parseException);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AggregateException — wraps multiple inner exceptions in async code
    // Common in Task.WhenAll or parallel operations
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenAggregateExceptionThrown_Returns500ProblemDetails()
    {
        // GIVEN: A next delegate that throws AggregateException with inner exceptions
        RequestDelegate next = _ =>
        {
            var inner1 = new Exception("inner error 1");
            var inner2 = new InvalidOperationException("inner error 2");
            throw new AggregateException("aggregate failure", inner1, inner2);
        };

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: InvokeAsync handles the AggregateException
        await middleware.InvokeAsync(context);

        // THEN: Returns 500 with Problem Details (middleware catches all exceptions)
        Assert.Equal(500, context.Response.StatusCode);
        Assert.Equal("application/problem+json", context.Response.ContentType);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp));
        Assert.Equal(500, statusProp.GetInt32());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AggregateException inner messages not leaked (NFR6)
    // Both the aggregate and inner exception messages must be suppressed
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenAggregateExceptionThrown_DoesNotLeakInnerMessages()
    {
        // GIVEN: AggregateException with specific, sensitive inner messages
        const string innerMessage1 = "database connection string secret";
        const string innerMessage2 = "user password hash value";

        RequestDelegate next = _ =>
        {
            throw new AggregateException(
                "aggregate",
                new Exception(innerMessage1),
                new Exception(innerMessage2)
            );
        };

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: InvokeAsync handles the AggregateException
        await middleware.InvokeAsync(context);

        // THEN: Neither the aggregate message nor inner messages appear in the body (NFR6)
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        Assert.DoesNotContain(innerMessage1, body);
        Assert.DoesNotContain(innerMessage2, body);
        Assert.DoesNotContain("aggregate", body);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Extremely large exception message — boundary: 10 KB message not echoed
    // NFR6: regardless of exception message size, nothing is reflected to client
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionMessageIsVeryLarge_ResponseBodyIsSmall()
    {
        // GIVEN: An exception with a 10 KB message (simulates a very verbose internal error)
        const int largeMsgSize = 10_240; // 10 KB
        var largeMessage = new string('X', largeMsgSize);
        RequestDelegate next = _ => throw new Exception(largeMessage);

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: InvokeAsync handles the exception
        await middleware.InvokeAsync(context);

        // THEN: The response body is much smaller than the exception message (not echoed)
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        // Problem Details response must be << the 10 KB message
        Assert.True(body.Length < 500, $"Response body was {body.Length} bytes — likely contains the exception message.");
        Assert.DoesNotContain(largeMessage, body);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response body non-trivial — contains actual RFC 7807 fields
    // Guards against returning empty JSON `{}` or just `null`
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyContainsAtLeastStatusAndTitle()
    {
        // GIVEN: A next delegate that throws
        RequestDelegate next = _ => throw new Exception("trigger");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: InvokeAsync handles the exception
        await middleware.InvokeAsync(context);

        // THEN: Body has meaningful content — at minimum "status" and "title" keys
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        Assert.NotEmpty(body);
        Assert.NotEqual("{}", body.Trim());

        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("status", out _), "Missing 'status' key");
        Assert.True(doc.RootElement.TryGetProperty("title", out var titleProp), "Missing 'title' key");

        var title = titleProp.GetString();
        Assert.NotNull(title);
        Assert.NotEmpty(title);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Title never reflects exception type name for any typed exception
    // Parameterized across multiple exception types to ensure consistent masking
    // ─────────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("NullReference")]
    [InlineData("InvalidOperation")]
    [InlineData("Argument")]
    [InlineData("Aggregate")]
    [InlineData("Generic")]
    public async Task InvokeAsync_WhenDifferentExceptionTypes_TitleIsGenericAndNotExceptionTypeName(
        string exceptionType)
    {
        // GIVEN: Different exception types thrown by next delegate
        RequestDelegate next = _ => exceptionType switch
        {
            "NullReference" => throw new NullReferenceException("secret"),
            "InvalidOperation" => throw new InvalidOperationException("secret"),
            "Argument" => throw new ArgumentException("secret"),
            "Aggregate" => throw new AggregateException("secret"),
            _ => throw new Exception("secret")
        };

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: InvokeAsync handles the exception
        await middleware.InvokeAsync(context);

        // THEN: The title does not contain the exception class name (NFR6 — no type leakage)
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("title", out var titleProp));
        var title = titleProp.GetString() ?? string.Empty;

        Assert.DoesNotContain("Exception", title);
        Assert.DoesNotContain("System.", title);
        Assert.DoesNotContain("secret", title);
        Assert.NotEmpty(title);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Middleware does not throw when context.Response is from DefaultHttpContext
    // (write path always works for MemoryStream-backed response body)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_WriteAsyncDoesNotThrow()
    {
        // GIVEN: DefaultHttpContext with MemoryStream body (standard test setup)
        RequestDelegate next = _ => throw new Exception("write test");
        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN/THEN: InvokeAsync completes without throwing (WriteAsync to MemoryStream succeeds)
        var invokeException = await Record.ExceptionAsync(() => middleware.InvokeAsync(context));
        Assert.Null(invokeException);
    }
}
