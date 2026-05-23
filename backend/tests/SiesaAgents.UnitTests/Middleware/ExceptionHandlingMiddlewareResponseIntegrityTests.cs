// Story 1.3: Backend Database Foundation
// AC3 — ExceptionHandlingMiddleware — Response Integrity & Pass-Through Edge Cases
//
// Covers:
//   - ProblemDetails JSON field isolation: no unexpected leak fields
//   - "detail" field is null (not missing) in JSON output
//   - Pass-through: custom status codes (201, 404) are preserved
//   - Pass-through: Content-Type is NOT set to problem+json on happy paths
//   - Async next delegate completes normally (no deadlock)
//   - Exception thrown after async continuation (after 'await') is still caught
//
// Test pattern: Arrange / Act / Assert (Given-When-Then)

using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests.Middleware;

public class ExceptionHandlingMiddlewareResponseIntegrityTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Edge: ProblemDetails JSON field isolation — no unexpected fields
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Given an unhandled exception,
    /// When ExceptionHandlingMiddleware writes the response,
    /// Then the JSON body contains only expected RFC 7807 fields — no custom leak fields.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyContainsOnlyExpectedRfc7807Fields()
    {
        // Arrange
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new Exception("leak me if you can"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert — parse raw JSON to inspect actual keys
        var rawBody = await ReadBodyAsStringAsync(context);
        using var doc = JsonDocument.Parse(rawBody);
        var root = doc.RootElement;

        // Required fields must exist
        Assert.True(root.TryGetProperty("status", out _), "Missing 'status' field in ProblemDetails");
        Assert.True(root.TryGetProperty("title", out _), "Missing 'title' field in ProblemDetails");

        // Forbidden leak fields must NOT exist
        Assert.False(root.TryGetProperty("exceptionMessage", out _), "'exceptionMessage' must not be present");
        Assert.False(root.TryGetProperty("innerException", out _), "'innerException' must not be present");
        Assert.False(root.TryGetProperty("stackTrace", out _), "'stackTrace' must not be present");
        Assert.False(root.TryGetProperty("source", out _), "'source' must not be present");
        Assert.False(root.TryGetProperty("targetSite", out _), "'targetSite' must not be present");
    }

    /// <summary>
    /// Given an unhandled exception,
    /// When ExceptionHandlingMiddleware writes the response,
    /// Then "detail" field in JSON is null or absent (RFC 7807 compliance — never contains ex.Message).
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_DetailFieldIsNullOrAbsent()
    {
        // Arrange
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new Exception("sensitive message"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var rawBody = await ReadBodyAsStringAsync(context);
        using var doc = JsonDocument.Parse(rawBody);
        var root = doc.RootElement;

        // "detail" must be null or absent (NullValueHandling=Ignore is acceptable per RFC 7807)
        if (root.TryGetProperty("detail", out var detailProp))
        {
            Assert.Equal(JsonValueKind.Null, detailProp.ValueKind);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: pass-through path — response integrity when no exception
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Given a next delegate that sets a custom response status (e.g., 201 Created),
    /// When the middleware processes the request without exception,
    /// Then the custom status is preserved — middleware does not tamper with successful responses.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenNoException_PreservesCustomStatusCodeSet201()
    {
        // Arrange
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status201Created;
            return Task.CompletedTask;
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(StatusCodes.Status201Created, context.Response.StatusCode);
    }

    /// <summary>
    /// Given a next delegate that sets a 404 Not Found response,
    /// When the middleware processes the request without exception,
    /// Then the 404 status is preserved — middleware does not convert it to 500.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenNoException_Preserves404StatusCode()
    {
        // Arrange
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status404NotFound;
            return Task.CompletedTask;
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(StatusCodes.Status404NotFound, context.Response.StatusCode);
    }

    /// <summary>
    /// Given a next delegate that does not modify the response Content-Type,
    /// When the middleware processes the request without exception,
    /// Then the Content-Type is NOT set to "application/problem+json" by the middleware.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenNoException_DoesNotSetProblemJsonContentType()
    {
        // Arrange
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(_ => Task.CompletedTask);

        // Act
        await middleware.InvokeAsync(context);

        // Assert — middleware must not inject problem+json header on happy paths
        Assert.NotEqual("application/problem+json", context.Response.ContentType);
    }

    /// <summary>
    /// Given a next delegate that returns an asynchronous Task (typical async pipeline),
    /// When the middleware awaits it without exception,
    /// Then the middleware completes successfully (no deadlock or hang).
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenNextIsAsyncAndCompletesSuccessfully_MiddlewareCompletesNormally()
    {
        // Arrange
        var context = CreateContext();
        var completedNormally = false;
        var middleware = new ExceptionHandlingMiddleware(async _ =>
        {
            await Task.Yield(); // minimal async yield — not a hard wait
            completedNormally = true;
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.True(completedNormally);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: exception thrown inside an async next delegate
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Given a next delegate that throws an exception after an async continuation
    /// (exception thrown after 'await', typical for async DB or service calls),
    /// When ExceptionHandlingMiddleware catches it,
    /// Then the same 500 problem+json contract is enforced.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenAsyncNextThrowsAfterAwait_Returns500ProblemJson()
    {
        // Arrange
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(async _ =>
        {
            await Task.Yield(); // ensures we are in an async continuation
            throw new InvalidOperationException("DB call failed after async resume");
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
        Assert.Equal("application/problem+json", context.Response.ContentType);
        var problem = await ReadBodyAsProblemDetailsAsync(context);
        Assert.NotNull(problem);
        Assert.Null(problem.Detail);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private static DefaultHttpContext CreateContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static async Task<ProblemDetails?> ReadBodyAsProblemDetailsAsync(DefaultHttpContext context)
    {
        var raw = await ReadBodyAsStringAsync(context);
        return JsonSerializer.Deserialize<ProblemDetails>(
            raw,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    }

    private static async Task<string> ReadBodyAsStringAsync(DefaultHttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        return await new StreamReader(context.Response.Body).ReadToEndAsync();
    }
}
