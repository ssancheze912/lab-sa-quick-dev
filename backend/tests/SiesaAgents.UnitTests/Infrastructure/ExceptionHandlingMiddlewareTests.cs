using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Integration tests for ExceptionHandlingMiddleware (AC #3).
/// TC-E1-P0-05: ExceptionHandlingMiddleware returns Problem Details RFC 7807.
/// </summary>
public class ExceptionHandlingMiddlewareTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ExceptionHandlingMiddlewareTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                // No additional services needed for this test
            });

            builder.Configure(app =>
            {
                // Re-register the middleware explicitly for the test endpoint
                app.UseMiddleware<SiesaAgents.API.Middleware.ExceptionHandlingMiddleware>();
                app.UseRouting();
                app.UseEndpoints(endpoints =>
                {
                    endpoints.MapGet("/api/v1/test-error", () =>
                    {
                        throw new Exception("internal test");
                    });
                });
            });
        });
    }

    [Fact]
    public async Task WhenUnhandledExceptionOccurs_Returns500WithProblemDetails()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/test-error");

        // Assert — HTTP 500
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);

        // Assert — Content-Type is application/problem+json
        var contentType = response.Content.Headers.ContentType?.MediaType;
        Assert.Equal("application/problem+json", contentType);

        // Assert — body contains required fields
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("status", out _), "Response body must contain 'status' field.");
        Assert.True(root.TryGetProperty("title", out _), "Response body must contain 'title' field.");

        // Assert — body does NOT expose internal details
        Assert.False(root.TryGetProperty("stackTrace", out _), "Response body must NOT contain 'stackTrace' field.");
        Assert.False(root.TryGetProperty("exception", out _), "Response body must NOT contain 'exception' field.");
        Assert.False(root.TryGetProperty("innerException", out _), "Response body must NOT contain 'innerException' field.");
    }

    [Fact]
    public async Task WhenUnhandledExceptionOccurs_DetailFieldIsNullOrAbsent()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/test-error");

        // Assert
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // detail should be absent OR null (not exposing exception message to client)
        // If 'detail' is present, it must be null — never a string with exception message.
        // Using deterministic assertion: both outcomes (absent or null) are valid per AC #3.
        if (root.TryGetProperty("detail", out var detailProp))
        {
            // GIVEN: 'detail' key is present in response body
            // WHEN: Its value is inspected
            // THEN: It must be null (never the exception message)
            Assert.True(
                detailProp.ValueKind == JsonValueKind.Null || detailProp.ValueKind == JsonValueKind.Undefined,
                $"'detail' field must be null but was: {detailProp.ValueKind} = {detailProp}");
        }
        // If 'detail' is absent entirely, that is also acceptable per RFC 7807 (field is optional).
    }
}
