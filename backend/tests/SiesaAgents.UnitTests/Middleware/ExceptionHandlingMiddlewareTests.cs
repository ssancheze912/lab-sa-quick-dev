// Story 1.3: Backend Database Foundation
// Epic 1: Project Foundation & Application Shell
//
// ATDD Unit Tests — RED Phase (Unit Level)
// These tests are intentionally FAILING until ExceptionHandlingMiddleware is implemented.
//
// Acceptance Criteria covered:
//   AC5 — ExceptionHandlingMiddleware returns Problem Details RFC 7807
//         with no stack traces exposed (NFR6), and HTTP status code reflects exception type.
//
// Pattern: Arrange / Act / Assert (xUnit)
// Ref: Story tasks require direct middleware pipeline invocation — no integration container needed.

using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// Unit tests for ExceptionHandlingMiddleware.
/// All tests are in RED phase — they will fail until the middleware is implemented.
/// </summary>
public class ExceptionHandlingMiddlewareTests
{
    // ────────────────────────────────────────────────────────────────────────────
    // Helper: Build a minimal HttpContext with a writable response body
    // ────────────────────────────────────────────────────────────────────────────

    private static DefaultHttpContext CreateHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static async Task<(int StatusCode, string ContentType, JsonDocument? Body)> InvokeAndReadResponse(
        ExceptionHandlingMiddleware middleware,
        HttpContext context)
    {
        await middleware.InvokeAsync(context);
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var bodyText = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var contentType = context.Response.ContentType ?? string.Empty;
        JsonDocument? doc = null;
        if (!string.IsNullOrWhiteSpace(bodyText))
        {
            try { doc = JsonDocument.Parse(bodyText); } catch { /* non-JSON body */ }
        }
        return (context.Response.StatusCode, contentType, doc);
    }

    // ────────────────────────────────────────────────────────────────────────────
    // AC5 — ArgumentException → HTTP 400 Problem Details
    // ────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: A downstream middleware throws ArgumentException
    /// WHEN:  ExceptionHandlingMiddleware handles the exception
    /// THEN:  Response status is 400 Bad Request
    /// </summary>
    [Fact]
    public async Task ArgumentException_Returns_400_BadRequest()
    {
        // Arrange
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new ArgumentException("Invalid argument value");
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        var middleware = new ExceptionHandlingMiddleware(next, logger);

        // Act
        var (statusCode, _, _) = await InvokeAndReadResponse(middleware, context);

        // Assert
        Assert.Equal(StatusCodes.Status400BadRequest, statusCode);
    }

    /// <summary>
    /// GIVEN: A downstream middleware throws ArgumentException
    /// WHEN:  ExceptionHandlingMiddleware handles the exception
    /// THEN:  Response Content-Type is application/problem+json
    /// </summary>
    [Fact]
    public async Task ArgumentException_Returns_ProblemJson_ContentType()
    {
        // Arrange
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new ArgumentException("Bad input");
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        var middleware = new ExceptionHandlingMiddleware(next, logger);

        // Act
        var (_, contentType, _) = await InvokeAndReadResponse(middleware, context);

        // Assert
        Assert.Contains("application/problem+json", contentType);
    }

    /// <summary>
    /// GIVEN: A downstream middleware throws ArgumentException
    /// WHEN:  ExceptionHandlingMiddleware handles the exception
    /// THEN:  Response body contains RFC 7807 fields: status, title, detail
    /// </summary>
    [Fact]
    public async Task ArgumentException_Returns_Rfc7807_ProblemDetails_Body()
    {
        // Arrange
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new ArgumentException("Bad input");
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        var middleware = new ExceptionHandlingMiddleware(next, logger);

        // Act
        var (_, _, body) = await InvokeAndReadResponse(middleware, context);

        // Assert — RFC 7807 mandatory fields must exist
        Assert.NotNull(body);
        Assert.True(body!.RootElement.TryGetProperty("status", out _), "Missing 'status' field (RFC 7807)");
        Assert.True(body.RootElement.TryGetProperty("title", out _), "Missing 'title' field (RFC 7807)");
    }

