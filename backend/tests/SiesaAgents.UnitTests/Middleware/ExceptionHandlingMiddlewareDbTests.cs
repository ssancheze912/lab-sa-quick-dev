using Microsoft.AspNetCore.Http;
using Npgsql;
using SiesaAgents.API.Middleware;
using System.Text.Json;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// ATDD unit tests for ExceptionHandlingMiddleware — Story 1.3: Backend Database Foundation.
///
/// RED phase: All tests fail until ExceptionHandlingMiddleware is updated to catch
/// NpgsqlException and return HTTP 503 with Problem Details in
/// backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs.
///
/// AC coverage:
///   AC #3 — NpgsqlException returns HTTP 503 with Problem Details RFC 7807 format
///   AC #3 — No stack trace or ex.Message exposed in the response body (NFR6)
/// </summary>
public class ExceptionHandlingMiddlewareDbTests
{
    // ──────────────────────────────────────────────────────────────────────────
    // AC #3 — NpgsqlException returns HTTP 503 with Problem Details
    // GIVEN: An unhandled NpgsqlException occurs in the backend (DB connection failure)
    // WHEN:  The error reaches the ExceptionHandlingMiddleware
    // THEN:  The response returns HTTP 503 with Problem Details RFC 7807 format
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNpgsqlExceptionThrown_Returns503()
    {
        // GIVEN: A NpgsqlException simulating a database connection failure
        RequestDelegate next = (_) =>
            throw new NpgsqlException("Connection to database refused");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The exception reaches the middleware
        await middleware.InvokeAsync(context);

        // THEN: Response status code is 503 (not 500)
        Assert.Equal(503, context.Response.StatusCode);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC #3 — NpgsqlException returns Problem Details content type
    // GIVEN: A NpgsqlException occurs in the backend
    // WHEN:  The error reaches the ExceptionHandlingMiddleware
    // THEN:  Content-Type is application/problem+json (RFC 7807)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNpgsqlExceptionThrown_ContentTypeIsApplicationProblemJson()
    {
        // GIVEN: A NpgsqlException simulating a database connection failure
        RequestDelegate next = (_) =>
            throw new NpgsqlException("Database unavailable");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The exception reaches the middleware
        await middleware.InvokeAsync(context);

        // THEN: Content-Type is application/problem+json
        Assert.StartsWith("application/problem+json", context.Response.ContentType);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC #3 — NpgsqlException Problem Details has title "Database unavailable"
    // GIVEN: A NpgsqlException occurs in the backend
    // WHEN:  The error reaches the ExceptionHandlingMiddleware
    // THEN:  The Problem Details body contains title: "Database unavailable."
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNpgsqlExceptionThrown_ProblemDetailsTitleIsDatabaseUnavailable()
    {
        // GIVEN: A NpgsqlException simulating a database connection failure
        RequestDelegate next = (_) =>
            throw new NpgsqlException("Host not found");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The exception reaches the middleware
        await middleware.InvokeAsync(context);

        // THEN: Problem Details title is "Database unavailable."
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var problemDetails = JsonSerializer.Deserialize<JsonElement>(body);

        Assert.Equal("Database unavailable.", problemDetails.GetProperty("title").GetString());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC #3 / NFR6 — NpgsqlException detail is null (never expose DB error message)
    // GIVEN: A NpgsqlException occurs with a sensitive connection error message
    // WHEN:  The error reaches the ExceptionHandlingMiddleware
    // THEN:  The Problem Details detail field is null — no connection string details exposed
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNpgsqlExceptionThrown_DetailIsNull()
    {
        // GIVEN: A NpgsqlException with a sensitive message (connection string, credentials)
        RequestDelegate next = (_) =>
            throw new NpgsqlException("Host=localhost;Database=siesa_agents_db;Password=secret");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The exception reaches the middleware
        await middleware.InvokeAsync(context);

        // THEN: detail field is null in the Problem Details response
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var problemDetails = JsonSerializer.Deserialize<JsonElement>(body);

        // If "detail" key is present, it must be null
        if (problemDetails.TryGetProperty("detail", out var detailElement))
        {
            Assert.Equal(JsonValueKind.Null, detailElement.ValueKind);
        }
        // Absence of "detail" key is also acceptable per RFC 7807
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC #3 / NFR6 — NpgsqlException message never appears in response body
    // GIVEN: A NpgsqlException with a sensitive connection error message
    // WHEN:  The error reaches the ExceptionHandlingMiddleware
    // THEN:  The raw exception message is NOT present anywhere in the response body
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNpgsqlExceptionThrown_ExceptionMessageNotExposedInBody()
    {
        // GIVEN: A NpgsqlException with a sensitive message
        const string sensitiveMessage = "Authentication failed for user 'postgres' at 10.0.0.1:5432";
        RequestDelegate next = (_) =>
            throw new NpgsqlException(sensitiveMessage);

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The exception reaches the middleware
        await middleware.InvokeAsync(context);

        // THEN: The sensitive message is NOT in the response body (NFR6 compliance)
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.DoesNotContain(sensitiveMessage, body);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC #3 — NpgsqlException status field in Problem Details body is 503
    // GIVEN: A NpgsqlException occurs in the backend
    // WHEN:  The error reaches the ExceptionHandlingMiddleware
    // THEN:  The Problem Details body status field is 503
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNpgsqlExceptionThrown_ProblemDetailsStatusIs503()
    {
        // GIVEN: A NpgsqlException simulating a database connection failure
        RequestDelegate next = (_) =>
            throw new NpgsqlException("Connection refused");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The exception reaches the middleware
        await middleware.InvokeAsync(context);

        // THEN: Problem Details body status field is 503
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var problemDetails = JsonSerializer.Deserialize<JsonElement>(body);

        Assert.Equal(503, problemDetails.GetProperty("status").GetInt32());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC #3 — Generic Exception (non-DB) still returns HTTP 500 (not 503)
    // GIVEN: A generic non-database exception occurs in the backend
    // WHEN:  The error reaches the ExceptionHandlingMiddleware
    // THEN:  The response returns HTTP 500 (NpgsqlException does NOT override generic handler)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenGenericExceptionThrown_Returns500NotAffectedByNpgsqlHandler()
    {
        // GIVEN: A generic unhandled exception (not a database error)
        RequestDelegate next = (_) =>
            throw new InvalidOperationException("Non-database error");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The exception reaches the middleware
        await middleware.InvokeAsync(context);

        // THEN: Still returns 500 (generic handler is not impacted by NpgsqlException handler)
        Assert.Equal(500, context.Response.StatusCode);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC #3 — NpgsqlException Problem Details response body is valid JSON
    // GIVEN: A NpgsqlException occurs in the backend
    // WHEN:  The error reaches the ExceptionHandlingMiddleware
    // THEN:  The response body is valid parseable JSON
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenNpgsqlExceptionThrown_ResponseBodyIsValidJson()
    {
        // GIVEN: A NpgsqlException simulating a database connection failure
        RequestDelegate next = (_) =>
            throw new NpgsqlException("JSON validation check");

        var middleware = new ExceptionHandlingMiddleware(next);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // WHEN: The exception reaches the middleware
        await middleware.InvokeAsync(context);

        // THEN: Response body is valid JSON
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        var parseException = Record.Exception(() => JsonDocument.Parse(body));
        Assert.Null(parseException);
    }
}
