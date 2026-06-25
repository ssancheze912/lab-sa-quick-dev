using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// Edge-case and boundary tests for ExceptionHandlingMiddleware (Story 1.3 — AC #2).
/// Expands ATDD coverage with negative paths and error scenarios not covered by ATDD tests.
/// </summary>
public class ExceptionHandlingMiddlewareEdgeCaseTests : IClassFixture<ExceptionHandlingMiddlewareEdgeCaseTests.ThrowingEdgeFactory>
{
    private readonly HttpClient _client;

    public ExceptionHandlingMiddlewareEdgeCaseTests(ThrowingEdgeFactory factory)
    {
        _client = factory.CreateClient();
    }

    // -------------------------------------------------------------------------
    // [P0] Content-Type header — must be exactly "application/problem+json"
    // -------------------------------------------------------------------------

    [Fact]
    public async Task UnhandledException_ContentTypeHeader_IsExactlyApplicationProblemJson()
    {
        // GIVEN: Backend is running with exception-handling middleware

        // WHEN: An unhandled exception is triggered
        var response = await _client.GetAsync("/throw-argument");

        // THEN: Content-Type media type is exactly "application/problem+json" (not "application/json")
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
    }

    // -------------------------------------------------------------------------
    // [P0] detail field must be null — never expose ex.Message
    // -------------------------------------------------------------------------

    [Fact]
    public async Task UnhandledException_DetailField_IsNullNotExposedMessage()
    {
        // GIVEN: An endpoint that throws with a recognizable message "SECRET_ERROR_MESSAGE"

        // WHEN: Exception propagates through the middleware
        var response = await _client.GetAsync("/throw-secret-message");

        // THEN: Response body does not contain the exception message in any property
        var rawBody = await response.Content.ReadAsStringAsync();
        rawBody.Should().NotContain("SECRET_ERROR_MESSAGE",
            because: "exception messages must never be exposed to the client per NFR6");

        // AND THEN: detail property is null or absent
        var body = JsonDocument.Parse(rawBody).RootElement;
        if (body.TryGetProperty("detail", out var detail))
        {
            detail.ValueKind.Should().Be(JsonValueKind.Null,
                because: "detail field must be null, never ex.Message");
        }
    }

    // -------------------------------------------------------------------------
    // [P0] status field in body matches HTTP 500 integer
    // -------------------------------------------------------------------------

    [Fact]
    public async Task UnhandledException_StatusBodyField_Matches500()
    {
        // GIVEN: An endpoint that throws a NullReferenceException

        // WHEN: Exception propagates
        var response = await _client.GetAsync("/throw-null-ref");

        // THEN: HTTP status code is 500
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);

