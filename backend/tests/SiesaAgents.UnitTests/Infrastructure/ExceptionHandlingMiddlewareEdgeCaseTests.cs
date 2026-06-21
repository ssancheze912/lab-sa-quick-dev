using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Edge case and boundary tests for ExceptionHandlingMiddleware (AC #3, NFR6).
/// These tests EXPAND coverage beyond the ATDD baseline in ExceptionHandlingMiddlewareTests.cs.
///
/// Edge cases:
///   - Multiple exception types all produce HTTP 500
///   - Exception message is NOT leaked in the 'detail' field
///   - 'status' field value equals 500 (not just present)
///   - 'title' field contains human-readable text (not empty)
///   - Non-exception requests return their own status (middleware is transparent)
///   - Response body is valid JSON
///   - Content-Type encoding suffix is acceptable (application/problem+json; charset=utf-8)
/// </summary>
public class ExceptionHandlingMiddlewareEdgeCaseTests
{
    // ─── Factory builder helper ───────────────────────────────────────────────

    private static WebApplicationFactory<Program> BuildFactory(
        Action<IApplicationBuilder> configure)
    {
        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.UseRouting();
                configure(app);
            });
        });
    }

    // ─── Exception type boundary: ArgumentException ───────────────────────────

    [Fact]
    public async Task WhenArgumentExceptionThrown_Returns500()
    {
        // GIVEN: An endpoint that throws ArgumentException (not generic Exception)
        // WHEN: The request is made
        // THEN: Middleware catches all Exception subtypes → still returns 500
        using var factory = BuildFactory(app =>
            app.UseEndpoints(e =>
                e.MapGet("/api/v1/test-arg-error", () =>
                {
                    throw new ArgumentException("bad argument");
                })));

        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/test-arg-error");

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task WhenInvalidOperationExceptionThrown_Returns500()
    {
        // GIVEN: An endpoint that throws InvalidOperationException
        // WHEN: The request is made
        // THEN: Middleware catches all Exception subtypes → returns 500
        using var factory = BuildFactory(app =>
            app.UseEndpoints(e =>
                e.MapGet("/api/v1/test-invalid-op", () =>
                {
                    throw new InvalidOperationException("operation not valid");
                })));

        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/test-invalid-op");

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task WhenNotImplementedExceptionThrown_Returns500()
    {
        // GIVEN: An endpoint that throws NotImplementedException
        // WHEN: The request is made
        // THEN: Middleware catches all Exception subtypes → returns 500
        using var factory = BuildFactory(app =>
            app.UseEndpoints(e =>
                e.MapGet("/api/v1/test-not-impl", () =>
                {
                    throw new NotImplementedException("not yet implemented");
                })));

        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/test-not-impl");

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    // ─── Detail field: exception message must NOT be leaked ──────────────────

    [Fact]
    public async Task WhenExceptionHasSensitiveMessage_DetailDoesNotContainMessage()
    {
        // GIVEN: An exception with a sensitive/internal message
        // WHEN: Middleware processes the exception
        // THEN: The 'detail' field in the response does NOT contain the exception message
        //       (preventing information leakage per NFR6)
        const string sensitiveMessage = "SECRET_DB_PASSWORD_IN_ERROR_MESSAGE";

        using var factory = BuildFactory(app =>
            app.UseEndpoints(e =>
                e.MapGet("/api/v1/test-sensitive", () =>
                {
                    throw new Exception(sensitiveMessage);
                })));

        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/test-sensitive");
        var body = await response.Content.ReadAsStringAsync();

        Assert.DoesNotContain(sensitiveMessage, body, StringComparison.OrdinalIgnoreCase);
    }

    // ─── Status field value: must be exactly 500 ─────────────────────────────

    [Fact]
    public async Task WhenExceptionThrown_StatusFieldValueIs500()
    {
        // GIVEN: ExceptionHandlingMiddleware processes an unhandled exception
        // WHEN: The response body is parsed
        // THEN: The 'status' field value equals integer 500 (AC #3 requires status in body)
        using var factory = BuildFactory(app =>
            app.UseEndpoints(e =>
                e.MapGet("/api/v1/test-status-value", () =>
                {
                    throw new Exception("test");
                })));

        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/test-status-value");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("status", out var statusProp));
        Assert.Equal(500, statusProp.GetInt32());
    }

    // ─── Title field: must be non-empty string ────────────────────────────────

    [Fact]
    public async Task WhenExceptionThrown_TitleFieldIsNonEmptyString()
    {
        // GIVEN: ExceptionHandlingMiddleware processes an unhandled exception
        // WHEN: The response body is parsed
        // THEN: The 'title' field is a non-empty human-readable string (RFC 7807)
        using var factory = BuildFactory(app =>
            app.UseEndpoints(e =>
                e.MapGet("/api/v1/test-title-value", () =>
                {
                    throw new Exception("test");
                })));

        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/test-title-value");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("title", out var titleProp));
        Assert.Equal(JsonValueKind.String, titleProp.ValueKind);
        Assert.False(string.IsNullOrWhiteSpace(titleProp.GetString()));
    }

    // ─── Response body is valid JSON ──────────────────────────────────────────

    [Fact]
    public async Task WhenExceptionThrown_ResponseBodyIsValidJson()
    {
        // GIVEN: ExceptionHandlingMiddleware is active
        // WHEN: An unhandled exception occurs
        // THEN: Response body can be parsed as valid JSON (not malformed output)
        using var factory = BuildFactory(app =>
            app.UseEndpoints(e =>
                e.MapGet("/api/v1/test-json-validity", () =>
                {
                    throw new Exception("test");
                })));

        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/test-json-validity");
        var body = await response.Content.ReadAsStringAsync();

        // Assert: body is non-empty
        Assert.NotEmpty(body);

        // Assert: body is parseable JSON (does not throw)
        var exception = Record.Exception(() => JsonDocument.Parse(body));
        Assert.Null(exception);
    }

    // ─── Middleware transparency: non-throwing requests pass through ──────────

    [Fact]
    public async Task WhenNoExceptionOccurs_MiddlewareDoesNotInterfere()
    {
        // GIVEN: An endpoint that succeeds (no exception)
        // WHEN: The request is made
        // THEN: Middleware is transparent — returns 200, not 500
        using var factory = BuildFactory(app =>
            app.UseEndpoints(e =>
                e.MapGet("/api/v1/test-success", () => Results.Ok(new { message = "ok" }))));

        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/test-success");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ─── Content-Type: must start with application/problem+json ─────────────

    [Fact]
    public async Task WhenExceptionThrown_ContentTypeStartsWithProblemJson()
    {
        // GIVEN: ExceptionHandlingMiddleware sets Content-Type explicitly
        // WHEN: An exception occurs
        // THEN: Content-Type header starts with 'application/problem+json'
        //       (charset suffix is acceptable: 'application/problem+json; charset=utf-8')
        using var factory = BuildFactory(app =>
            app.UseEndpoints(e =>
                e.MapGet("/api/v1/test-content-type-exact", () =>
                {
                    throw new Exception("test");
                })));

        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/test-content-type-exact");
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;

        Assert.Equal("application/problem+json", contentType);
    }

    // ─── Repeated requests produce consistent results ─────────────────────────

    [Fact]
    public async Task WhenExceptionThrown_RepeatedRequestsAllReturn500()
    {
        // GIVEN: ExceptionHandlingMiddleware is stateless
        // WHEN: The error endpoint is called 3 times consecutively
        // THEN: All responses return 500 (middleware does not fail after first call)
        using var factory = BuildFactory(app =>
            app.UseEndpoints(e =>
                e.MapGet("/api/v1/test-idempotency", () =>
                {
                    throw new Exception("test");
                })));

        var client = factory.CreateClient();

        for (int i = 0; i < 3; i++)
        {
            var response = await client.GetAsync("/api/v1/test-idempotency");
            Assert.Equal(
                HttpStatusCode.InternalServerError,
                response.StatusCode);
        }
    }
}
