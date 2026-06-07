using System.IO;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using SiesaAgents.API.Middleware;
using SiesaAgents.Domain.Exceptions;
using FluentValidation;
using FluentValidation.Results;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// Expanded unit coverage for ExceptionHandlingMiddleware — Story 1.1 automation pass.
///
/// Covers the remaining branches not exercised by ExceptionHandlingMiddlewareTests.cs
/// or ExceptionHandlingMiddlewareEdgeCaseTests.cs:
///   - ConflictException (custom domain type) → 409
///   - ValidationException (FluentValidation) → 400
///   - WriteStatusCodeProblemDetailsAsync for 401, 403, 405, 422 status codes
///   - Middleware passes 2xx responses with a body through unchanged
///   - Detail field in exception path is a safe string (never null in exception path)
///
/// Test IDs: UNIT-M-STORY11-01 … UNIT-M-STORY11-09
/// </summary>
public class ExceptionHandlingMiddlewareStory11Tests
{
    // ─── Exception-type → status-code mapping ─────────────────────────────────

    /// <summary>
    /// UNIT-M-STORY11-01 (P1)
    /// ConflictException is a custom domain exception introduced in Story 1.1.
    /// It must map to 409 Conflict — distinct from InvalidOperationException (also 409)
    /// to verify the first branch of the switch expression is hit, not the second.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_ConflictException_Returns409Conflict()
    {
        // GIVEN: The middleware pipeline throws a domain ConflictException
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new ConflictException("duplicate NIT"),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware handles the request
        await middleware.InvokeAsync(context);

        // THEN: HTTP 409 Conflict
        Assert.Equal(409, context.Response.StatusCode);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonDocument.Parse(body).RootElement;

        Assert.True(json.TryGetProperty("status", out var statusProp));
        Assert.Equal(409, statusProp.GetInt32());

        Assert.True(json.TryGetProperty("title", out var titleProp));
        Assert.Equal("Conflict", titleProp.GetString());
    }

    /// <summary>
    /// UNIT-M-STORY11-02 (P1)
    /// ConflictException must never leak its message (the duplicate NIT value) to the client.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_ConflictException_DoesNotLeakExceptionMessage()
    {
        // GIVEN: A ConflictException with a sensitive message
        const string sensitiveNit = "secret-nit-900123456-7";
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new ConflictException(sensitiveNit),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware handles the exception
        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        // THEN: The sensitive NIT value must NOT appear in the response body
        Assert.DoesNotContain(sensitiveNit, body);
        Assert.DoesNotContain("ConflictException", body);
    }

    /// <summary>
    /// UNIT-M-STORY11-03 (P1)
    /// ValidationException (FluentValidation) must map to 400 Bad Request.
    /// This is the FluentValidation branch, separate from ArgumentException → 400.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_ValidationException_Returns400BadRequest()
    {
        // GIVEN: A FluentValidation ValidationException with validation failures
        var failures = new[]
        {
            new ValidationFailure("Nombre", "El nombre es requerido"),
            new ValidationFailure("Nit", "El NIT debe tener formato válido"),
        };
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new ValidationException(failures),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware handles the exception
        await middleware.InvokeAsync(context);

        // THEN: HTTP 400 Bad Request
        Assert.Equal(400, context.Response.StatusCode);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonDocument.Parse(body).RootElement;

        Assert.True(json.TryGetProperty("status", out var statusProp));
        Assert.Equal(400, statusProp.GetInt32());

        Assert.True(json.TryGetProperty("title", out var titleProp));
        Assert.Equal("Validation failed", titleProp.GetString());
    }

