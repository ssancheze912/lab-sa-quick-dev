using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Text.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Middleware;

/// <summary>
/// TC-E1-P0-05: ExceptionHandlingMiddleware returns Problem Details RFC 7807 on unhandled exception.
/// Uses WebApplicationFactory to test the full middleware pipeline.
/// </summary>
public class ExceptionHandlingMiddlewareTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client = factory.CreateClient();

    /// <summary>
    /// TC-E1-P0-05: Register a test endpoint that throws, call via WebApplicationFactory,
    /// assert HTTP 500 status.
    /// </summary>
    [Fact]
    public async Task TestErrorEndpoint_ReturnsHttp500_WhenUnhandledExceptionOccurs()
    {
        // Arrange — /api/v1/test-error endpoint is registered in Development environment
        // Act
        var response = await _client.GetAsync("/api/v1/test-error");

        // Assert
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    /// <summary>
    /// TC-E1-P0-05: Assert Content-Type is application/problem+json (RFC 7807).
    /// </summary>
    [Fact]
    public async Task TestErrorEndpoint_ReturnsContentTypeProblemJson_WhenUnhandledExceptionOccurs()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/test-error");

        // Assert
        var contentType = response.Content.Headers.ContentType?.ToString() ?? string.Empty;
        Assert.Contains("application/problem+json", contentType);
    }

    /// <summary>
    /// TC-E1-P0-05: Assert response body contains "status" and "title" keys.
    /// </summary>
    [Fact]
    public async Task TestErrorEndpoint_ReturnsProblemDetailsBody_WithStatusAndTitle()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body).RootElement;

        // Assert — body contains "status" field
        Assert.True(json.TryGetProperty("status", out var statusProp));
        Assert.Equal(500, statusProp.GetInt32());

        // Assert — body contains "title" field (non-empty string)
        Assert.True(json.TryGetProperty("title", out var titleProp));
        var title = titleProp.GetString();
        Assert.NotNull(title);
        Assert.NotEmpty(title);
    }

    /// <summary>
    /// TC-E1-P0-05 (NFR6): Assert response body does NOT contain stackTrace, exception, or innerException.
    /// </summary>
    [Fact]
    public async Task TestErrorEndpoint_DoesNotExposeStackTrace_OrExceptionDetails()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body).RootElement;

        // Assert — NFR6: no stack trace, exception, or inner exception exposed
        Assert.False(json.TryGetProperty("stackTrace", out _),
            "Response must NOT contain 'stackTrace' (NFR6)");
        Assert.False(json.TryGetProperty("exception", out _),
            "Response must NOT contain 'exception' (NFR6)");
        Assert.False(json.TryGetProperty("innerException", out _),
            "Response must NOT contain 'innerException' (NFR6)");
    }

    /// <summary>
    /// TC-E1-P0-05 (NFR6): Assert "detail" field is null or absent — never exposes ex.Message.
    /// </summary>
    [Fact]
    public async Task TestErrorEndpoint_DetailFieldIsNullOrAbsent_NeverExposesExMessage()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body).RootElement;

        // Assert — if "detail" is present, it must be null (not ex.Message)
        if (json.TryGetProperty("detail", out var detailProp))
        {
            Assert.Equal(JsonValueKind.Null, detailProp.ValueKind);
        }
        // If "detail" is absent from the JSON body, that also satisfies NFR6
    }
}
