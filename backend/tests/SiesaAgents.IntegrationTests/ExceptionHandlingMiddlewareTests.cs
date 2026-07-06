using System.Net;
using System.Text.Json;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// TC-E1-P0-05 — Story 1.3 AC #2.
///
/// Given an unhandled exception occurs anywhere in the backend request pipeline,
/// when the error reaches ExceptionHandlingMiddleware, then the response must be
/// Content-Type: application/problem+json with a body containing status/title/detail,
/// and must NOT expose any stack trace, exception message, or inner exception (NFR6).
///
/// RED phase: fails today because GET /api/v1/test-error does not exist yet (404) —
/// the guarded endpoint and AppDbContext wiring are added by Story 1.3 Tasks 2-6.
/// </summary>
public class ExceptionHandlingMiddlewareTests : IClassFixture<TestWebApplicationFactory>
{
    private const string TestErrorEndpoint = "/api/v1/test-error";
    private readonly TestWebApplicationFactory _factory;

    public ExceptionHandlingMiddlewareTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetTestError_ReturnsProblemJsonContentType()
    {
        // GIVEN a running API host with the guarded test-error endpoint mapped
        var client = _factory.CreateClient();

        // WHEN an unhandled exception is thrown while processing the request
        var response = await client.GetAsync(TestErrorEndpoint);

        // THEN the response Content-Type is application/problem+json
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task GetTestError_ReturnsInternalServerErrorStatus()
    {
        // GIVEN a running API host with the guarded test-error endpoint mapped
        var client = _factory.CreateClient();

        // WHEN an unhandled exception is thrown while processing the request
        var response = await client.GetAsync(TestErrorEndpoint);

        // THEN the response status is 500 Internal Server Error
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task GetTestError_BodyContainsStatusField()
    {
        // GIVEN a running API host with the guarded test-error endpoint mapped
        var client = _factory.CreateClient();

        // WHEN an unhandled exception is thrown while processing the request
        var body = await GetResponseBodyAsync(client);

        // THEN the Problem Details body contains a "status" field
        Assert.True(body.TryGetProperty("status", out _));
    }

    [Fact]
    public async Task GetTestError_BodyContainsTitleField()
    {
        // GIVEN a running API host with the guarded test-error endpoint mapped
        var client = _factory.CreateClient();

        // WHEN an unhandled exception is thrown while processing the request
        var body = await GetResponseBodyAsync(client);

        // THEN the Problem Details body contains a "title" field
        Assert.True(body.TryGetProperty("title", out _));
    }

    [Fact]
    public async Task GetTestError_BodyContainsDetailField()
    {
        // GIVEN a running API host with the guarded test-error endpoint mapped
        var client = _factory.CreateClient();

        // WHEN an unhandled exception is thrown while processing the request
        var body = await GetResponseBodyAsync(client);

        // THEN the Problem Details body contains a "detail" field
        Assert.True(body.TryGetProperty("detail", out _));
    }

    [Fact]
    public async Task GetTestError_BodyDoesNotContainStackTraceKey()
    {
        // GIVEN a running API host with the guarded test-error endpoint mapped
        var client = _factory.CreateClient();

        // WHEN an unhandled exception is thrown while processing the request
        var raw = await GetRawResponseBodyAsync(client);

        // THEN no "stackTrace" key is exposed (NFR6)
        Assert.DoesNotContain("stackTrace", raw, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetTestError_BodyDoesNotContainExceptionKey()
    {
        // GIVEN a running API host with the guarded test-error endpoint mapped
        var client = _factory.CreateClient();

        // WHEN an unhandled exception is thrown while processing the request
        var raw = await GetRawResponseBodyAsync(client);

        // THEN no "exception" key is exposed (NFR6)
        Assert.DoesNotContain("\"exception\"", raw, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetTestError_BodyDoesNotContainRawExceptionMessage()
    {
        // GIVEN a running API host with the guarded test-error endpoint mapped
        var client = _factory.CreateClient();

        // WHEN an unhandled exception with message "test error" is thrown
        var raw = await GetRawResponseBodyAsync(client);

        // THEN the raw exception message is not leaked to the client (NFR6)
        Assert.DoesNotContain("test error", raw, StringComparison.OrdinalIgnoreCase);
    }

    private static async Task<string> GetRawResponseBodyAsync(HttpClient client)
    {
        var response = await client.GetAsync(TestErrorEndpoint);
        return await response.Content.ReadAsStringAsync();
    }

    private static async Task<JsonElement> GetResponseBodyAsync(HttpClient client)
    {
        var raw = await GetRawResponseBodyAsync(client);
        return JsonSerializer.Deserialize<JsonElement>(raw);
    }
}
