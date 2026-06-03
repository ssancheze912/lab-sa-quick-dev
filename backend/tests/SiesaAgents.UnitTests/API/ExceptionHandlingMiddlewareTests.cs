using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Hosting;
using SiesaAgents.API.Middleware;
using Xunit;

namespace SiesaAgents.UnitTests.API;

public class ExceptionHandlingMiddlewareTests
{
    private static IHost BuildTestHost()
    {
        return new HostBuilder()
            .ConfigureWebHost(webBuilder =>
            {
                webBuilder.UseTestServer();
                webBuilder.Configure(app =>
                {
                    app.UseMiddleware<ExceptionHandlingMiddleware>();
                    app.Run(_ => throw new InvalidOperationException("Test exception"));
                });
            })
            .Build();
    }

    [Fact]
    public async Task UnhandledException_Returns_Status500()
    {
        // Arrange
        using var host = BuildTestHost();
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/");

        // Assert
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task UnhandledException_Returns_ProblemJsonContentType()
    {
        // Arrange
        using var host = BuildTestHost();
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/");

        // Assert
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task UnhandledException_Returns_Rfc7807Fields()
    {
        // Arrange
        using var host = BuildTestHost();
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // Assert RFC 7807 mandatory fields
        Assert.Equal(500, root.GetProperty("status").GetInt32());
        Assert.Equal("An unexpected error occurred.", root.GetProperty("title").GetString());
    }

    [Fact]
    public async Task UnhandledException_Returns_Rfc7807TypeField()
    {
        // Arrange
        using var host = BuildTestHost();
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // Assert Type field for full RFC 7807 compliance
        Assert.Equal("https://tools.ietf.org/html/rfc7807", root.GetProperty("type").GetString());
    }

    [Fact]
    public async Task UnhandledException_DoesNotExpose_StackTrace()
    {
        // Arrange
        using var host = BuildTestHost();
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/");
        var body = await response.Content.ReadAsStringAsync();

        // Assert — no stack trace in response body
        Assert.DoesNotContain("StackTrace", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("at System.", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("InvalidOperationException", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task UnhandledException_Detail_IsNull()
    {
        // Arrange
        using var host = BuildTestHost();
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // Assert — detail must be absent or null, never exposing ex.Message
        if (root.TryGetProperty("detail", out var detail))
        {
            Assert.Equal(JsonValueKind.Null, detail.ValueKind);
        }
    }
}