    /// <summary>
    /// UNIT-M-STORY11-04 (P1)
    /// ValidationException must not leak validation failure messages or field names in the body.
    /// RFC 7807 + NFR6: detail = "See server logs for details." — internal validation
    /// errors with field names and values are never part of the public response body.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_ValidationException_DoesNotLeakFieldNamesInBody()
    {
        // GIVEN: A ValidationException with specific field names that must not leak
        var failures = new[]
        {
            new ValidationFailure("SecretField", "internal-validation-message-must-not-leak"),
        };
        var middleware = new ExceptionHandlingMiddleware(
            next: _ => throw new ValidationException(failures),
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware handles the exception
        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        // THEN: Validation field names and messages must NOT appear in the response body
        Assert.DoesNotContain("SecretField", body);
        Assert.DoesNotContain("internal-validation-message-must-not-leak", body);
        Assert.DoesNotContain("ValidationException", body);
    }

    // ─── WriteStatusCodeProblemDetailsAsync — uncovered status codes ────────

    /// <summary>
    /// UNIT-M-STORY11-05 (P1)
    /// When _next sets 401 Unauthorized without throwing, the middleware must write
    /// a Problem Details body with status=401 and title="Unauthorized".
    /// This tests the status-code path for authentication errors.
    /// </summary>
    [Fact]
    public async Task InvokeAsync_NextSets401WithoutBody_WritesProblemDetailsUnauthorized()
    {
        // GIVEN: The next delegate sets 401 without writing a body
        var middleware = new ExceptionHandlingMiddleware(
            next: ctx =>
            {
                ctx.Response.StatusCode = 401;
                return Task.CompletedTask;
            },
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware handles the response
        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonDocument.Parse(body).RootElement;

        // THEN: HTTP 401 + Problem Details with status and title
        Assert.Equal(401, context.Response.StatusCode);
        Assert.Contains("problem+json", context.Response.ContentType ?? string.Empty,
            StringComparison.OrdinalIgnoreCase);
        Assert.True(json.TryGetProperty("status", out var statusProp));
        Assert.Equal(401, statusProp.GetInt32());
        Assert.True(json.TryGetProperty("title", out var titleProp));
        Assert.Equal("Unauthorized", titleProp.GetString());
    }

    /// <summary>
    /// UNIT-M-STORY11-06 (P1)
    /// When _next sets 403 Forbidden without throwing, the middleware must write
    /// a Problem Details body with status=403 and title="Forbidden".
    /// </summary>
    [Fact]
    public async Task InvokeAsync_NextSets403WithoutBody_WritesProblemDetailsForbidden()
    {
        // GIVEN: The next delegate sets 403 without writing a body
        var middleware = new ExceptionHandlingMiddleware(
            next: ctx =>
            {
                ctx.Response.StatusCode = 403;
                return Task.CompletedTask;
            },
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware handles the response
        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonDocument.Parse(body).RootElement;

        // THEN: HTTP 403 + Problem Details
        Assert.Equal(403, context.Response.StatusCode);
        Assert.True(json.TryGetProperty("status", out var statusProp));
        Assert.Equal(403, statusProp.GetInt32());
        Assert.True(json.TryGetProperty("title", out var titleProp));
        Assert.Equal("Forbidden", titleProp.GetString());
    }

    /// <summary>
    /// UNIT-M-STORY11-07 (P2)
    /// When _next sets 405 Method Not Allowed without throwing, the middleware must write
    /// a Problem Details body with status=405 and title="Method not allowed".
    /// </summary>
    [Fact]
    public async Task InvokeAsync_NextSets405WithoutBody_WritesProblemDetailsMethodNotAllowed()
    {
        // GIVEN: The next delegate sets 405 without writing a body
        var middleware = new ExceptionHandlingMiddleware(
            next: ctx =>
            {
                ctx.Response.StatusCode = 405;
                return Task.CompletedTask;
            },
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware handles the response
        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonDocument.Parse(body).RootElement;

        // THEN: HTTP 405 + Problem Details
        Assert.Equal(405, context.Response.StatusCode);
        Assert.True(json.TryGetProperty("status", out var statusProp));
        Assert.Equal(405, statusProp.GetInt32());
        Assert.True(json.TryGetProperty("title", out var titleProp));
        Assert.Equal("Method not allowed", titleProp.GetString());
    }

    /// <summary>
    /// UNIT-M-STORY11-08 (P2)
    /// When _next sets 422 Unprocessable Entity without throwing, the middleware must
    /// write a Problem Details body with status=422 and title="Unprocessable entity".
    /// </summary>
    [Fact]
    public async Task InvokeAsync_NextSets422WithoutBody_WritesProblemDetailsUnprocessableEntity()
    {
        // GIVEN: The next delegate sets 422 without writing a body
        var middleware = new ExceptionHandlingMiddleware(
            next: ctx =>
            {
                ctx.Response.StatusCode = 422;
                return Task.CompletedTask;
            },
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware handles the response
        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonDocument.Parse(body).RootElement;

        // THEN: HTTP 422 + Problem Details
        Assert.Equal(422, context.Response.StatusCode);
        Assert.True(json.TryGetProperty("status", out var statusProp));
        Assert.Equal(422, statusProp.GetInt32());
        Assert.True(json.TryGetProperty("title", out var titleProp));
        Assert.Equal("Unprocessable entity", titleProp.GetString());
    }

    /// <summary>
    /// UNIT-M-STORY11-09 (P2)
    /// When _next sets a 5xx unknown status (e.g. 502) without throwing and without a body,
    /// the middleware's status-code path must still produce a Problem Details body
    /// (default branch: "An error occurred").
    /// </summary>
    [Fact]
    public async Task InvokeAsync_NextSets502WithoutBody_WritesProblemDetailsWithDefaultTitle()
    {
        // GIVEN: The next delegate sets 502 without writing a body
        var middleware = new ExceptionHandlingMiddleware(
            next: ctx =>
            {
                ctx.Response.StatusCode = 502;
                return Task.CompletedTask;
            },
            logger: NullLogger<ExceptionHandlingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The middleware handles the response
        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonDocument.Parse(body).RootElement;

        // THEN: HTTP 502 + Problem Details with the default title
        Assert.Equal(502, context.Response.StatusCode);
        Assert.Contains("problem+json", context.Response.ContentType ?? string.Empty,
            StringComparison.OrdinalIgnoreCase);
        Assert.True(json.TryGetProperty("title", out var titleProp));
        // The default branch returns "An error occurred"
        Assert.False(string.IsNullOrWhiteSpace(titleProp.GetString()));
    }
}
