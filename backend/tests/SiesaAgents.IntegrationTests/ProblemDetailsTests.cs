using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// RED-phase API integration tests covering Story 1.3 AC #3 + AC #6 third bullet,
/// traced to test-design epic-1 TC-E1-P0-05 (Problem Details RFC 7807 / NFR6).
///
/// These tests are RED until:
///   - <c>Program</c> is exposed as <c>public partial class Program { }</c> so
///     <c>WebApplicationFactory&lt;Program&gt;</c> can boot the API host.
///   - The dev-only endpoint <c>MapGet("/api/v1/test-error", ...)</c> is mounted
///     inside <c>if (app.Environment.IsDevelopment())</c> in <c>Program.cs</c>.
///   - <c>ExceptionHandlingMiddleware</c> serializes the response with
///     <c>contentType: "application/problem+json"</c> and never leaks
///     <c>stackTrace</c> / <c>exception</c> / <c>innerException</c> / the raw
///     <c>Exception.Message</c>.
/// </summary>
[Trait("Category", "Api")]
public class ProblemDetailsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ProblemDetailsTests(WebApplicationFactory<Program> factory)
    {
        // GIVEN: a dev-environment test host so the /api/v1/test-error endpoint is mounted.
        _factory = factory.WithWebHostBuilder(b => b.UseEnvironment("Development"));
    }

    [Fact]
    public async Task TestErrorEndpoint_Returns500StatusCode()
    {
        // GIVEN: the dev-only test-error endpoint is mounted
        var client = _factory.CreateClient();

        // WHEN: a GET request is issued
        var response = await client.GetAsync("/api/v1/test-error");

        // THEN: the response status is 500 Internal Server Error (AC #3)
        Assert.Equal(500, (int)response.StatusCode);
    }

    [Fact]
    public async Task TestErrorEndpoint_ReturnsApplicationProblemJsonContentType()
    {
        // GIVEN: the dev-only test-error endpoint is mounted
        var client = _factory.CreateClient();

        // WHEN: a GET request is issued
        var response = await client.GetAsync("/api/v1/test-error");

        // THEN: Content-Type MUST be exactly "application/problem+json" (AC #3, NFR6)
        //       — NOT the default "application/json" that WriteAsJsonAsync produces.
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task TestErrorEndpoint_BodyConformsToRfc7807_HasRequiredFields()
    {
        // GIVEN: the dev-only test-error endpoint is mounted
        var client = _factory.CreateClient();

        // WHEN: a GET request is issued
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // THEN: the body MUST contain the RFC 7807 minimal field set
        //       (status, title, type, instance) per AC #3.
        Assert.Equal(500, root.GetProperty("status").GetInt32());
        Assert.False(string.IsNullOrWhiteSpace(root.GetProperty("title").GetString()),
            "Problem Details 'title' must be present and non-empty.");
        Assert.True(root.TryGetProperty("type", out _),
            "Problem Details 'type' member is required (AC #3).");
        Assert.True(root.TryGetProperty("instance", out _),
            "Problem Details 'instance' member is required (AC #3).");
    }

    [Fact]
    public async Task TestErrorEndpoint_BodyDoesNotLeakStackTrace()
    {
        // GIVEN: the dev-only test-error endpoint is mounted
        var client = _factory.CreateClient();

        // WHEN: a GET request is issued
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: NFR6 — the body MUST NOT carry "stackTrace" (case-insensitive).
        Assert.DoesNotContain("stackTrace", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task TestErrorEndpoint_BodyDoesNotLeakExceptionField()
    {
        // GIVEN: the dev-only test-error endpoint is mounted
        var client = _factory.CreateClient();

        // WHEN: a GET request is issued
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: NFR6 — the body MUST NOT carry "exception" / "innerException" (case-insensitive).
        Assert.DoesNotContain("exception", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("innerException", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task TestErrorEndpoint_BodyDoesNotLeakRawExceptionMessage()
    {
        // GIVEN: the dev-only test-error endpoint throws with a known sentinel message
        //        ("Forced failure for Problem Details smoke test." per Story Task 5).
        var client = _factory.CreateClient();

        // WHEN: a GET request is issued
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: NFR6 — the raw Exception.Message MUST NOT appear in the response body.
        Assert.DoesNotContain("Forced failure for Problem Details smoke test.", body);
    }

    [Fact]
    public async Task TestErrorEndpoint_TypeMemberIsAbsoluteHttpUri()
    {
        // GIVEN: the dev-only test-error endpoint is mounted
        var client = _factory.CreateClient();

        // WHEN: a GET request is issued
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        // THEN: the "type" member is a fully-qualified URI (RFC 7807 §3.1 / story Dev Notes
        //       — current middleware emits "https://datatracker.ietf.org/...").
        var typeValue = doc.RootElement.GetProperty("type").GetString();
        Assert.False(string.IsNullOrWhiteSpace(typeValue), "'type' must be non-empty.");
        Assert.True(Uri.TryCreate(typeValue, UriKind.Absolute, out var typeUri),
            "'type' must be an absolute URI per RFC 7807 §3.1.");
        Assert.True(typeUri!.Scheme is "http" or "https",
            "'type' URI must use http(s) scheme.");
    }

    [Fact]
    public async Task TestErrorEndpoint_InstanceMemberMatchesRequestPath()
    {
        // GIVEN: the dev-only test-error endpoint is mounted
        var client = _factory.CreateClient();

        // WHEN: a GET request is issued
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        // THEN: the "instance" member equals the request path (AC #3 + existing middleware contract).
        var instance = doc.RootElement.GetProperty("instance").GetString();
        Assert.Equal("/api/v1/test-error", instance);
    }
}