    // ────────────────────────────────────────────────────────────────────────────
    // AC5 — KeyNotFoundException → HTTP 404 Not Found
    // ────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: A downstream middleware throws KeyNotFoundException
    /// WHEN:  ExceptionHandlingMiddleware handles the exception
    /// THEN:  Response status is 404 Not Found
    /// </summary>
    [Fact]
    public async Task KeyNotFoundException_Returns_404_NotFound()
    {
        // Arrange
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new KeyNotFoundException("Resource not found");
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        var middleware = new ExceptionHandlingMiddleware(next, logger);

        // Act
        var (statusCode, _, _) = await InvokeAndReadResponse(middleware, context);

        // Assert
        Assert.Equal(StatusCodes.Status404NotFound, statusCode);
    }

    /// <summary>
    /// GIVEN: A downstream middleware throws KeyNotFoundException
    /// WHEN:  ExceptionHandlingMiddleware handles the exception
    /// THEN:  Response body contains status=404 in the Problem Details
    /// </summary>
    [Fact]
    public async Task KeyNotFoundException_Returns_ProblemDetails_With_Status_404()
    {
        // Arrange
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new KeyNotFoundException("Entity missing");
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        var middleware = new ExceptionHandlingMiddleware(next, logger);

        // Act
        var (_, _, body) = await InvokeAndReadResponse(middleware, context);

        // Assert — Problem Details status field matches HTTP 404
        Assert.NotNull(body);
        Assert.True(body!.RootElement.TryGetProperty("status", out var statusProp));
        Assert.Equal(404, statusProp.GetInt32());
    }

    // ────────────────────────────────────────────────────────────────────────────
    // AC5 — InvalidOperationException → HTTP 400
    // ────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: A downstream middleware throws InvalidOperationException
    /// WHEN:  ExceptionHandlingMiddleware handles the exception
    /// THEN:  Response status is 400 Bad Request
    /// </summary>
    [Fact]
    public async Task InvalidOperationException_Returns_400_BadRequest()
    {
        // Arrange
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new InvalidOperationException("Domain rule violated");
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        var middleware = new ExceptionHandlingMiddleware(next, logger);

        // Act
        var (statusCode, _, _) = await InvokeAndReadResponse(middleware, context);

        // Assert
        Assert.Equal(StatusCodes.Status400BadRequest, statusCode);
    }

    // ────────────────────────────────────────────────────────────────────────────
    // AC5 — Generic Exception → HTTP 500 Internal Server Error
    // ────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: A downstream middleware throws a generic Exception
    /// WHEN:  ExceptionHandlingMiddleware handles the exception
    /// THEN:  Response status is 500 Internal Server Error
    /// </summary>
    [Fact]
    public async Task GenericException_Returns_500_InternalServerError()
    {
        // Arrange
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new Exception("Unexpected system failure");
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        var middleware = new ExceptionHandlingMiddleware(next, logger);

        // Act
        var (statusCode, _, _) = await InvokeAndReadResponse(middleware, context);

        // Assert
        Assert.Equal(StatusCodes.Status500InternalServerError, statusCode);
    }

    /// <summary>
    /// GIVEN: A downstream middleware throws a generic Exception
    /// WHEN:  ExceptionHandlingMiddleware handles the exception
    /// THEN:  Response body contains status=500 in Problem Details
    /// </summary>
    [Fact]
    public async Task GenericException_Returns_ProblemDetails_With_Status_500()
    {
        // Arrange
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new Exception("Something went wrong");
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        var middleware = new ExceptionHandlingMiddleware(next, logger);

        // Act
        var (_, _, body) = await InvokeAndReadResponse(middleware, context);

        // Assert
        Assert.NotNull(body);
        Assert.True(body!.RootElement.TryGetProperty("status", out var statusProp));
        Assert.Equal(500, statusProp.GetInt32());
    }

