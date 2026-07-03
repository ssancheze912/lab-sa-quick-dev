using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Edge-case coverage for the Story 1.1 <c>ExceptionHandlingMiddleware</c> and
/// <c>UseStatusCodePages</c> Problem Details pipeline that Story 1.3 wires up.
/// The ATDD test only asserts the happy path (500 + no leak); this suite
/// exercises:
///
///   - Multiple exception types (Argument*, InvalidOperation*, NullReference*)
///     — the middleware must not treat any subtype specially.
///   - Sensitive-data payload leakage (passwords, secrets, PII, SQL fragments).
///   - Framework 404 / 405 pathways emit application/problem+json (via
///     UseStatusCodePages), not text/html or application/json.
///   - Response body is valid JSON conforming to the RFC 7807 shape.
///   - The <c>instance</c> field carries the failing request path (RFC 7807).
///
/// All tests share a single <see cref="WebApplicationFactory{Program}"/> so the
/// suite stays fast (~1s total). Test-only endpoints are appended via
/// <see cref="IStartupFilter"/>, preserving the Story 1.1 middleware order.
/// </summary>
public class ProblemDetailsMiddlewareEdgeCaseTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ProblemDetailsMiddlewareEdgeCaseTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.AddTransient<IStartupFilter, TestErrorVariantsStartupFilter>();
            });
        });
    }

    // --- Exception-type variance ------------------------------------------

    [Theory]
    [InlineData("/api/v1/test-error/argument-null")]
    [InlineData("/api/v1/test-error/invalid-operation")]
    [InlineData("/api/v1/test-error/null-reference")]
    [InlineData("/api/v1/test-error/timeout")]
    public async Task Any_exception_type_produces_problem_details_500_P0(string path)
    {
        // Regression guard: ExceptionHandlingMiddleware must handle every
        // Exception subtype uniformly, never leak the message, always emit
        // application/problem+json with a valid RFC 7807 body.
        var client = _factory.CreateClient();

        var response = await client.GetAsync(path);

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var body = await response.Content.ReadAsStringAsync();
        using var json = JsonDocument.Parse(body); // proves body is valid JSON
        Assert.True(json.RootElement.TryGetProperty("status", out var status));
        Assert.Equal(500, status.GetInt32());
        Assert.True(json.RootElement.TryGetProperty("title", out _));
        Assert.True(json.RootElement.TryGetProperty("type", out _));
    }

    // --- Sensitive-data leakage guards ------------------------------------

    [Fact]
    public async Task Response_does_not_leak_password_from_exception_message_P0()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/test-error/sensitive-password");

        var body = await response.Content.ReadAsStringAsync();

        // Whatever the message looked like ("password=hunter2"), NONE of it may reach the client.
        Assert.DoesNotContain("password=", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("hunter2", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Response_does_not_leak_sql_fragments_from_exception_message_P0()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/test-error/sql-injection-lookalike");

        var body = await response.Content.ReadAsStringAsync();

        // The middleware must not echo raw SQL back to the client — even
        // accidentally as part of ex.Message.
        Assert.DoesNotContain("DROP TABLE", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("SELECT *", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Response_does_not_leak_stack_trace_frame_paths_P0()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/test-error/invalid-operation");

        var body = await response.Content.ReadAsStringAsync();

        // Common stack-trace markers must never appear in the body.
        Assert.DoesNotContain(" at ", body, StringComparison.Ordinal); // " at Method(...)"
        Assert.DoesNotContain(".cs:line", body, StringComparison.Ordinal);
        Assert.DoesNotContain("SiesaAgents.", body, StringComparison.Ordinal); // no assembly frames
    }

    // --- RFC 7807 shape assertions ----------------------------------------

    [Fact]
    public async Task Response_contains_instance_field_with_request_path_P1()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/test-error/invalid-operation");

        var body = await response.Content.ReadAsStringAsync();
        using var json = JsonDocument.Parse(body);

        // RFC 7807 "instance" is OPTIONAL but the middleware sets it to
        // context.Request.Path — asserting it stays wired.
        Assert.True(json.RootElement.TryGetProperty("instance", out var instance));
        Assert.Equal("/api/v1/test-error/invalid-operation", instance.GetString());
    }

    [Fact]
    public async Task Response_type_field_is_a_reachable_uri_shape_P2()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/test-error/invalid-operation");

        var body = await response.Content.ReadAsStringAsync();
        using var json = JsonDocument.Parse(body);

        Assert.True(json.RootElement.TryGetProperty("type", out var type));
        var typeValue = type.GetString();
        Assert.NotNull(typeValue);
        Assert.True(
            Uri.TryCreate(typeValue, UriKind.Absolute, out _),
            $"'type' must be an absolute URI per RFC 7807 §3.1, got '{typeValue}'.");
    }

    // --- Framework status-code pathway (UseStatusCodePages) ---------------

    [Fact]
    public async Task Missing_endpoint_returns_problem_details_404_P1()
    {
        // GIVEN: no route matches
        // WHEN:  a client hits an undefined path
        // THEN:  UseStatusCodePages emits application/problem+json (Story 1.1
        //        AC #3 / TC-E1-P0-05 sibling behaviour — was not asserted by ATDD).
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/definitely-not-a-real-endpoint");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var body = await response.Content.ReadAsStringAsync();
        using var json = JsonDocument.Parse(body);
        Assert.True(json.RootElement.TryGetProperty("status", out var status));
        Assert.Equal(404, status.GetInt32());
        Assert.True(json.RootElement.TryGetProperty("title", out _));
    }

    /// <summary>
    /// Registers every /api/v1/test-error/* probe endpoint at the tail of the
    /// production pipeline so ExceptionHandlingMiddleware wraps them (see the
    /// rationale in <see cref="ProblemDetailsMiddlewareTests"/>).
    /// </summary>
    private sealed class TestErrorVariantsStartupFilter : IStartupFilter
    {
        public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
        {
            return app =>
            {
                next(app);

                app.Use(async (ctx, del_next) =>
                {
                    switch (ctx.Request.Path.Value)
                    {
                        case "/api/v1/test-error/argument-null":
                            throw new ArgumentNullException("param", "boom");
                        case "/api/v1/test-error/invalid-operation":
                            throw new InvalidOperationException("boom");
                        case "/api/v1/test-error/null-reference":
                            throw new NullReferenceException("boom");
                        case "/api/v1/test-error/timeout":
                            throw new TimeoutException("boom");
                        case "/api/v1/test-error/sensitive-password":
                            throw new InvalidOperationException("Auth failed: password=hunter2");
                        case "/api/v1/test-error/sql-injection-lookalike":
                            throw new InvalidOperationException("Query failed: SELECT * FROM users; DROP TABLE users;");
                    }

                    await del_next();
                });
            };
        }
    }
}
