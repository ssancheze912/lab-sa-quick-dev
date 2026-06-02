using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Edge-case / negative-path integration tests covering Story 1.3 AC #3
/// (Problem Details RFC 7807) and AC #6 (integration coverage).
///
/// Extends the baseline ATDD suite (<see cref="ProblemDetailsTests"/>) with:
///   - Production-environment gating of the dev-only test-error endpoint (AC #3 sub-clause)
///   - UseStatusCodePages 404 path returning RFC 7807 (existing middleware contract)
///   - Determinism check: repeated calls return consistent structure
///   - Body shape: no UNEXPECTED fields beyond the RFC 7807 minimal contract
///
/// Priority: P1 — High (NFR6 hardening, regression net for production safety).
/// </summary>
[Trait("Category", "Api")]
public class ProblemDetailsEdgeCasesTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ProblemDetailsEdgeCasesTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    // -------------------------------------------------------------------------
    // [P1] Dev-only endpoint MUST NOT be mounted in Production (AC #3 gating)
    // -------------------------------------------------------------------------

    [Fact]
    public async Task TestErrorEndpoint_IsNotMounted_InProductionEnvironment()
    {
        // GIVEN: an API host configured for Production (NOT Development)
        var prodFactory = _factory.WithWebHostBuilder(b => b.UseEnvironment("Production"));
        var client = prodFactory.CreateClient();

        // WHEN: a GET request is issued to the dev-only test-error endpoint
        var response = await client.GetAsync("/api/v1/test-error");

        // THEN: the endpoint must NOT be reachable — Story 1.3 mandates gating via
        //       `if (app.Environment.IsDevelopment()) { app.MapGet(...) }`. Anything
        //       other than 200 with a thrown InvalidOperationException is fine here;
        //       the contract is "not mounted" so we expect a 404 (UseStatusCodePages
        //       converts unmatched routes to RFC 7807).
        Assert.Equal((int)HttpStatusCode.NotFound, (int)response.StatusCode);
    }

    [Fact]
    public async Task TestErrorEndpoint_IsNotMounted_InStagingEnvironment()
    {
        // GIVEN: an API host configured for Staging (a non-Development environment)
        var stagingFactory = _factory.WithWebHostBuilder(b => b.UseEnvironment("Staging"));
        var client = stagingFactory.CreateClient();

        // WHEN: a GET request is issued
        var response = await client.GetAsync("/api/v1/test-error");

        // THEN: 404 — the endpoint is dev-only.
        Assert.Equal((int)HttpStatusCode.NotFound, (int)response.StatusCode);
    }

    // -------------------------------------------------------------------------
    // [P1] UseStatusCodePages — 404 returns RFC 7807 (Program.cs middleware)
    // -------------------------------------------------------------------------

    [Fact]
    public async Task UnknownRoute_Returns404_WithApplicationProblemJsonContentType()
    {
        // GIVEN: a Development host (any environment exercises UseStatusCodePages)
        var devFactory = _factory.WithWebHostBuilder(b => b.UseEnvironment("Development"));
        var client = devFactory.CreateClient();

        // WHEN: a GET to an unmapped route
        var response = await client.GetAsync("/api/v1/this-route-does-not-exist");

        // THEN: 404 with the same Problem Details content type as 500s (consistency).
        Assert.Equal((int)HttpStatusCode.NotFound, (int)response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task UnknownRoute_BodyHasRfc7807MinimalFields()
    {
        // GIVEN: a Development host
        var devFactory = _factory.WithWebHostBuilder(b => b.UseEnvironment("Development"));
        var client = devFactory.CreateClient();

        // WHEN: a GET to an unmapped route
        var response = await client.GetAsync("/api/v1/this-route-does-not-exist");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // THEN: same minimal RFC 7807 contract as the 500 path — status, title,
        //       type, instance MUST all be present (UseStatusCodePages in Program.cs).
        Assert.Equal(404, root.GetProperty("status").GetInt32());
        Assert.False(string.IsNullOrWhiteSpace(root.GetProperty("title").GetString()));
        Assert.True(root.TryGetProperty("type", out _));
        Assert.True(root.TryGetProperty("instance", out var instance));
        Assert.Equal("/api/v1/this-route-does-not-exist", instance.GetString());
    }

    [Fact]
    public async Task UnknownRoute_BodyDoesNotLeakInternals()
    {
        // GIVEN: a Development host
        var devFactory = _factory.WithWebHostBuilder(b => b.UseEnvironment("Development"));
        var client = devFactory.CreateClient();

        // WHEN: a GET to an unmapped route
        var response = await client.GetAsync("/api/v1/this-route-does-not-exist");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: NFR6 — even 404 responses must not leak internals (no stackTrace,
        //       no Exception, no innerException). Important because UseStatusCodePages
        //       runs OUTSIDE the catch in ExceptionHandlingMiddleware.
        Assert.DoesNotContain("stackTrace", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("exception", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("innerException", body, StringComparison.OrdinalIgnoreCase);
    }

    // -------------------------------------------------------------------------
    // [P1] Determinism — repeated calls return consistent structure
    // -------------------------------------------------------------------------

    [Fact]
    public async Task TestErrorEndpoint_RepeatedCalls_ReturnDeterministicResponseShape()
    {
        // GIVEN: a Development host
        var devFactory = _factory.WithWebHostBuilder(b => b.UseEnvironment("Development"));
        var client = devFactory.CreateClient();

        // WHEN: we call the endpoint multiple times
        var first = await client.GetAsync("/api/v1/test-error");
        var second = await client.GetAsync("/api/v1/test-error");
        var third = await client.GetAsync("/api/v1/test-error");

        // THEN: every call returns the same status, content-type, and field set.
        //       Catches accidental shared state in ExceptionHandlingMiddleware (e.g.
        //       a static counter that leaks request N's data into request N+1).
        Assert.Equal(500, (int)first.StatusCode);
        Assert.Equal(500, (int)second.StatusCode);
        Assert.Equal(500, (int)third.StatusCode);

        Assert.Equal("application/problem+json", first.Content.Headers.ContentType?.MediaType);
        Assert.Equal("application/problem+json", second.Content.Headers.ContentType?.MediaType);
        Assert.Equal("application/problem+json", third.Content.Headers.ContentType?.MediaType);

        var firstBody = await first.Content.ReadAsStringAsync();
        var secondBody = await second.Content.ReadAsStringAsync();
        var thirdBody = await third.Content.ReadAsStringAsync();

        // Bodies are byte-equal because every input is identical (instance, type, status, title).
        Assert.Equal(firstBody, secondBody);
        Assert.Equal(secondBody, thirdBody);
    }

    // -------------------------------------------------------------------------
    // [P1] Body shape — no unexpected fields beyond RFC 7807 contract
    // -------------------------------------------------------------------------

    [Fact]
    public async Task TestErrorEndpoint_BodyDoesNotIncludeDetailField_PerStoryDevNotes()
    {
        // GIVEN: a Development host
        var devFactory = _factory.WithWebHostBuilder(b => b.UseEnvironment("Development"));
        var client = devFactory.CreateClient();

        // WHEN: a GET request is issued
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // THEN: per Story 1.3 Dev Notes — `Detail` is intentionally NULL/absent to
        //       prevent leaking `ex.Message`. RFC 7807 says detail is optional, so
        //       this guards against a "helpful" PR adding `Detail = ex.Message`.
        var hasDetail = root.TryGetProperty("detail", out var detailValue);
        if (hasDetail)
        {
            // If `detail` is serialized at all, it MUST be null — never carry exception text.
            Assert.Equal(JsonValueKind.Null, detailValue.ValueKind);
        }
        // (No assertion needed if detail is absent — that is the canonical shape.)
    }

    [Fact]
    public async Task TestErrorEndpoint_StatusInBody_MatchesHttpStatusCode()
    {
        // GIVEN: a Development host
        var devFactory = _factory.WithWebHostBuilder(b => b.UseEnvironment("Development"));
        var client = devFactory.CreateClient();

        // WHEN: a GET request is issued
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        // THEN: the body `status` member equals the HTTP status code — RFC 7807 §3.1
        //       requires consistency between the HTTP layer and the body status field.
        var bodyStatus = doc.RootElement.GetProperty("status").GetInt32();
        Assert.Equal((int)response.StatusCode, bodyStatus);
    }
}
