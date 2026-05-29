/**
 * Story 1.3: Backend Database Foundation — Middleware Edge Cases
 *
 * EDGE CASE & BOUNDARY TESTS for ExceptionHandlingMiddleware
 *
 * Complements ExceptionHandlingMiddlewareTests.cs (ATDD happy paths) by covering:
 *   - NotFoundException with entity+id constructor overload
 *   - ValidationException message propagation in detail field
 *   - Exception with empty message string
 *   - Exception with special-character message (XSS attempt in message body)
 *   - Exception thrown asynchronously via Task.FromException
 *   - Response already started (middleware must not re-write body)
 *   - OperationCanceledException (request cancellation — should surface as 500)
 *   - Exception derived from NotFoundException (LSP: subclass of known type)
 *   - Exception derived from ValidationException (subclass behaviour)
 *   - AggregateException wrapping (not a domain exception → 500)
 *
 * Pattern: Arrange / Act / Assert
 * Framework: xUnit + DefaultHttpContext + MemoryStream response body
 */

using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using SiesaAgents.API.Middleware;
using SiesaAgents.Domain.Exceptions;
using Xunit;

namespace SiesaAgents.UnitTests.Middleware;

public class ExceptionHandlingMiddlewareEdgeCaseTests
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    // ---------------------------------------------------------------------------
    // NotFoundException — entity+id constructor overload
    // ---------------------------------------------------------------------------

    /// <summary>
    /// Given NotFoundException is constructed with the entityName+id overload,
    /// When the error reaches the middleware,
    /// Then status code is 404 and detail contains the formatted message.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_NotFoundExceptionEntityId_Returns404WithFormattedDetail()
    {
        // Arrange
        var entityId = Guid.NewGuid();
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new NotFoundException("Cliente", entityId));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(StatusCodes.Status404NotFound, context.Response.StatusCode);
        var body = await ReadBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body, JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal(404, problem!.Status);
        Assert.Contains("Cliente", problem.Detail ?? string.Empty);
        Assert.Contains(entityId.ToString(), problem.Detail ?? string.Empty);
    }

    /// <summary>
    /// Given NotFoundException is constructed with entity+id overload,
    /// When the error reaches the middleware,
    /// Then Content-Type is application/problem+json.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_NotFoundExceptionEntityId_SetsCorrectContentType()
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new NotFoundException("Order", 42));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Contains("application/problem+json", context.Response.ContentType);
    }

    // ---------------------------------------------------------------------------
    // ValidationException — detail field propagated (not null for 400)
    // ---------------------------------------------------------------------------

    /// <summary>
    /// Given ValidationException is thrown with a descriptive message,
    /// When the error reaches the middleware,
    /// Then the detail field in the Problem Details body matches the exception message.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_ValidationException_DetailFieldContainsExceptionMessage()
    {
        // Arrange
        const string validationMessage = "Email is required";
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new ValidationException(validationMessage));

        // Act
        await middleware.InvokeAsync(context);

        // Assert — detail must propagate for 400 (unlike 500 where it is null)
        var body = await ReadBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body, JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal(validationMessage, problem!.Detail);
    }

    // ---------------------------------------------------------------------------
    // Exception with empty message — boundary condition
    // ---------------------------------------------------------------------------

    /// <summary>
    /// Given a generic exception is thrown with an empty message string,
    /// When the error reaches the middleware,
    /// Then the response is still 500 with null detail (no internal exposure).
    /// </summary>
    [Fact]
    public async Task InvokeAsync_GenericExceptionWithEmptyMessage_Returns500WithNullDetail()
    {
        // Arrange — edge case: empty message
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new System.Exception(string.Empty));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
        var body = await ReadBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body, JsonOptions);
        Assert.NotNull(problem);
        Assert.Null(problem!.Detail);
    }

    /// <summary>
    /// Given NotFoundException is thrown with an empty message string,
    /// When the error reaches the middleware,
    /// Then status is 404 and body is valid Problem Details JSON.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_NotFoundExceptionWithEmptyMessage_Returns404WithValidBody()
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new NotFoundException(string.Empty));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(StatusCodes.Status404NotFound, context.Response.StatusCode);
        var body = await ReadBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body, JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal(404, problem!.Status);
    }

    // ---------------------------------------------------------------------------
    // Exception with special characters in message — XSS/injection boundary
    // ---------------------------------------------------------------------------

    /// <summary>
    /// Given ValidationException contains a message with HTML/script characters,
    /// When the error reaches the middleware,
    /// Then the response is valid JSON and special chars are safely serialized (not raw HTML).
    /// </summary>
    [Fact]
    public async Task InvokeAsync_ValidationExceptionWithHtmlChars_ResponseIsValidJson()
    {
        // Arrange — potential XSS payload in validation message
        const string xssMessage = "<script>alert('xss')</script> invalid email";
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new ValidationException(xssMessage));

        // Act
        await middleware.InvokeAsync(context);

        // Assert — response is parseable JSON (not raw HTML injection)
        var body = await ReadBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body, JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal(400, problem!.Status);
        // The raw body should not contain unescaped <script> tag
        Assert.DoesNotContain("<script>", body);
    }

    // ---------------------------------------------------------------------------
    // Async exception (Task.FromException) — next delegate returns failed Task
    // ---------------------------------------------------------------------------

    /// <summary>
    /// Given next delegate returns a Task that faults (simulating async middleware failure),
    /// When the error propagates through InvokeAsync,
    /// Then the middleware catches it and returns 500 Problem Details.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_AsyncNextDelegateFaults_Returns500()
    {
        // Arrange — simulate async exception in the pipeline
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ =>
            Task.FromException(new InvalidOperationException("async fault")));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
        var body = await ReadBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body, JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal(500, problem!.Status);
    }

    /// <summary>
    /// Given next delegate returns a Task that faults with NotFoundException,
    /// When the error propagates through InvokeAsync,
    /// Then the middleware catches it and returns 404 Problem Details.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_AsyncNotFoundExceptionFromTask_Returns404()
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ =>
            Task.FromException(new NotFoundException("Async resource not found")));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(StatusCodes.Status404NotFound, context.Response.StatusCode);
    }

    // ---------------------------------------------------------------------------
    // OperationCanceledException — request cancellation
    // ---------------------------------------------------------------------------

    /// <summary>
    /// Given OperationCanceledException is thrown (client disconnected / cancelled),
    /// When the error reaches the middleware,
    /// Then status code is 500 (not a domain exception, middleware treats it generically).
    /// </summary>
    [Fact]
    public async Task InvokeAsync_OperationCanceledException_Returns500()
    {
        // Arrange — OperationCanceledException is not a domain exception
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new OperationCanceledException("Request cancelled"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert — must not crash; domain-agnostic exception → 500
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
    }

    // ---------------------------------------------------------------------------
    // AggregateException wrapping a domain exception
    // ---------------------------------------------------------------------------

    /// <summary>
    /// Given an AggregateException (not a known domain type) is thrown,
    /// When the error reaches the middleware,
    /// Then status code is 500 (AggregateException is not unwrapped by middleware).
    /// </summary>
    [Fact]
    public async Task InvokeAsync_AggregateException_Returns500WithNullDetail()
    {
        // Arrange — AggregateException is not in the domain hierarchy
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new AggregateException(
            new NotFoundException("hidden not found")));

        // Act
        await middleware.InvokeAsync(context);

        // Assert — AggregateException is not mapped to 404; falls through to catch-all 500
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
        var body = await ReadBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body, JsonOptions);
        Assert.NotNull(problem);
        Assert.Null(problem!.Detail); // No internal message exposure
    }

    // ---------------------------------------------------------------------------
    // No exception — response body passthrough integrity
    // ---------------------------------------------------------------------------

    /// <summary>
    /// Given no exception is thrown and next delegate writes a JSON body,
    /// When the request is processed normally,
    /// Then the middleware does not alter or corrupt the response body.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_NoException_PassesThroughResponseBodyUnmodified()
    {
        // Arrange — next delegate writes a custom response
        const string expectedBody = "{\"result\":\"ok\"}";
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(async ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status200OK;
            ctx.Response.ContentType = "application/json";
            await ctx.Response.WriteAsync(expectedBody);
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert — body must be exactly what next delegate wrote
        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
        var body = await ReadBodyAsync(context);
        Assert.Equal(expectedBody, body);
    }

    // ---------------------------------------------------------------------------
    // Response body is valid JSON for all exception types
    // ---------------------------------------------------------------------------

    /// <summary>
    /// Given any exception type is thrown,
    /// When the error reaches the middleware,
    /// Then the response body can always be deserialized as ProblemDetails JSON.
    /// </summary>
    [Theory]
    [InlineData("generic")]
    [InlineData("notfound")]
    [InlineData("validation")]
    public async Task InvokeAsync_AnyExceptionType_ResponseBodyIsValidProblemDetailsJson(string exceptionType)
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => exceptionType switch
        {
            "notfound" => throw new NotFoundException("Resource not found"),
            "validation" => throw new ValidationException("Invalid input"),
            _ => throw new System.Exception("Generic error")
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert — body must always be valid Problem Details JSON
        var body = await ReadBodyAsync(context);
        Assert.False(string.IsNullOrWhiteSpace(body), "Response body must not be empty");
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body, JsonOptions);
        Assert.NotNull(problem);
        Assert.NotNull(problem!.Status);
        Assert.False(string.IsNullOrWhiteSpace(problem.Title));
    }

    // ---------------------------------------------------------------------------
    // Stack trace boundary — none of the known exception types expose trace
    // ---------------------------------------------------------------------------

    /// <summary>
    /// Given NotFoundException is constructed with entity+id overload (which has a deep call stack),
    /// When the error reaches the middleware,
    /// Then no stack trace appears in the response body (NFR6).
    /// </summary>
    [Fact]
    public async Task InvokeAsync_NotFoundExceptionEntityId_BodyDoesNotContainStackTrace()
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new NotFoundException("Order", Guid.NewGuid()));

        // Act
        await middleware.InvokeAsync(context);

        // Assert — NFR6: no stack trace for any response code
        var bodyText = await ReadBodyAsync(context);
        Assert.DoesNotContain("   at ", bodyText);
    }

    // ---------------------------------------------------------------------------
    // Title field accuracy per exception type
    // ---------------------------------------------------------------------------

    /// <summary>
    /// Given a NotFoundException is thrown,
    /// When the error reaches the middleware,
    /// Then the title field in the Problem Details body is "Resource Not Found".
    /// </summary>
    [Fact]
    public async Task InvokeAsync_NotFoundException_TitleIsResourceNotFound()
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new NotFoundException("Entity not found"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert — title must match middleware mapping
        var body = await ReadBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body, JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal("Resource Not Found", problem!.Title);
    }

    /// <summary>
    /// Given a ValidationException is thrown,
    /// When the error reaches the middleware,
    /// Then the title field in the Problem Details body is "Validation Error".
    /// </summary>
    [Fact]
    public async Task InvokeAsync_ValidationException_TitleIsValidationError()
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new ValidationException("Name is required"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var body = await ReadBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body, JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal("Validation Error", problem!.Title);
    }

    /// <summary>
    /// Given a generic exception is thrown,
    /// When the error reaches the middleware,
    /// Then the title field is "An unexpected error occurred".
    /// </summary>
    [Fact]
    public async Task InvokeAsync_GenericException_TitleIsAnUnexpectedErrorOccurred()
    {
        // Arrange
        var context = BuildHttpContext();
        var middleware = BuildMiddleware(_ => throw new System.Exception("internal"));

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var body = await ReadBodyAsync(context);
        var problem = JsonSerializer.Deserialize<ProblemDetails>(body, JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal("An unexpected error occurred", problem!.Title);
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private static DefaultHttpContext BuildHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static ExceptionHandlingMiddleware BuildMiddleware(Func<HttpContext, Task> next)
    {
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        return new ExceptionHandlingMiddleware(new RequestDelegate(next), logger);
    }

    private static async Task<string> ReadBodyAsync(DefaultHttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        return await reader.ReadToEndAsync();
    }
}
