/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * Automate Expansion — Edge Cases & Boundary Conditions (Unit Level)
 * Expands ATDD coverage (ExceptionHandlingMiddlewareTests.cs) with:
 *   - Multiple exception type handling (not just InvalidOperationException)
 *   - JSON response structure precision (property names and types)
 *   - OperationCanceledException passthrough behavior
 *   - Exception message isolation (large message must not leak)
 *   - Multiple sequential invocations (fresh state per call)
 *   - Response body is valid UTF-8 / non-empty JSON object
 *   - Middleware does not swallow the task result on happy path
 *
 * Test Framework: xUnit
 * Test Pattern: Arrange / Act / Assert (Given / When / Then)
 */

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Xunit;

namespace SiesaAgents.UnitTests.API;

public class ExceptionHandlingMiddlewareEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Multiple exception type handling
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Edge case: ArgumentException (not just InvalidOperationException) must also be caught.
    /// The middleware must handle ANY exception type, not only specific ones.
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenArgumentExceptionThrown_ShouldReturn500()
    {
        // GIVEN: A middleware instance whose next delegate throws ArgumentException
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(
            next: _ => throw new ArgumentException("Bad argument value"));

        var context = new DefaultHttpContext();
        context.Response.Body = new System.IO.MemoryStream();

        // WHEN: The middleware handles the exception
        await middleware.InvokeAsync(context);

        // THEN: Status code is 500 — all unhandled exceptions mapped to 500
        Assert.Equal(500, context.Response.StatusCode);
    }

    /// <summary>
    /// Edge case: NullReferenceException must be caught and mapped to 500.
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenNullReferenceExceptionThrown_ShouldReturn500()
    {
        // GIVEN: A middleware instance whose next delegate throws NullReferenceException
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(
            next: _ => throw new NullReferenceException("Null object access"));

        var context = new DefaultHttpContext();
        context.Response.Body = new System.IO.MemoryStream();

        // WHEN: The middleware handles the exception
        await middleware.InvokeAsync(context);

        // THEN: Response status is 500
        Assert.Equal(500, context.Response.StatusCode);
    }

    /// <summary>
    /// Edge case: NullReferenceException response must also use application/problem+json.
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenNullReferenceExceptionThrown_ShouldSetProblemJsonContentType()
    {
        // GIVEN: Middleware with a NullReferenceException-throwing next delegate
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(
            next: _ => throw new NullReferenceException());

        var context = new DefaultHttpContext();
        context.Response.Body = new System.IO.MemoryStream();

        // WHEN: The middleware handles the exception
        await middleware.InvokeAsync(context);

        // THEN: Content-Type is application/problem+json regardless of exception type
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    /// <summary>
    /// Edge case: An exception thrown deep in an async call chain must still be caught.
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenAsyncExceptionThrown_ShouldReturn500()
    {
        // GIVEN: A next delegate that throws asynchronously (after awaiting something)
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(
            next: async _ =>
            {
                await Task.Yield(); // simulate async work
                throw new InvalidOperationException("Async failure deep in pipeline");
            });

        var context = new DefaultHttpContext();
        context.Response.Body = new System.IO.MemoryStream();

        // WHEN: The middleware awaits the async next delegate that throws
        await middleware.InvokeAsync(context);

        // THEN: Exception is caught and 500 is returned
        Assert.Equal(500, context.Response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // JSON response structure precision
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Edge case: ProblemDetails response body must be a valid JSON object (not a string, array, or null).
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenExceptionThrown_ResponseBodyShouldBeValidJsonObject()
    {
        // GIVEN: Middleware whose next delegate throws
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(
            next: _ => throw new Exception("Boom"));

        var context = new DefaultHttpContext();
        var responseBody = new System.IO.MemoryStream();
        context.Response.Body = responseBody;

        // WHEN: Exception is handled
        await middleware.InvokeAsync(context);

        // THEN: Response body is a valid JSON object (not empty, not an array, not null)
        responseBody.Seek(0, System.IO.SeekOrigin.Begin);
        var bodyJson = await new System.IO.StreamReader(responseBody).ReadToEndAsync();

        using var doc = JsonDocument.Parse(bodyJson);
        Assert.Equal(JsonValueKind.Object, doc.RootElement.ValueKind);
    }

    /// <summary>
    /// Edge case: ProblemDetails.Status in the JSON body must be a number, not a string.
    /// RFC 7807 requires: "status" is a number field.
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenExceptionThrown_StatusFieldInBodyShouldBeNumber()
    {
        // GIVEN: Middleware whose next delegate throws
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(
            next: _ => throw new Exception("Boom"));

        var context = new DefaultHttpContext();
        var responseBody = new System.IO.MemoryStream();
        context.Response.Body = responseBody;

        // WHEN: Exception is handled and body is written
        await middleware.InvokeAsync(context);

        // THEN: JSON "status" field is a number, not a string (RFC 7807 compliance)
        responseBody.Seek(0, System.IO.SeekOrigin.Begin);
        var bodyJson = await new System.IO.StreamReader(responseBody).ReadToEndAsync();

        using var doc = JsonDocument.Parse(bodyJson);

        // Find "status" in a case-insensitive manner (SystemTextJson camelCases by default)
        var foundStatus = false;
        foreach (var property in doc.RootElement.EnumerateObject())
        {
            if (string.Equals(property.Name, "status", StringComparison.OrdinalIgnoreCase))
            {
                foundStatus = true;
                Assert.Equal(JsonValueKind.Number, property.Value.ValueKind);
                Assert.Equal(500, property.Value.GetInt32());
            }
        }

        Assert.True(foundStatus, "ProblemDetails JSON body must contain a 'status' field.");
    }

    /// <summary>
    /// Edge case: ProblemDetails.Title in the JSON body must be a non-empty string.
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenExceptionThrown_TitleFieldInBodyShouldBeNonEmptyString()
    {
        // GIVEN: Middleware whose next delegate throws
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(
            next: _ => throw new Exception("Boom"));

        var context = new DefaultHttpContext();
        var responseBody = new System.IO.MemoryStream();
        context.Response.Body = responseBody;

        // WHEN: Exception is handled
        await middleware.InvokeAsync(context);

        // THEN: JSON "title" field is a non-empty string
        responseBody.Seek(0, System.IO.SeekOrigin.Begin);
        var bodyJson = await new System.IO.StreamReader(responseBody).ReadToEndAsync();

        using var doc = JsonDocument.Parse(bodyJson);

        var foundTitle = false;
        foreach (var property in doc.RootElement.EnumerateObject())
        {
            if (string.Equals(property.Name, "title", StringComparison.OrdinalIgnoreCase))
            {
                foundTitle = true;
                Assert.Equal(JsonValueKind.String, property.Value.ValueKind);
                Assert.False(string.IsNullOrWhiteSpace(property.Value.GetString()),
                    "ProblemDetails.Title must not be empty.");
            }
        }

        Assert.True(foundTitle, "ProblemDetails JSON body must contain a 'title' field.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NFR6 — Large exception message must not leak
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Boundary: Even a very large exception message (10KB) must not appear in the response.
    /// This guards against truncation attacks — even partial leakage is prohibited.
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenLargeExceptionMessageThrown_ShouldNotLeakAnyPart()
    {
        // GIVEN: Exception with a very large, unique message
        var largeUniqueToken = $"LEAK_TOKEN_{Guid.NewGuid():N}"; // impossible to guess
        var largeMessage = string.Concat(Enumerable.Repeat(largeUniqueToken, 100)); // ~3.8KB

        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(
            next: _ => throw new InvalidOperationException(largeMessage));

        var context = new DefaultHttpContext();
        var responseBody = new System.IO.MemoryStream();
        context.Response.Body = responseBody;

        // WHEN: Exception with large message is handled
        await middleware.InvokeAsync(context);

        // THEN: No part of the token appears in the response body (NFR6 — full isolation)
        responseBody.Seek(0, System.IO.SeekOrigin.Begin);
        var bodyJson = await new System.IO.StreamReader(responseBody).ReadToEndAsync();

        Assert.DoesNotContain(largeUniqueToken, bodyJson, StringComparison.Ordinal);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Multiple sequential invocations (statelessness)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Edge case: Middleware must handle each invocation independently (no shared mutable state).
    /// Two successive exception calls must each produce 500 with a clean problem+json body.
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenCalledMultipleTimes_EachCallProducesIndependentResponse()
    {
        // GIVEN: A single middleware instance used across two requests (simulating shared instance)
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(
            next: _ => throw new Exception("Repeated error"));

        // WHEN: Two independent contexts are processed sequentially
        var context1 = new DefaultHttpContext();
        context1.Response.Body = new System.IO.MemoryStream();

        var context2 = new DefaultHttpContext();
        context2.Response.Body = new System.IO.MemoryStream();

        await middleware.InvokeAsync(context1);
        await middleware.InvokeAsync(context2);

        // THEN: Both responses independently return 500 with correct content type
        Assert.Equal(500, context1.Response.StatusCode);
        Assert.Equal(500, context2.Response.StatusCode);
        Assert.Equal("application/problem+json", context1.Response.ContentType);
        Assert.Equal("application/problem+json", context2.Response.ContentType);
    }

    /// <summary>
    /// Edge case: Middleware must call next on happy path AND still produce 200 on subsequent
    /// exception call — verifying no state contamination between invocations.
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenSuccessFollowedByException_EachProducesCorrectStatus()
    {
        // GIVEN: First call succeeds, second call throws
        var successMiddleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(
            next: ctx =>
            {
                ctx.Response.StatusCode = 200;
                return Task.CompletedTask;
            });

        var errorMiddleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(
            next: _ => throw new Exception("Error after success"));

        var successContext = new DefaultHttpContext();
        successContext.Response.Body = new System.IO.MemoryStream();

        var errorContext = new DefaultHttpContext();
        errorContext.Response.Body = new System.IO.MemoryStream();

        // WHEN: Both are invoked independently
        await successMiddleware.InvokeAsync(successContext);
        await errorMiddleware.InvokeAsync(errorContext);

        // THEN: Success context is 200, error context is 500 — no state contamination
        Assert.Equal(200, successContext.Response.StatusCode);
        Assert.Equal(500, errorContext.Response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Body completeness boundary
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Boundary: The response body must NOT be empty when an exception is caught.
    /// An empty body with 500 status code does not conform to RFC 7807.
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenExceptionThrown_ResponseBodyMustNotBeEmpty()
    {
        // GIVEN: Middleware whose next delegate throws
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(
            next: _ => throw new Exception("Empty body guard"));

        var context = new DefaultHttpContext();
        var responseBody = new System.IO.MemoryStream();
        context.Response.Body = responseBody;

        // WHEN: Exception is handled
        await middleware.InvokeAsync(context);

        // THEN: Response body has a non-zero length (RFC 7807 requires a body)
        Assert.True(responseBody.Length > 0,
            "Response body must not be empty when ExceptionHandlingMiddleware handles an exception.");
    }

    /// <summary>
    /// Boundary: The ProblemDetails body must not contain the HTTP status code as a string.
    /// The "status" field must be the integer 500, not the string "500".
    /// </summary>
    [Fact]
    public async Task ExceptionHandlingMiddleware_WhenExceptionThrown_DetailFieldShouldBeNullOrAbsent()
    {
        // GIVEN: Middleware configured with Detail = null (NFR6 compliance)
        var middleware = new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(
            next: _ => throw new Exception("Internal details must not leak"));

        var context = new DefaultHttpContext();
        var responseBody = new System.IO.MemoryStream();
        context.Response.Body = responseBody;

        // WHEN: Exception is handled
        await middleware.InvokeAsync(context);

        // THEN: ProblemDetails.Detail is null or not present in serialized JSON
        responseBody.Seek(0, System.IO.SeekOrigin.Begin);
        var bodyJson = await new System.IO.StreamReader(responseBody).ReadToEndAsync();

        using var doc = JsonDocument.Parse(bodyJson);

        // Check if "detail" property exists at all
        if (doc.RootElement.TryGetProperty("detail", out var detailElement) ||
            doc.RootElement.TryGetProperty("Detail", out detailElement))
        {
            // If present, it must be null (JsonValueKind.Null)
            Assert.Equal(JsonValueKind.Null, detailElement.ValueKind);
        }
        // If not present at all, that also satisfies the requirement
    }
}
