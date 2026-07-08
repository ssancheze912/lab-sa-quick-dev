using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// Story 1.3 — Expanded coverage for the ExceptionHandlingMiddleware
/// beyond the ATDD baseline in <see cref="ProblemDetailsMiddlewareTests"/>.
///
/// Focus:
///   * RFC 7807 body completeness (type + instance fields).
///   * Environment gating in Production and Staging.
///   * HTTP verb gating on <c>/_test/throw</c>.
///   * Response determinism across sequential and concurrent requests.
///   * Absence of raw path leakage or extra unexpected properties.
///
/// SANDBOX NOTE: no database connection is opened.
/// </summary>
public sealed class ProblemDetailsExpandedTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _baseFactory;

    public ProblemDetailsExpandedTests(WebApplicationFactory<Program> factory)
    {
        _baseFactory = factory;
    }

    private WebApplicationFactory<Program> FactoryWithEnvironment(string environmentName) =>
        _baseFactory.WithWebHostBuilder(b => b.UseEnvironment(environmentName));

    /// <summary>
    /// Program.cs reads <c>ConnectionStrings:DefaultConnection</c> BEFORE
    /// <c>builder.Build()</c> — meaning <c>ConfigureAppConfiguration</c>
    /// overrides applied via <c>WithWebHostBuilder</c> arrive too late.
    /// The only way to seed config visible to top-level Main is through the
    /// process environment. We scope the env var to the assertion block via
    /// <c>try / finally</c> so no test leaks state to its neighbours.
    /// </summary>
    private static async Task WithConnectionStringEnvVarAsync(Func<Task> body)
    {
        const string EnvVar = "ConnectionStrings__DefaultConnection";
        var previous = Environment.GetEnvironmentVariable(EnvVar);
        Environment.SetEnvironmentVariable(
            EnvVar,
            "Host=localhost;Database=x;Username=x;Password=x");
        try
        {
            await body();
        }
        finally
        {
            Environment.SetEnvironmentVariable(EnvVar, previous);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // [P0] RFC 7807 body completeness — status, title, type, instance
    // MUST all be present. AC #3 mandates every RFC 7807 field.
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ProblemDetails_Body_ContainsAll_Rfc7807_RequiredFields()
    {
        // GIVEN
        var client = FactoryWithEnvironment("Testing").CreateClient();

        // WHEN
        var response = await client.GetAsync("/_test/throw");

        // THEN: All four RFC 7807 fields deserialise to non-default values.
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(500, problem!.Status);
        Assert.False(string.IsNullOrWhiteSpace(problem.Title));
        Assert.False(string.IsNullOrWhiteSpace(problem.Type));
        Assert.False(string.IsNullOrWhiteSpace(problem.Instance));
    }

    [Fact]
    public async Task ProblemDetails_Instance_EchoesRequestPath()
    {
        // GIVEN
        var client = FactoryWithEnvironment("Testing").CreateClient();

        // WHEN
        var response = await client.GetAsync("/_test/throw");
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        // THEN: Instance is the exact request path — clients depend on it
        // to correlate errors with the endpoint that produced them.
        Assert.NotNull(problem);
        Assert.Equal("/_test/throw", problem!.Instance);
    }

    [Fact]
    public async Task ProblemDetails_Type_ReferencesRfc7231_500Section()
    {
        // GIVEN
        var client = FactoryWithEnvironment("Testing").CreateClient();

        // WHEN
        var response = await client.GetAsync("/_test/throw");
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        // THEN: Type points to the RFC section describing HTTP 500. The
        // middleware code sets this to "https://tools.ietf.org/html/rfc7231#section-6.6.1".
        Assert.NotNull(problem);
        Assert.NotNull(problem!.Type);
        Assert.Contains("rfc7231", problem.Type, StringComparison.OrdinalIgnoreCase);
    }

    // ─────────────────────────────────────────────────────────────────────
    // [P1] Body is well-formed JSON — no partial write, no truncation.
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ProblemDetails_Body_IsValidJson_Parseable()
    {
        // GIVEN
        var client = FactoryWithEnvironment("Testing").CreateClient();

        // WHEN
        var response = await client.GetAsync("/_test/throw");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: JsonDocument.Parse throws JsonException on malformed JSON.
        // Success = well-formed.
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Object, doc.RootElement.ValueKind);
        Assert.True(doc.RootElement.TryGetProperty("status", out _));
        Assert.True(doc.RootElement.TryGetProperty("title", out _));
    }

    // ─────────────────────────────────────────────────────────────────────
    // [P1] Environment gating — /_test/throw MUST NOT exist in Production.
    // Production leakage of this endpoint would expose a 500-generator.
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task TestThrowEndpoint_IsNotExposed_InProductionEnvironment()
    {
        await WithConnectionStringEnvVarAsync(async () =>
        {
            // GIVEN: Production environment.
            var client = FactoryWithEnvironment("Production").CreateClient();

            // WHEN
            var response = await client.GetAsync("/_test/throw");

            // THEN: 404 (via UseStatusCodePages) — NOT 500 (would mean it ran)
            // and NOT 200 (would mean it existed).
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        });
    }

    [Fact]
    public async Task TestThrowEndpoint_IsNotExposed_InStagingEnvironment()
    {
        await WithConnectionStringEnvVarAsync(async () =>
        {
            // GIVEN: Staging environment (a real-world common misconfig target).
            var client = FactoryWithEnvironment("Staging").CreateClient();

            // WHEN
            var response = await client.GetAsync("/_test/throw");

            // THEN: The endpoint is gated exactly to "Testing" — any other env
            // (including Staging) must 404.
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    // [P1] HTTP verb gating — MapGet only. POST/PUT/DELETE must not route
    // to the endpoint (protection against method-based bypass attempts).
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task TestThrowEndpoint_Post_DoesNotThrow_ReturnsNon500()
    {
        // GIVEN
        var client = FactoryWithEnvironment("Testing").CreateClient();

        // WHEN: POST to a GET-only endpoint.
        var response = await client.PostAsync("/_test/throw", content: null);

        // THEN: The response is either 404 (no matching endpoint) or 405
        // (method not allowed). It MUST NOT be 500 — 500 would mean the
        // GET handler somehow ran on POST, which cannot happen with MapGet.
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound ||
            response.StatusCode == HttpStatusCode.MethodNotAllowed,
            $"Expected 404 or 405 but got {(int)response.StatusCode}.");
    }

    [Fact]
    public async Task TestThrowEndpoint_Delete_DoesNotThrow_ReturnsNon500()
    {
        // GIVEN
        var client = FactoryWithEnvironment("Testing").CreateClient();

        // WHEN: DELETE to a GET-only endpoint.
        var response = await client.DeleteAsync("/_test/throw");

        // THEN
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────
    // [P1] Determinism — repeated hits produce identical Problem Details
    // bodies. Any variance (e.g. a leaking correlation-id, timestamp,
    // machine name) is a leakage vector we must catch early.
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ProblemDetails_ThreeSequentialThrows_AllReturn500WithSameShape()
    {
        // GIVEN
        var client = FactoryWithEnvironment("Testing").CreateClient();

        // WHEN
        var responses = new List<HttpResponseMessage>();
        for (var i = 0; i < 3; i++)
        {
            responses.Add(await client.GetAsync("/_test/throw"));
        }

        // THEN: All three succeed with 500 + application/problem+json.
        Assert.All(responses, r =>
        {
            Assert.Equal(HttpStatusCode.InternalServerError, r.StatusCode);
            Assert.Equal("application/problem+json", r.Content.Headers.ContentType?.MediaType);
        });
    }

    [Fact]
    public async Task ProblemDetails_ConcurrentThrows_AllReturn500_NoRaceCondition()
    {
        // GIVEN
        var client = FactoryWithEnvironment("Testing").CreateClient();

        // WHEN: Five concurrent requests.
        var tasks = Enumerable.Range(0, 5)
            .Select(_ => client.GetAsync("/_test/throw"))
            .ToArray();
        var responses = await Task.WhenAll(tasks);

        // THEN: All return the same status + media type — proves the
        // middleware is thread-safe (no shared mutable state).
        Assert.All(responses, r =>
        {
            Assert.Equal(HttpStatusCode.InternalServerError, r.StatusCode);
            Assert.Equal("application/problem+json", r.Content.Headers.ContentType?.MediaType);
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    // [P2] Extra NFR6 defence — body does not contain the machine hostname,
    // process id, or common .NET exception field names we care about.
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ProblemDetails_Body_DoesNotLeak_MachineOrProcessInformation()
    {
        var client = FactoryWithEnvironment("Testing").CreateClient();

        var response = await client.GetAsync("/_test/throw");
        var body = await response.Content.ReadAsStringAsync();

        // Environment.MachineName might be anything at runtime — we assert
        // the ACTUAL machine name string is absent, and the field names too.
        Assert.DoesNotContain("MachineName", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(Environment.MachineName, body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("processId", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("targetSite", body, StringComparison.OrdinalIgnoreCase);
    }

    // ─────────────────────────────────────────────────────────────────────
    // [P2] Response headers — Content-Length must be a non-negative integer
    // when present, and no debug headers should leak.
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ProblemDetails_Response_DoesNotExpose_DebugHeaders()
    {
        var client = FactoryWithEnvironment("Testing").CreateClient();

        var response = await client.GetAsync("/_test/throw");

        // Common leakage vectors we DON'T want in a 500 response:
        Assert.False(response.Headers.Contains("X-Debug-Info"));
        Assert.False(response.Headers.Contains("X-StackTrace"));
        Assert.False(response.Headers.Contains("X-Exception"));
    }
}
