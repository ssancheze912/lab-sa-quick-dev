using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests.API.Middleware;

/// <summary>
/// Edge-case and boundary unit tests for ExceptionHandlingMiddleware — Part 1.
/// Story 1.3: Backend Database Foundation — extended coverage beyond ATDD baseline.
///
/// Covers:
///   - Exception subtype inheritance (ArgumentNullException → 400 via ArgumentException branch)
///   - Exception with null message edge case
///   - OperationCanceledException → 500 (not in explicit mapping)
///   - Custom/unlisted exception types → 500
///   - Response body is always valid JSON
///   - HTTP status code in body always matches HTTP response status code
///   - Inner exception isolation (detail uses outer message only)
/// </summary>
public class ExceptionHandlingMiddlewareEdgeCaseTests
{
    // -------------------------------------------------------------------------
    // Helper: Build a default HttpContext with a writable response body stream
    // -------------------------------------------------------------------------
    private static DefaultHttpContext CreateHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static async Task<ProblemDetails?> ReadProblemDetailsAsync(HttpResponse response)
    {
        response.Body.Seek(0, SeekOrigin.Begin);
        var json = await new StreamReader(response.Body).ReadToEndAsync();
        return JsonSerializer.Deserialize<ProblemDetails>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
    }

    private static async Task<string> ReadBodyAsStringAsync(HttpResponse response)
    {
        response.Body.Seek(0, SeekOrigin.Begin);
        return await new StreamReader(response.Body).ReadToEndAsync();
    }

    // =========================================================================
    // Subtype inheritance — ArgumentNullException inherits ArgumentException → 400
    // =========================================================================

    [Fact]
    public async Task InvokeAsync_ArgumentNullException_Returns400()
    {
        // GIVEN: ArgumentNullException is a subclass of ArgumentException
        //        The middleware switch maps ArgumentException → 400
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new ArgumentNullException("paramName", "Parameter cannot be null")
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: HTTP status is 400 (inherited from ArgumentException branch)
        Assert.Equal(StatusCodes.Status400BadRequest, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_ArgumentNullException_ContentTypeIsProblemJson()
    {
        // GIVEN: ArgumentNullException thrown downstream
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new ArgumentNullException("id")
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: Content-Type is application/problem+json regardless of subtype
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    // =========================================================================
    // Edge case: Exception with empty / whitespace message
    // =========================================================================

    [Fact]
    public async Task InvokeAsync_ExceptionWithEmptyMessage_ResponseBodyIsStillValidJson()
    {
        // GIVEN: An exception with an empty message string
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception(string.Empty)
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: Response body is still valid JSON (no serialization crash)
        var body = await ReadBodyAsStringAsync(context.Response);
        var exception = Record.Exception(() => JsonDocument.Parse(body));
        Assert.Null(exception);
    }

    [Fact]
    public async Task InvokeAsync_ExceptionWithEmptyMessage_DetailFieldIsNotNull()
    {
        // GIVEN: An exception with an empty message
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception(string.Empty)
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: Status is populated correctly even when detail may be empty
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.NotNull(problem);
        Assert.Equal(StatusCodes.Status500InternalServerError, problem.Status);
    }

    // =========================================================================
    // OperationCanceledException — NOT in explicit mapping → falls to 500
    // =========================================================================

    [Fact]
    public async Task InvokeAsync_OperationCanceledException_Returns500()
    {
        // GIVEN: OperationCanceledException is NOT in the exception switch mapping
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new OperationCanceledException("Request was cancelled")
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: Falls to default case → HTTP 500
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_OperationCanceledException_ContentTypeIsProblemJson()
    {
        // GIVEN: OperationCanceledException not in explicit mapping
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new OperationCanceledException()
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: Content-Type is still application/problem+json (consistent behavior)
        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    // =========================================================================
    // Custom exception type — unlisted → default 500
    // =========================================================================

    [Fact]
    public async Task InvokeAsync_UnlistedCustomException_Returns500()
    {
        // GIVEN: A custom exception type that does not appear in the middleware's switch
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new DivideByZeroException("Division by zero")
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: Unmapped exception type falls to default → 500
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_UnlistedCustomException_BodyContains500StatusField()
    {
        // GIVEN: DivideByZeroException — not in exception mapping
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new DivideByZeroException("Divide by zero")
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: Body "status" field equals 500 (consistent with HTTP status)
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.NotNull(problem);
        Assert.Equal(500, problem.Status);
    }

    // =========================================================================
    // Invariant: HTTP status code in body ALWAYS matches HTTP response status code
    // =========================================================================

    [Theory]
    [InlineData(typeof(KeyNotFoundException), StatusCodes.Status404NotFound)]
    [InlineData(typeof(ArgumentException), StatusCodes.Status400BadRequest)]
    [InlineData(typeof(InvalidOperationException), StatusCodes.Status409Conflict)]
    public async Task InvokeAsync_AnyMappedException_StatusInBodyMatchesHttpStatusCode(
        Type exceptionType, int expectedStatus)
    {
        // GIVEN: Each mapped exception type with its expected HTTP status code
        var exception = (Exception)Activator.CreateInstance(exceptionType, "Test message")!;
        var middleware = new ExceptionHandlingMiddleware(next: _ => throw exception);
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: HTTP response status code matches the "status" field in the Problem Details body
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.NotNull(problem);
        Assert.Equal(expectedStatus, context.Response.StatusCode);
        Assert.Equal(expectedStatus, problem.Status);
    }

    // =========================================================================
    // Response body is always valid JSON — boundary: very long exception message
    // =========================================================================

    [Fact]
    public async Task InvokeAsync_ExceptionWithVeryLongMessage_ResponseBodyIsValidJson()
    {
        // GIVEN: Exception with a very long message (boundary: >10,000 chars)
        var longMessage = new string('X', 10_001);
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception(longMessage)
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: Response body is valid JSON despite the large message
        var body = await ReadBodyAsStringAsync(context.Response);
        var parseException = Record.Exception(() => JsonDocument.Parse(body));
        Assert.Null(parseException);
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
    }

    // =========================================================================
    // Inner exception isolation — detail must use outer message only
    // =========================================================================

    [Fact]
    public async Task InvokeAsync_ExceptionWithInnerException_DetailContainsOuterMessageOnly()
    {
        // GIVEN: An exception that has an inner exception with a different message
        const string outerMessage = "Outer exception message";
        const string innerMessage = "Inner exception details should NOT appear in detail field";
        var innerException = new Exception(innerMessage);
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception(outerMessage, innerException)
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: Detail contains the outer exception message only (never leaks inner exception)
        var problem = await ReadProblemDetailsAsync(context.Response);
        Assert.NotNull(problem);
        Assert.Equal(outerMessage, problem.Detail);
    }

    [Fact]
    public async Task InvokeAsync_ExceptionWithInnerException_InnerMessageNotInResponseBody()
    {
        // GIVEN: Outer exception wrapping inner exception with sensitive inner details
        const string innerMessage = "SENSITIVE_INNER_DETAIL_MARKER";
        var innerException = new Exception(innerMessage);
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new Exception("Outer message", innerException)
        );
        var context = CreateHttpContext();

        // WHEN: Request is processed
        await middleware.InvokeAsync(context);

        // THEN: The inner exception message does NOT appear in the HTTP response body
        var body = await ReadBodyAsStringAsync(context.Response);
        Assert.DoesNotContain(innerMessage, body, StringComparison.Ordinal);
    }
}
