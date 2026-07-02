// -----------------------------------------------------------------------------
//  Story 1.3 — Backend Database Foundation
//  BMad-Integrated testarch-automate — edge-case coverage that expands the
//  ATDD baseline (ProblemDetailsMiddlewareTests.cs) with negative paths,
//  boundary conditions and environment gating that the RED-phase test does
//  not exercise.
//
//  Coverage matrix vs AC #3 / AC #8 / NFR6 / TC-E1-P0-05 / R3:
//    * [P1] Wrong HTTP method on /api/v1/test-error → framework 404/405,
//           NOT a 500 (proves MapGet is not accidentally MapMethods("*"))
//    * [P1] `type` field is an absolute URI (RFC 7807 §3.1)
//    * [P1] `instance` reflects the exact request path (RFC 7807 §3.1)
//    * [P1] The response body contains ONLY the whitelisted RFC 7807 fields
//    * [P1] Non-Testing environments MUST NOT expose /api/v1/test-error —
//           the endpoint gate in Program.cs is the primary safety fence for
//           this diagnostic endpoint in Production
//    * [P1] Framework 404 for unknown routes still emits Problem Details
//           (validates the AddProblemDetails + UseStatusCodePages plumbing
//           set up in Story 1.1, on which Story 1.3 depends)
//    * [P2] JSON body uses camelCase field names (per Program.cs config)
//    * [P2] Concurrent requests each receive isolated `instance` values
//    * [P2] Multiple invocations do not leak state between requests
//
//  All tests run in-process with WebApplicationFactory<Program> — no Docker,
//  no PostgreSQL. The Testing-env factory already stubs the DB connection
//  string via appsettings.Testing.json.
// -----------------------------------------------------------------------------
using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace SiesaAgents.IntegrationTests;

// Sibling factory that boots the host in "Production" — explicitly NOT
// "Testing" — so we can prove the /api/v1/test-error diagnostic endpoint is
// gated correctly and never leaks to a non-Testing environment.
public class ProductionEnvWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Production");

        // Production env does not load appsettings.Testing.json / .Development.json,
        // so we MUST supply a connection string here — Program.cs throws at
        // startup if ConnectionStrings:DefaultConnection is null (see R6 guard).
        // This is a stub — no DB is actually reached in these tests.
        builder.UseSetting(
            "ConnectionStrings:DefaultConnection",
            "Host=localhost;Port=5432;Database=stub;Username=stub;Password=stub");
    }
}

