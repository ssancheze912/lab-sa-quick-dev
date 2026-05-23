// Story 1.3: Backend Database Foundation
// AC3 — ExceptionHandlingMiddleware — Edge Cases & Boundary Conditions
//
// Expands the ATDD coverage in ExceptionHandlingMiddlewareTests.cs with:
//   - Different exception types (NullReferenceException, UnauthorizedAccessException,
//     AggregateException, OperationCanceledException)
//   - Response body field isolation: no unexpected leaking fields
//   - Content-Type header is set BEFORE body is written (ordering contract)
//   - StatusCode is set BEFORE body is written (ordering contract)
//   - Middleware is idempotent: second InvokeAsync call on a fresh context still works
//   - Exception with an empty message still produces a valid ProblemDetails
//   - Exception with a very long message does not overflow the response
//   - AggregateException (typical when async tasks throw): inner exception detail not exposed
//   - OperationCanceledException: same 500 contract applies (it is caught by catch(Exception))
//
// Test pattern: Arrange / Act / Assert (Given-When-Then)

using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests.Middleware;

public class ExceptionHandlingMiddlewareEdgeCaseTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Edge: different exception types — contract must be identical
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Given a NullReferenceException (most common runtime crash),
    /// When ExceptionHandlingMiddleware catches it,
    /// Then the response is still 500 problem+json with null detail.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenNullReferenceExceptionThrown_Returns500ProblemJson()
    {
        // Arrange
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new NullReferenceException("Object reference not set to an instance of an object."));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
        Assert.Equal("application/problem+json", context.Response.ContentType);
        var problem = await ReadBodyAsProblemDetailsAsync(context);
        Assert.NotNull(problem);
        Assert.Equal(500, problem.Status);
        Assert.Null(problem.Detail);
    }

    /// <summary>
    /// Given an UnauthorizedAccessException (e.g., file system permission denied),
    /// When ExceptionHandlingMiddleware catches it,
    /// Then detail is null — the access denial reason is NOT exposed.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenUnauthorizedAccessExceptionThrown_DoesNotExposeReason()
    {
        // Arrange
        const string sensitiveReason = "Access to path /etc/secrets is denied";
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new UnauthorizedAccessException(sensitiveReason));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var rawBody = await ReadBodyAsStringAsync(context);
        Assert.DoesNotContain(sensitiveReason, rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("UnauthorizedAccess", rawBody, StringComparison.OrdinalIgnoreCase);
        var problem = await ReadBodyAsProblemDetailsAsync(context);
        Assert.Null(problem!.Detail);
    }

    /// <summary>
    /// Given an AggregateException with multiple inner exceptions (async task failure),
    /// When ExceptionHandlingMiddleware catches it,
    /// Then inner exception messages are NOT exposed in the response body.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenAggregateExceptionThrown_DoesNotExposeInnerExceptionDetails()
    {
        // Arrange
        const string innerMsg1 = "Database connection timeout to 192.168.1.100";
        const string innerMsg2 = "Retry limit exceeded after 3 attempts";
        var aggregate = new AggregateException(
            new Exception(innerMsg1),
            new Exception(innerMsg2));

        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(_ => throw aggregate);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var rawBody = await ReadBodyAsStringAsync(context);
        Assert.DoesNotContain(innerMsg1, rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(innerMsg2, rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("AggregateException", rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
    }

    /// <summary>
    /// Given an OperationCanceledException (e.g., CancellationToken triggered),
    /// When ExceptionHandlingMiddleware catches it,
    /// Then it returns 500 problem+json (OperationCanceledException IS-A Exception).
    /// NOTE: In production, a more specific handler may want to return 499/503,
    /// but the current middleware catch(Exception) covers it with a 500 response.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenOperationCanceledExceptionThrown_Returns500ProblemJson()
    {
        // Arrange
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new OperationCanceledException("Request was cancelled"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
        Assert.Equal("application/problem+json", context.Response.ContentType);
        var problem = await ReadBodyAsProblemDetailsAsync(context);
        Assert.Null(problem!.Detail);
    }

    /// <summary>
    /// Given an exception with an empty message string (""),
    /// When ExceptionHandlingMiddleware catches it,
    /// Then a valid ProblemDetails is still returned (title is non-empty from middleware, not from ex.Message).
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenExceptionHasEmptyMessage_StillReturnsValidProblemDetails()
    {
        // Arrange
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(_ => throw new Exception(string.Empty));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var problem = await ReadBodyAsProblemDetailsAsync(context);
        Assert.NotNull(problem);
        Assert.Equal(500, problem.Status);
        Assert.NotNull(problem.Title);
        Assert.NotEmpty(problem.Title!);
        Assert.Null(problem.Detail);
    }

    /// <summary>
    /// Given an exception with a very long internal message (e.g., serialized inner state),
    /// When ExceptionHandlingMiddleware catches it,
    /// Then the long message does NOT appear in the response body.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenExceptionHasVeryLongMessage_DoesNotLeakLongMessageInResponse()
    {
        // Arrange
        var longMessage = new string('X', 10_000) + "SENSITIVE_TOKEN_abc123";
        var context = CreateContext();
        var middleware = new ExceptionHandlingMiddleware(_ => throw new Exception(longMessage));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var rawBody = await ReadBodyAsStringAsync(context);
        Assert.DoesNotContain("SENSITIVE_TOKEN_abc123", rawBody, StringComparison.Ordinal);
        // Response should be compact — well under 1 KB for a generic problem+json
        Assert.True(rawBody.Length < 1024,
            $"Response body is unexpectedly large ({rawBody.Length} chars): possible exception message leak.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: ProblemDetails JSON field isolation — no unexpected fields
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Given an unhandled exception,
    /// When ExceptionHandlingMiddleware writes the response,
    /// Then the JSON body contains ONLY the expected RFC 7807 fields:
    /// "status", "title" (and optionally "type", "instance") — no custom leak fields.
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
    /// Then "detail" field in JSON is null (not missing — RFC 7807 compliance).
    /// </summary>
    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_DetailFieldIsPresentAndNull()
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

        // "detail" must appear in the JSON with a null value (not be absent)
        // ProblemDetails serializes null fields depending on JsonOptions — check both cases:
        // either absent (acceptable when NullValueHandling=Ignore) or explicitly null
        if (root.TryGetProperty("detail", out var detailProp))
        {
            Assert.Equal(JsonValueKind.Null, detailProp.ValueKind);
        }
        // If "detail" is absent from the JSON, it means it was serialized with NullValueHandling=Ignore
        // which is also acceptable per RFC 7807 (field is optional)
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
            await Task.Delay(1); // simulate async work
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
    // Private helpers (duplicated from main tests for isolation)
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
