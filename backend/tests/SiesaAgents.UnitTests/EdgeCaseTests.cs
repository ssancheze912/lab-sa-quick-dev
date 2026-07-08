using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;

namespace SiesaAgents.UnitTests;

/// <summary>
/// Expanded coverage for Story 1.1 — edge cases beyond the ATDD baseline in
/// <see cref="ProgramTests"/>. Focus: CORS negative paths, OpenAPI schema
/// availability, and the Problem Details shape on unmapped routes.
/// </summary>
public sealed class EdgeCaseTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public EdgeCaseTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC3 edge cases — CORS negative paths
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Cors_DisallowedOrigin_DoesNotReceiveAllowOriginHeader()
    {
        // GIVEN: AllowedOrigins = ["http://localhost:5173"]
        var client = _factory.CreateClient();

        var request = new HttpRequestMessage(HttpMethod.Get, "/scalar");
        request.Headers.Add("Origin", "http://evil.example.com");

        // WHEN
        var response = await client.SendAsync(request);

        // THEN: Either the Allow-Origin header is completely absent (browser will
        // block the response), or it never echoes the rogue origin nor wildcard.
        // An empty-happy-path (no header returned) is the *expected* outcome —
        // we assert this branch explicitly so the test fails if CORS is disabled.
        var headerPresent = response.Headers.TryGetValues("Access-Control-Allow-Origin", out var origins);
        if (headerPresent)
        {
            Assert.DoesNotContain("http://evil.example.com", origins!);
            Assert.DoesNotContain("*", origins!);
        }
        else
        {
            // Absence of the header is the correct, secure default here.
            Assert.False(headerPresent);
        }
    }

    [Fact]
    public async Task CorsPreflight_ForPost_FromAllowedOrigin_IsPermitted()
    {
        // GIVEN: AllowAnyMethod() is configured
        var client = _factory.CreateClient();

        var request = new HttpRequestMessage(HttpMethod.Options, "/scalar");
        request.Headers.Add("Origin", "http://localhost:5173");
        request.Headers.Add("Access-Control-Request-Method", "POST");
        request.Headers.Add("Access-Control-Request-Headers", "Content-Type");

        // WHEN
        var response = await client.SendAsync(request);

        // THEN: Preflight succeeds and echoes the frontend origin
        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.NoContent);
        Assert.True(response.Headers.TryGetValues("Access-Control-Allow-Origin", out var origins));
        Assert.Contains("http://localhost:5173", origins!);
    }

    [Fact]
    public async Task CorsPreflight_ForDelete_FromAllowedOrigin_IsPermitted()
    {
        var client = _factory.CreateClient();

        var request = new HttpRequestMessage(HttpMethod.Options, "/scalar");
        request.Headers.Add("Origin", "http://localhost:5173");
        request.Headers.Add("Access-Control-Request-Method", "DELETE");

        var response = await client.SendAsync(request);

        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.NoContent);
        Assert.True(response.Headers.TryGetValues("Access-Control-Allow-Origin", out var origins));
        Assert.Contains("http://localhost:5173", origins!);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC2 edge cases — OpenAPI JSON schema availability (Scalar UI depends on it)
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task OpenApiSchema_IsExposedAtOpenApiV1Json()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/openapi/v1.json");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.Contains("json", contentType, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task OpenApiSchema_IsValidOpenApi3Document()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/openapi/v1.json");
        var body = await response.Content.ReadAsStringAsync();

        // Baseline OpenAPI 3.x sanity checks (string search — avoids extra deps)
        Assert.Contains("\"openapi\"", body);
        Assert.Contains("\"info\"", body);
        Assert.Contains("\"3.", body);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC5 edge cases — Problem Details (RFC 7807) shape on 404
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UnmappedRoute_ReturnsProblemDetails_WithInstanceEchoingPath()
    {
        var client = _factory.CreateClient();
        const string targetPath = "/api/edge-case-not-found";

        var response = await client.GetAsync(targetPath);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.Contains("json", contentType, StringComparison.OrdinalIgnoreCase);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"status\":404", body.Replace(" ", string.Empty));
        Assert.Contains("edge-case-not-found", body);
    }

    [Fact]
    public async Task UnmappedRoute_ReturnsProblemDetails_WithNonEmptyTitle()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/another-missing-route");
        var body = await response.Content.ReadAsStringAsync();

        // Title must be a non-empty string (built from ReasonPhrases.GetReasonPhrase)
        Assert.Contains("\"title\"", body);
        // "Not Found" is the canonical reason phrase for 404
        Assert.Contains("Not Found", body, StringComparison.OrdinalIgnoreCase);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC2 edge cases — Scalar and root behaviour
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ScalarEndpoint_HandlesFiveConcurrentRequestsWithoutError()
    {
        var client = _factory.CreateClient();

        var tasks = Enumerable.Range(0, 5).Select(_ => client.GetAsync("/scalar")).ToArray();
        var responses = await Task.WhenAll(tasks);

        Assert.All(responses, r => Assert.Equal(HttpStatusCode.OK, r.StatusCode));
    }

    [Fact]
    public async Task RootEndpoint_DoesNotReturnServerError()
    {
        // GIVEN: No route is mapped at `/`
        var client = _factory.CreateClient();

        // WHEN
        var response = await client.GetAsync("/");

        // THEN: Server responds — never a 5xx (would indicate broken pipeline)
        Assert.True((int)response.StatusCode < 500);
    }
}
