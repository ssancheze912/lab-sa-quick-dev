using System.Net;
using System.Text.Json;
using SiesaAgents.IntegrationTests.Support;

namespace SiesaAgents.IntegrationTests.Middleware;

/// <summary>
/// AC #2 (Story 1.3) / TC-E1-P0-05 (test-design-epic-1.md):
/// Given an unhandled exception occurs in the backend, When the error reaches the
/// middleware, Then the response returns Problem Details RFC 7807 format
/// (status, title, detail fields, Content-Type: application/problem+json)
/// with no stack traces, exception messages, or inner exception details exposed (NFR6).
/// </summary>
public class ExceptionHandlingMiddlewareTests : IClassFixture<TestApiFactory>
{
    private readonly TestApiFactory _factory;

    public ExceptionHandlingMiddlewareTests(TestApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task UnhandledException_ReturnsProblemJsonContentType()
    {
        // GIVEN a client for the backend under test
        var client = _factory.CreateClient();

        // WHEN a request hits an endpoint that throws an unhandled exception
        var response = await client.GetAsync("/api/v1/test-error");

        // THEN the response Content-Type is application/problem+json
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task UnhandledException_Returns500StatusCode()
    {
        // GIVEN a client for the backend under test
        var client = _factory.CreateClient();

        // WHEN a request hits an endpoint that throws an unhandled exception
        var response = await client.GetAsync("/api/v1/test-error");

        // THEN the response status is 500 Internal Server Error
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task UnhandledException_BodyContainsStatusTitleDetailFields()
    {
        // GIVEN a client for the backend under test
        var client = _factory.CreateClient();

        // WHEN a request hits an endpoint that throws an unhandled exception
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        using var json = JsonDocument.Parse(body);

        // THEN the JSON body contains status, title and detail fields
        Assert.True(json.RootElement.TryGetProperty("status", out _));
        Assert.True(json.RootElement.TryGetProperty("title", out _));
        Assert.True(json.RootElement.TryGetProperty("detail", out _));
    }

    [Fact]
    public async Task UnhandledException_BodyDoesNotExposeStackTraceOrExceptionKeys()
    {
        // GIVEN a client for the backend under test
        var client = _factory.CreateClient();

        // WHEN a request hits an endpoint that throws an unhandled exception
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        using var json = JsonDocument.Parse(body);

        // THEN no stackTrace/exception/innerException keys are present in the response
        Assert.False(json.RootElement.TryGetProperty("stackTrace", out _));
        Assert.False(json.RootElement.TryGetProperty("exception", out _));
        Assert.False(json.RootElement.TryGetProperty("innerException", out _));
    }

    [Fact]
    public async Task UnhandledException_BodyDoesNotExposeRawExceptionMessage()
    {
        // GIVEN a client for the backend under test
        var client = _factory.CreateClient();

        // WHEN a request hits an endpoint that throws an unhandled exception with a known message
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();

        // THEN the raw C# exception message is never leaked into the response body
        Assert.DoesNotContain("internal test", body, StringComparison.OrdinalIgnoreCase);
    }
}