        // AND THEN: The "status" field in the JSON body equals 500
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("status").GetInt32().Should().Be(500,
            because: "RFC 7807 requires status field to match the HTTP status code");
    }

    // -------------------------------------------------------------------------
    // [P0] title field exact value per implementation contract
    // -------------------------------------------------------------------------

    [Fact]
    public async Task UnhandledException_TitleField_IsExactExpectedString()
    {
        // GIVEN: An endpoint that throws any exception

        // WHEN: Exception propagates
        var response = await _client.GetAsync("/throw-argument");

        // THEN: title is exactly "An unexpected error occurred." (no trailing characters)
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("title").GetString().Should().Be("An unexpected error occurred.",
            because: "middleware contract defines this exact title string for all unhandled exceptions");
    }

    // -------------------------------------------------------------------------
    // [P1] Different exception types all return 500 — not just InvalidOperationException
    // -------------------------------------------------------------------------

    [Theory]
    [InlineData("/throw-argument")]
    [InlineData("/throw-null-ref")]
    [InlineData("/throw-generic")]
    public async Task DifferentExceptionTypes_AllReturn500WithProblemDetails(string endpoint)
    {
        // GIVEN: Various exception types are thrown by different endpoints

        // WHEN: Each endpoint is called
        var response = await _client.GetAsync(endpoint);

        // THEN: All return 500 with Problem Details (middleware handles all exception types uniformly)
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError,
            because: "middleware must catch ALL unhandled exceptions regardless of type");

        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("status").GetInt32().Should().Be(500);
        body.GetProperty("title").GetString().Should().Be("An unexpected error occurred.");
    }

    // -------------------------------------------------------------------------
    // [P1] Response body is valid JSON (parseable)
    // -------------------------------------------------------------------------

    [Fact]
    public async Task UnhandledException_ResponseBody_IsValidJson()
    {
        // GIVEN: An unhandled exception occurs

        // WHEN: Response is received
        var response = await _client.GetAsync("/throw-argument");
        var rawBody = await response.Content.ReadAsStringAsync();

        // THEN: Response body is parseable as JSON
        var act = () => JsonDocument.Parse(rawBody);
        act.Should().NotThrow(because: "Problem Details response must be valid JSON per RFC 7807");
    }

    // -------------------------------------------------------------------------
    // [P1] Stack trace must not appear anywhere in the response
    // -------------------------------------------------------------------------

    [Fact]
    public async Task UnhandledException_StackTrace_IsNotExposedInResponse()
    {
        // GIVEN: An endpoint that throws a deep exception

        // WHEN: Exception propagates through middleware
        var response = await _client.GetAsync("/throw-generic");
        var rawBody = await response.Content.ReadAsStringAsync();

        // THEN: Common stack trace markers are not present in the response body
        rawBody.Should().NotContain("   at ",
            because: "stack traces must never be exposed to the client per NFR6");
        rawBody.Should().NotContain("System.",
            because: "internal type names must not appear in client-facing error responses");
    }

    // -------------------------------------------------------------------------
    // [P2] Middleware passes through non-exception responses unchanged
    // -------------------------------------------------------------------------

    [Fact]
    public async Task RequestThatSucceeds_MiddlewareDoesNotAlterResponse()
    {
        // GIVEN: An endpoint that returns 200 OK with body "HEALTHY"

        // WHEN: Request is processed
        var response = await _client.GetAsync("/healthy-endpoint");

        // THEN: Middleware did not intercept — status is 200, body is original
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Be("HEALTHY");
    }

    // -------------------------------------------------------------------------
    // [P2] Exception on POST request also returns Problem Details
    // -------------------------------------------------------------------------

    [Fact]
    public async Task UnhandledExceptionOnPostRequest_Returns500WithProblemDetails()
    {
        // GIVEN: A POST endpoint that throws an exception

        // WHEN: POST request is made
        var response = await _client.PostAsJsonAsync("/post-throw", new { data = "test" });

        // THEN: Returns 500 Problem Details regardless of HTTP method
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("status").GetInt32().Should().Be(500);
    }

    // -------------------------------------------------------------------------
    // Inner WebApplicationFactory with multiple test endpoints
    // -------------------------------------------------------------------------

    public class ThrowingEdgeFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureTestServices(services =>
            {
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor is not null)
                    services.Remove(descriptor);

                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase("TestDb_EdgeCases"));
            });

            builder.Configure(app =>
            {
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();

                // Different exception types
                app.Map("/throw-argument", a =>
                    a.Run(_ => throw new ArgumentException("bad argument")));

                app.Map("/throw-null-ref", a =>
                    a.Run(_ => throw new NullReferenceException("null ref")));

                app.Map("/throw-generic", a =>
                    a.Run(_ => throw new Exception("generic exception")));

                // Exception with a recognisable message that must NOT appear in client response
                app.Map("/throw-secret-message", a =>
                    a.Run(_ => throw new InvalidOperationException("SECRET_ERROR_MESSAGE")));

                // POST endpoint that throws
                app.Map("/post-throw", a =>
                    a.Run(_ => throw new InvalidOperationException("POST exception")));

                // Healthy endpoint — no exception
                app.Map("/healthy-endpoint", a =>
                    a.Run(ctx =>
                    {
                        ctx.Response.StatusCode = 200;
                        return ctx.Response.WriteAsync("HEALTHY");
                    }));
            });
        }
    }
}