    // ────────────────────────────────────────────────────────────────────────────
    // AC5 — NFR6: NO stack traces in response body
    // ────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: A downstream middleware throws any exception
    /// WHEN:  ExceptionHandlingMiddleware handles the exception (NFR6)
    /// THEN:  Response body does NOT contain "StackTrace" or ".NET at System." dumps
    /// </summary>
    [Fact]
    public async Task ExceptionResponse_DoesNot_Contain_StackTrace()
    {
        // Arrange
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new Exception("Sensitive internal error details");
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        var middleware = new ExceptionHandlingMiddleware(next, logger);

        // Act
        await middleware.InvokeAsync(context);
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var bodyText = await new StreamReader(context.Response.Body).ReadToEndAsync();

        // Assert — NFR6: No stack trace exposure
        Assert.DoesNotContain("StackTrace", bodyText, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("at System.", bodyText);
        Assert.DoesNotContain("at Microsoft.", bodyText);
    }

    /// <summary>
    /// GIVEN: A downstream middleware throws KeyNotFoundException
    /// WHEN:  ExceptionHandlingMiddleware handles the exception (NFR6)
    /// THEN:  Response body does NOT expose internal stack trace for 404 errors
    /// </summary>
    [Fact]
    public async Task KeyNotFoundException_DoesNot_Expose_StackTrace()
    {
        // Arrange
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new KeyNotFoundException("Record id=42 not found");
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        var middleware = new ExceptionHandlingMiddleware(next, logger);

        // Act
        await middleware.InvokeAsync(context);
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var bodyText = await new StreamReader(context.Response.Body).ReadToEndAsync();

        // Assert — NFR6 compliance
        Assert.DoesNotContain("StackTrace", bodyText, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("at System.", bodyText);
    }

    // ────────────────────────────────────────────────────────────────────────────
    // AC5 — Happy path: no exception → middleware passes through
    // ────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: No exception is thrown by downstream middleware
    /// WHEN:  ExceptionHandlingMiddleware processes the request
    /// THEN:  Response is not modified — status remains 200 (pass-through)
    /// </summary>
    [Fact]
    public async Task NoException_PassesThrough_Without_Modification()
    {
        // Arrange
        var context = CreateHttpContext();
        context.Response.StatusCode = StatusCodes.Status200OK;
        RequestDelegate next = httpContext =>
        {
            httpContext.Response.StatusCode = StatusCodes.Status200OK;
            return Task.CompletedTask;
        };
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        var middleware = new ExceptionHandlingMiddleware(next, logger);

        // Act
        await middleware.InvokeAsync(context);

        // Assert — No exception → no Problem Details, status unchanged
        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
    }

    // ────────────────────────────────────────────────────────────────────────────
    // AC5 — Problem Details detail field contains exception message (not stack)
    // ────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: A downstream middleware throws ArgumentException with message
    /// WHEN:  ExceptionHandlingMiddleware handles the exception
    /// THEN:  Response body 'detail' field contains exception message (not stack trace)
    /// </summary>
    [Fact]
    public async Task ArgumentException_Detail_Contains_ExceptionMessage_NotStackTrace()
    {
        // Arrange
        const string exceptionMessage = "Valor de parametro invalido: nombre";
        var context = CreateHttpContext();
        RequestDelegate next = _ => throw new ArgumentException(exceptionMessage);
        var logger = NullLogger<ExceptionHandlingMiddleware>.Instance;
        var middleware = new ExceptionHandlingMiddleware(next, logger);

        // Act
        var (_, _, body) = await InvokeAndReadResponse(middleware, context);

        // Assert — detail field should be present and contain message, not stack trace
        Assert.NotNull(body);
        Assert.True(body!.RootElement.TryGetProperty("detail", out var detail));
        var detailValue = detail.GetString() ?? string.Empty;
        Assert.Contains(exceptionMessage, detailValue);
        Assert.DoesNotContain("at SiesaAgents.", detailValue);
    }
}
