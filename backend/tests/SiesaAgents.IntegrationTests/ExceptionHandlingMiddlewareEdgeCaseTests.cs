using System.Net;
using System.Text.Json;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Story 1.3 AC #2 — expands ATDD coverage for <c>ExceptionHandlingMiddleware</c> beyond the
/// original <c>ExceptionHandlingMiddlewareTests</c> (TC-E1-P0-05), which only asserts field
/// *presence* on the failure path. These tests cover:
///
/// 1. The negative/regression path — a request that does NOT throw must be completely
///    unaffected by the middleware (no problem+json content type, no 500 status). Without
///    this test, a bug that made the middleware fire unconditionally (e.g. on every response)
///    would not be caught by the original suite, since it only ever exercises the throwing
///    endpoint.
/// 2. Exact-value boundary assertions — the original suite checks `TryGetProperty("status", ...)`
///    returns true but never checks the value is actually 500 (a bug swapping in the wrong
///    status code, e.g. 400, would still pass the original test).
/// 3. Repeated requests remain deterministic (no shared/static state leaking between calls).
/// </summary>
public class ExceptionHandlingMiddlewareEdgeCaseTests : IClassFixture<TestWebApplicationFactory>
{
    private const string TestErrorEndpoint = "/api/v1/test-error";
    private const string NonThrowingEndpoint = "/openapi/v1.json";
    private readonly TestWebApplicationFactory _factory;

    public ExceptionHandlingMiddlewareEdgeCaseTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetNonThrowingEndpoint_DoesNotReturnProblemJsonContentType()
    {
        // GIVEN a request to an endpoint that completes without throwing
        var client = _factory.CreateClient();

        // WHEN the request is processed
        var response = await client.GetAsync(NonThrowingEndpoint);

        // THEN the middleware does not rewrite the content type to application/problem+json
        Assert.NotEqual("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task GetNonThrowingEndpoint_DoesNotReturnInternalServerError()
    {
        // GIVEN a request to an endpoint that completes without throwing
        var client = _factory.CreateClient();

        // WHEN the request is processed
        var response = await client.GetAsync(NonThrowingEndpoint);

        // THEN the middleware's catch block never activates — no forced 500
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task GetTestError_StatusFieldValueEquals500()
    {
        // GIVEN a running API host with the guarded test-error endpoint mapped
        var client = _factory.CreateClient();

        // WHEN an unhandled exception is thrown while processing the request
        var body = await GetResponseBodyAsync(client);

        // THEN the "status" field value is exactly 500 (not merely present)
        Assert.Equal(500, body.GetProperty("status").GetInt32());
    }

    [Fact]
    public async Task GetTestError_DetailFieldIsNonEmptyGenericMessage()
    {
        // GIVEN a running API host with the guarded test-error endpoint mapped
        var client = _factory.CreateClient();

        // WHEN an unhandled exception is thrown while processing the request
        var body = await GetResponseBodyAsync(client);

        // THEN "detail" is a non-empty, generic message — never blank, never the raw exception text
        var detail = body.GetProperty("detail").GetString();
        Assert.False(string.IsNullOrWhiteSpace(detail));
        Assert.DoesNotContain("test error", detail, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetTestError_CalledTwice_ReturnsConsistentResponseBothTimes()
    {
        // GIVEN a running API host with the guarded test-error endpoint mapped
        var client = _factory.CreateClient();

        // WHEN the same failing endpoint is called twice in a row
        var first = await GetResponseBodyAsync(client);
        var second = await GetResponseBodyAsync(client);

        // THEN both responses report the same status — no shared/static state corrupts a later call
        Assert.Equal(first.GetProperty("status").GetInt32(), second.GetProperty("status").GetInt32());
    }

    private static async Task<JsonElement> GetResponseBodyAsync(HttpClient client)
    {
        var response = await client.GetAsync(TestErrorEndpoint);
        var raw = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<JsonElement>(raw);
    }
}
