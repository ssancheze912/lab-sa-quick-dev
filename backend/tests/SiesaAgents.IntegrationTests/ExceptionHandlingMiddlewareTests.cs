namespace SiesaAgents.IntegrationTests;

/// <summary>
/// AC #3 / TC-E1-P0-05 — Problem Details (RFC 7807) without information leakage.
///
/// Verifies the unhandled-exception path returns a sanitized 500 response.
/// NFR6: no stackTrace, exception, innerException, or raw ex.Message in the body.
///
/// EXPECTED RED-PHASE FAILURE REASONS (until Story 1.3 is implemented):
///   1. /api/v1/test-error endpoint is NOT yet registered in Program.cs (Task 5).
///      → response is 404, not 500.
///   2. Program class is not exposed as `public partial class Program;` so
///      WebApplicationFactory&lt;Program&gt; cannot resolve it → compile error.
/// </summary>
public class ExceptionHandlingMiddlewareTests
{
    /// <summary>
    /// GIVEN the API is running in Development and the throw-test endpoint exists,
    /// WHEN GET /api/v1/test-error is called,
    /// THEN the response is HTTP 500 with Content-Type application/problem+json.
    /// </summary>
    [Fact]
    public async Task TestError_Returns500_WithProblemJsonContentType()
    {
        // GIVEN
        await using var factory = new SiesaAgentsWebApplicationFactory();
        var client = factory.CreateClient();

        // WHEN
        var response = await client.GetAsync("/api/v1/test-error");

        // THEN
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    /// <summary>
    /// GIVEN an unhandled exception is thrown by the API,
    /// WHEN the middleware writes the response body,
    /// THEN the JSON contains RFC 7807 mandatory fields: status, title, type, instance.
    /// </summary>
    [Fact]
    public async Task TestError_Body_ContainsRfc7807MandatoryFields()
    {
        // GIVEN
        await using var factory = new SiesaAgentsWebApplicationFactory();
        var client = factory.CreateClient();

        // WHEN
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        using var json = JsonDocument.Parse(body);
        var root = json.RootElement;

        // THEN — RFC 7807 §3.1 members
        Assert.True(root.TryGetProperty("status", out _), "RFC 7807 'status' missing");
        Assert.True(root.TryGetProperty("title", out _), "RFC 7807 'title' missing");
        Assert.True(root.TryGetProperty("type", out _), "RFC 7807 'type' missing");
        Assert.True(root.TryGetProperty("instance", out _), "RFC 7807 'instance' missing");
    }

    /// <summary>
    /// GIVEN an unhandled exception with message "internal test",
    /// WHEN the middleware writes the response body,
    /// THEN the body does NOT contain stackTrace, exception, innerException,
    ///      nor the raw ex.Message string (NFR6 — no information leakage).
    /// </summary>
    [Fact]
    public async Task TestError_Body_DoesNotLeakStackTraceOrExceptionDetails()
    {
        // GIVEN
        await using var factory = new SiesaAgentsWebApplicationFactory();
        var client = factory.CreateClient();

        // WHEN
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();

        // THEN
        Assert.DoesNotContain("stackTrace", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("\"exception\"", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("innerException", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("internal test", body);
    }
}
