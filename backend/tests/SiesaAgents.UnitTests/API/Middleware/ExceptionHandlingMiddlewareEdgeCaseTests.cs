using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using SiesaAgents.Domain.Exceptions;
using Xunit;

// Story 1.3: Backend Database Foundation — Edge Case / Expanded Coverage
// Complements ExceptionHandlingMiddlewareTests.cs (ATDD baseline)
// Covers: domain exceptions, boundary conditions, RFC 7807 field completeness,
//         ArgumentNullException, InvalidOperationException, concurrent calls,
//         and ConflictException / NotFoundException mappings.

namespace SiesaAgents.UnitTests.API.Middleware;

/// <summary>
/// Edge-case and boundary tests for ExceptionHandlingMiddleware.
/// These tests expand coverage beyond the ATDD baseline:
/// - Domain-specific exceptions (NotFoundException, ConflictException)
/// - ArgumentNullException → 400 (subclass of ArgumentException)
/// - InvalidOperationException → 500 (generic, no internal detail leak)
/// - RFC 7807 required 'type' field present and is a URI
/// - Response body status matches HTTP status code
/// - Middleware is idempotent across sequential invocations
/// - Empty exception message handled safely
/// </summary>
public class ExceptionHandlingMiddlewareEdgeCaseTests
{
    // ──────────────────────────────────────────────────────────────────────────
    // Domain Exception: NotFoundException → 404
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNotFoundExceptionThrown_Returns404StatusCode()
    {
        // GIVEN: Domain NotFoundException is thrown (e.g., entity not found in repository)
        var middleware = CreateMiddleware();
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new NotFoundException("Cliente with id 'abc' was not found.");

        // WHEN: The exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: HTTP 404 is returned — domain NotFoundException maps to Not Found
        Assert.Equal(404, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenNotFoundExceptionThrown_ReturnsProblemDetailsWith404Body()
    {
        // GIVEN: Domain NotFoundException is thrown
        var middleware = CreateMiddleware();
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new NotFoundException("Resource not found");

        // WHEN: The exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: Response body is Problem Details with status 404
        var problem = await DeserializeProblemDetailsAsync(context);
        Assert.NotNull(problem);
        Assert.Equal(404, problem!.Status);
    }

    [Fact]
    public async Task InvokeAsync_WhenNotFoundExceptionThrown_ContentTypeIsApplicationProblemJson()
    {
        // GIVEN: Domain NotFoundException is thrown
        var middleware = CreateMiddleware();
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new NotFoundException("Not found");

        // WHEN: The exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: Content-Type is application/problem+json (RFC 7807)
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Domain Exception: ConflictException → 409
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenConflictExceptionThrown_Returns409StatusCode()
    {
        // GIVEN: Domain ConflictException is thrown (e.g., duplicate NIT)
        var middleware = CreateMiddleware();
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new ConflictException("A cliente with NIT '900123456' already exists.");

        // WHEN: The exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: HTTP 409 is returned — ConflictException maps to Conflict
        Assert.Equal(409, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenConflictExceptionThrown_ReturnsProblemDetailsWith409Body()
    {
        // GIVEN: ConflictException is thrown
        var middleware = CreateMiddleware();
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new ConflictException("Conflict occurred");

        // WHEN: The exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: Response body is Problem Details with status 409
        var problem = await DeserializeProblemDetailsAsync(context);
        Assert.NotNull(problem);
        Assert.Equal(409, problem!.Status);
    }

    [Fact]
    public async Task InvokeAsync_WhenConflictExceptionThrown_ContentTypeIsApplicationProblemJson()
    {
        // GIVEN: ConflictException is thrown
        var middleware = CreateMiddleware();
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new ConflictException("Conflict");

        // WHEN: The exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: Content-Type is application/problem+json (RFC 7807)
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ArgumentNullException → 400 (subclass of ArgumentException)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenArgumentNullExceptionThrown_Returns400StatusCode()
    {
        // GIVEN: ArgumentNullException is thrown (subclass of ArgumentException)
        // ArgumentNullException inherits from ArgumentException → must map to 400
        var middleware = CreateMiddleware();
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new ArgumentNullException("clienteId", "clienteId must not be null.");

        // WHEN: The exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: HTTP 400 is returned (not 500)
        Assert.Equal(400, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenArgumentNullExceptionThrown_ReturnsProblemDetailsNot500()
    {
        // GIVEN: ArgumentNullException is thrown
        var middleware = CreateMiddleware();
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new ArgumentNullException("id");

        // WHEN: The exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: Response body status is 400, not 500 — must not treat null arg as internal error
        var problem = await DeserializeProblemDetailsAsync(context);
        Assert.NotNull(problem);
        Assert.Equal(400, problem!.Status);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // InvalidOperationException → 500 (not a domain exception)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenInvalidOperationExceptionThrown_Returns500StatusCode()
    {
        // GIVEN: InvalidOperationException is thrown (infrastructure/unexpected failure)
        var middleware = CreateMiddleware();
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new InvalidOperationException("Connection string not configured.");

        // WHEN: The exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: HTTP 500 is returned (InvalidOperationException is not a domain exception)
        Assert.Equal(500, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenInvalidOperationExceptionThrown_DetailDoesNotExposeInternalMessage()
    {
        // GIVEN: InvalidOperationException with sensitive message
        // NFR6: No internal messages must be exposed for generic 500 errors
        var middleware = CreateMiddleware();
        var context = CreateHttpContext();
        const string sensitiveMessage = "Connection string DefaultConnection points to production-db.internal";
        RequestDelegate next = _ => throw new InvalidOperationException(sensitiveMessage);

        // WHEN: The exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: The sensitive message is NOT present in the response body
        var body = await ReadBodyAsync(context);
        Assert.DoesNotContain(sensitiveMessage, body);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // RFC 7807 Field Completeness: 'type' field must be a URI
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_ResponseBodyContainsTypeFieldAsUri()
    {
        // GIVEN: RFC 7807 requires a 'type' field — a URI identifying the error type
        var middleware = CreateMiddleware();
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new Exception("Generic error");

        // WHEN: The exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: The 'type' field is present and is a valid URI string
        var body = await ReadBodyAsync(context);
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("type", out var typeElement),
            "RFC 7807 requires a 'type' field in the Problem Details response.");
        var typeValue = typeElement.GetString() ?? string.Empty;
        Assert.True(Uri.IsWellFormedUriString(typeValue, UriKind.Absolute),
            $"Problem Details 'type' field must be an absolute URI. Got: '{typeValue}'");
    }

    [Fact]
    public async Task InvokeAsync_WhenKeyNotFoundExceptionThrown_ResponseBodyContainsTypeFieldAsUri()
    {
        // GIVEN: KeyNotFoundException thrown (404 path)
        var middleware = CreateMiddleware();
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new KeyNotFoundException("Not found");

        // WHEN: The exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: The 'type' field is a valid URI
        var body = await ReadBodyAsync(context);
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("type", out var typeElement));
        var typeValue = typeElement.GetString() ?? string.Empty;
        Assert.True(Uri.IsWellFormedUriString(typeValue, UriKind.Absolute));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // RFC 7807: Response body 'status' field matches HTTP status code
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionThrown_BodyStatusFieldMatchesHttpStatusCode()
    {
        // GIVEN: RFC 7807 requires body 'status' to match the HTTP response code
        var middleware = CreateMiddleware();
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new Exception("Some error");

        // WHEN: The exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: HTTP status code equals the body 'status' field
        var problem = await DeserializeProblemDetailsAsync(context);
        Assert.NotNull(problem);
        Assert.Equal(context.Response.StatusCode, problem!.Status);
    }

    [Fact]
    public async Task InvokeAsync_WhenNotFoundExceptionThrown_BodyStatusFieldMatchesHttpStatusCode()
    {
        // GIVEN: NotFoundException thrown (404 path)
        var middleware = CreateMiddleware();
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new NotFoundException("Not found");

        // WHEN: The exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: HTTP status code (404) equals body 'status' field (404)
        var problem = await DeserializeProblemDetailsAsync(context);
        Assert.NotNull(problem);
        Assert.Equal(context.Response.StatusCode, problem!.Status);
        Assert.Equal(404, problem!.Status);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Edge: Empty or null exception message handled safely
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenExceptionWithEmptyMessageThrown_Returns500WithNonEmptyDetail()
    {
        // GIVEN: An exception with an empty message string (edge case)
        var middleware = CreateMiddleware();
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new Exception(string.Empty);

        // WHEN: The exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: HTTP 500 is returned and the detail field is non-null (default fallback message)
        Assert.Equal(500, context.Response.StatusCode);
        var problem = await DeserializeProblemDetailsAsync(context);
        Assert.NotNull(problem);
        // For generic exceptions, detail should be the safe fallback message, not empty
        Assert.False(string.IsNullOrWhiteSpace(problem!.Detail),
            "The 'detail' field must not be empty even when the exception message is empty.");
    }

    [Fact]
    public async Task InvokeAsync_WhenArgumentExceptionWithEmptyMessageThrown_Returns400()
    {
        // GIVEN: ArgumentException with empty message (boundary condition)
        var middleware = CreateMiddleware();
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new ArgumentException(string.Empty);

        // WHEN: The exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: 400 is returned regardless of empty message — exception type drives the mapping
        Assert.Equal(400, context.Response.StatusCode);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Edge: Sequential invocations are independent (no shared state / idempotency)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_CalledSequentiallyWithDifferentExceptions_MapsEachIndependently()
    {
        // GIVEN: The same middleware instance is reused across multiple requests
        // (as expected in ASP.NET Core where IMiddleware is transient)
        var middleware = CreateMiddleware();

        var context404 = CreateHttpContext();
        RequestDelegate next404 = _ => throw new KeyNotFoundException("Not found");

        var context400 = CreateHttpContext();
        RequestDelegate next400 = _ => throw new ArgumentException("Bad argument");

        var context500 = CreateHttpContext();
        RequestDelegate next500 = _ => throw new Exception("Internal error");

        // WHEN: Three different exceptions are processed sequentially
        await middleware.InvokeAsync(context404, next404);
        await middleware.InvokeAsync(context400, next400);
        await middleware.InvokeAsync(context500, next500);

        // THEN: Each HTTP context gets the correct status code independently
        Assert.Equal(404, context404.Response.StatusCode);
        Assert.Equal(400, context400.Response.StatusCode);
        Assert.Equal(500, context500.Response.StatusCode);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Edge: No exception — pass-through body is preserved
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNoExceptionThrown_DoesNotWriteToResponseBody()
    {
        // GIVEN: Middleware configured, no exception in next pipeline
        var middleware = CreateMiddleware();
        var context = CreateHttpContext();
        RequestDelegate next = _ => Task.CompletedTask;

        // WHEN: No exception occurs
        await middleware.InvokeAsync(context, next);

        // THEN: The middleware does not write to the response body (preserves original body)
        var body = await ReadBodyAsync(context);
        Assert.Empty(body);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Edge: Title field is always non-null and non-whitespace for all exception types
    // ──────────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("KeyNotFoundException")]
    [InlineData("ArgumentException")]
    [InlineData("NotFoundException")]
    [InlineData("ConflictException")]
    [InlineData("InvalidOperationException")]
    [InlineData("Exception")]
    public async Task InvokeAsync_AllExceptionTypes_TitleFieldIsNeverNullOrEmpty(string exceptionType)
    {
        // GIVEN: Any exception type is thrown
        var middleware = CreateMiddleware();
        var context = CreateHttpContext();
        RequestDelegate next = exceptionType switch
        {
            "KeyNotFoundException" => _ => throw new KeyNotFoundException("msg"),
            "ArgumentException" => _ => throw new ArgumentException("msg"),
            "NotFoundException" => _ => throw new NotFoundException("msg"),
            "ConflictException" => _ => throw new ConflictException("msg"),
            "InvalidOperationException" => _ => throw new InvalidOperationException("msg"),
            _ => _ => throw new Exception("msg")
        };

        // WHEN: The exception propagates through the middleware
        await middleware.InvokeAsync(context, next);

        // THEN: The 'title' field in the Problem Details body is always non-empty
        var problem = await DeserializeProblemDetailsAsync(context);
        Assert.NotNull(problem);
        Assert.False(string.IsNullOrWhiteSpace(problem!.Title),
            $"'title' must never be null/empty for exception type '{exceptionType}'.");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    private static SiesaAgents.API.Middleware.ExceptionHandlingMiddleware CreateMiddleware()
    {
        var logger = NullLogger<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>.Instance;
        return new SiesaAgents.API.Middleware.ExceptionHandlingMiddleware(logger);
    }

    private static DefaultHttpContext CreateHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static async Task<string> ReadBodyAsync(HttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        return await reader.ReadToEndAsync();
    }

    private static async Task<ProblemDetails?> DeserializeProblemDetailsAsync(HttpContext context)
    {
        var body = await ReadBodyAsync(context);
        if (string.IsNullOrWhiteSpace(body)) return null;
        return JsonSerializer.Deserialize<ProblemDetails>(body, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
    }
}