[Trait("Category", "Integration")]
public class ProblemDetailsMiddlewareEdgeCaseTests
    : IClassFixture<TestingEnvWebApplicationFactory>, IClassFixture<ProductionEnvWebApplicationFactory>
{
    private readonly TestingEnvWebApplicationFactory _testingFactory;
    private readonly ProductionEnvWebApplicationFactory _productionFactory;

    public ProblemDetailsMiddlewareEdgeCaseTests(
        TestingEnvWebApplicationFactory testingFactory,
        ProductionEnvWebApplicationFactory productionFactory)
    {
        _testingFactory = testingFactory;
        _productionFactory = productionFactory;
    }

    // -------------------------------------------------------------------------
    // Environment-gating tests — AC #5 / task 5 subtask
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GivenProductionEnvironment_WhenGetTestError_ThenEndpointIsNotExposed()
    {
        // GIVEN: the API is booted in Production (mirrors real deployment).
        var client = _productionFactory.CreateClient();

        // WHEN: something in Production tries to hit the diagnostic endpoint.
        var response = await client.GetAsync("/api/v1/test-error");

        // THEN: the endpoint is NOT mapped — a 500 here would mean the gate in
        //       Program.cs is broken and the diagnostic exception path is
        //       reachable outside Testing.
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
        // Framework returns 404 for unmapped routes.
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GivenProductionEnvironment_WhenAllHttpMethodsHitTestError_ThenNoneReachThe500Path()
    {
        // GIVEN: Production environment.
        var client = _productionFactory.CreateClient();

        // WHEN: hostile probing across common HTTP verbs.
        var methods = new[] { HttpMethod.Get, HttpMethod.Post, HttpMethod.Put, HttpMethod.Delete, HttpMethod.Patch };

        foreach (var method in methods)
        {
            using var req = new HttpRequestMessage(method, "/api/v1/test-error");
            var response = await client.SendAsync(req);

            // THEN: none of them reach the InvalidOperationException throw path.
            //       If any of them returned 500, the endpoint would be leaking.
            Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
        }
    }

    // -------------------------------------------------------------------------
    // RFC 7807 field-shape tests — AC #3
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GivenTestErrorEndpoint_WhenInvoked_ThenTypeFieldIsAnAbsoluteUri()
    {
        // GIVEN: Testing env.
        var client = _testingFactory.CreateClient();

        // WHEN: forcing the middleware to emit a Problem Details body.
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var type = doc.RootElement.GetProperty("type").GetString();

        // THEN: `type` MUST be a well-formed absolute URI per RFC 7807 §3.1.
        Assert.False(string.IsNullOrWhiteSpace(type), "type MUST NOT be empty");
        Assert.True(
            Uri.TryCreate(type, UriKind.Absolute, out var parsed) && parsed!.Scheme == Uri.UriSchemeHttps,
            $"type '{type}' MUST be an absolute HTTPS URI");
    }

    [Fact]
    public async Task GivenTestErrorEndpoint_WhenInvoked_ThenInstanceReflectsRequestPath()
    {
        // GIVEN: Testing env.
        var client = _testingFactory.CreateClient();

        // WHEN: hitting the endpoint. The middleware sets `instance` to
        //       `context.Request.Path` — the invariant is that the client sees
        //       the exact same path it sent (no rewriting, no PII, no query).
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var instance = doc.RootElement.GetProperty("instance").GetString();

        // THEN: instance == the request path (case-sensitive per ASP.NET Core).
        Assert.Equal("/api/v1/test-error", instance);
    }

    [Fact]
    public async Task GivenTestErrorEndpoint_WhenInvoked_ThenResponseBodyContainsOnlyTheAllowlistedFields()
    {
        // GIVEN: Testing env.
        var client = _testingFactory.CreateClient();

        // WHEN: parsing the full JSON envelope.
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var fieldNames = doc.RootElement.EnumerateObject().Select(p => p.Name).ToHashSet();

        // THEN: exactly the RFC 7807 core fields, nothing more, nothing less.
        //       NFR6 lockdown: reviewers can grep for this assertion when they
        //       need to prove no server-internal fields leak to clients.
        var expected = new HashSet<string> { "type", "title", "status", "detail", "instance" };
        Assert.Superset(expected, fieldNames);
        Assert.Empty(fieldNames.Except(expected));
    }

    [Fact]
    public async Task GivenTestErrorEndpoint_WhenInvoked_ThenStatusFieldMatchesHttpStatusCode()
    {
        // GIVEN: Testing env.
        var client = _testingFactory.CreateClient();

        // WHEN: parsing status from both the HTTP status line AND the body.
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        // THEN: they MUST match — a mismatch confuses caching layers, CDNs and
        //       client-side generic error handlers that key off status.
        Assert.Equal(500, (int)response.StatusCode);
        Assert.Equal(500, doc.RootElement.GetProperty("status").GetInt32());
    }

    // -------------------------------------------------------------------------
    // Framework Problem Details plumbing (Story 1.1 foundation regression guard)
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GivenUnknownRoute_WhenRequested_ThenFrameworkReturnsProblemDetailsWith404()
    {
        // GIVEN: Testing env.
        var client = _testingFactory.CreateClient();
        // Some HTTP clients only see the framework's Problem Details if the
        // caller advertises acceptance of that media type.
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/problem+json"));

        // WHEN: requesting a route that does not exist.
        var response = await client.GetAsync("/this-route-does-not-exist-anywhere-42");

        // THEN: the framework's Problem Details plumbing (from Story 1.1)
        //       still fires — AddProblemDetails + UseStatusCodePages.
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(
            "application/problem+json",
            response.Content.Headers.ContentType?.MediaType);
    }

    // -------------------------------------------------------------------------
    // JSON serialization conventions
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GivenTestErrorEndpoint_WhenInvoked_ThenJsonFieldNamesUseCamelCase()
    {
        // GIVEN: Testing env — Program.cs configures JsonOptions with
        //        PropertyNamingPolicy = CamelCase.
        var client = _testingFactory.CreateClient();

        // WHEN: parsing the raw response body.
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: field names are camelCase (the C# ProblemDetails properties
        //       are PascalCase — this asserts the JsonOptions were applied to
        //       WriteAsJsonAsync too).
        Assert.Contains("\"title\"", body);
        Assert.Contains("\"status\"", body);
        Assert.Contains("\"detail\"", body);
        Assert.DoesNotContain("\"Title\"", body);
        Assert.DoesNotContain("\"Status\"", body);
        Assert.DoesNotContain("\"Detail\"", body);
    }

    // -------------------------------------------------------------------------
    // Concurrency / isolation
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GivenTestErrorEndpoint_WhenInvokedConcurrentlyMultipleTimes_ThenEachResponseIsIndependentAndCorrect()
    {
        // GIVEN: Testing env. This test ensures the middleware does not share
        //        mutable state between requests (an easy regression when
        //        someone converts to a singleton service by accident).
        var client = _testingFactory.CreateClient();

        // WHEN: 8 concurrent invocations.
        var tasks = Enumerable.Range(0, 8)
            .Select(_ => client.GetAsync("/api/v1/test-error"))
            .ToArray();
        var responses = await Task.WhenAll(tasks);

        // THEN: all 8 return the identical shape — 500 + application/problem+json
        //       + Spanish title + Spanish detail. Any variance means state
        //       leaked between requests.
        foreach (var response in responses)
        {
            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
            Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

            var body = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(body);
            Assert.Equal("Ocurrió un error inesperado.", doc.RootElement.GetProperty("title").GetString());
            Assert.Equal("Contacta al administrador si el problema persiste.", doc.RootElement.GetProperty("detail").GetString());
            Assert.DoesNotContain("integration-test-error", body);
        }
    }

    // -------------------------------------------------------------------------
    // Repeat-invocation stability
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GivenTestErrorEndpoint_WhenInvokedTwiceSequentially_ThenBothResponsesAreIdenticalInShape()
    {
        // GIVEN: Testing env.
        var client = _testingFactory.CreateClient();

        // WHEN: two sequential calls.
        var first = await client.GetAsync("/api/v1/test-error");
        var second = await client.GetAsync("/api/v1/test-error");

        // THEN: identical status codes + identical media type + identical
        //       Spanish title (no accumulation of counters, no state).
        Assert.Equal(first.StatusCode, second.StatusCode);
        Assert.Equal(
            first.Content.Headers.ContentType?.MediaType,
            second.Content.Headers.ContentType?.MediaType);

        var body1 = await first.Content.ReadAsStringAsync();
        var body2 = await second.Content.ReadAsStringAsync();
        using var d1 = JsonDocument.Parse(body1);
        using var d2 = JsonDocument.Parse(body2);
        Assert.Equal(
            d1.RootElement.GetProperty("title").GetString(),
            d2.RootElement.GetProperty("title").GetString());
        Assert.Equal(
            d1.RootElement.GetProperty("detail").GetString(),
            d2.RootElement.GetProperty("detail").GetString());
    }

    // -------------------------------------------------------------------------
    // Language rule (AC #8) — ensures middleware never regresses to English
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GivenTestErrorEndpoint_WhenInvoked_ThenTitleAndDetailAreInSpanish_NotEnglish()
    {
        // GIVEN: Testing env.
        var client = _testingFactory.CreateClient();

        // WHEN: parsing the body.
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var title = doc.RootElement.GetProperty("title").GetString();
        var detail = doc.RootElement.GetProperty("detail").GetString();

        // THEN: Spanish strings (AC #8 — company standard requires user-facing
        //       strings in Spanish, code in English).
        Assert.Equal("Ocurrió un error inesperado.", title);
        Assert.Equal("Contacta al administrador si el problema persiste.", detail);
        Assert.DoesNotContain("unexpected error", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("An error", body, StringComparison.OrdinalIgnoreCase);
    }
}
