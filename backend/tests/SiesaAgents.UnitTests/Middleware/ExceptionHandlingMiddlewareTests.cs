using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Hosting;
using SiesaAgents.API.Middleware;

namespace SiesaAgents.UnitTests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    private static IHost BuildHostWithThrowingEndpoint()
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
    public async Task Middleware_ReturnsProblemDetailsContentType_OnUnhandledException()
    {
        // Arrange
        using var host = BuildHostWithThrowingEndpoint();
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/throw");

        // Assert
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Middleware_Returns500StatusCode_OnUnhandledException()
    {
        // Arrange
        using var host = BuildHostWithThrowingEndpoint();
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/throw");

        // Assert
        Assert.Equal(500, (int)response.StatusCode);
    }

    [Fact]
    public async Task Middleware_ResponseBodyContainsStatusField_OnUnhandledException()
    {
        // Arrange
        using var host = BuildHostWithThrowingEndpoint();
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/throw");
        var body = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Contains("\"status\"", body);
    }

    [Fact]
    public async Task Middleware_ResponseBodyContainsTitleField_OnUnhandledException()
    {
        // Arrange
        using var host = BuildHostWithThrowingEndpoint();
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/throw");
        var body = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Contains("\"title\"", body);
    }

    [Fact]
    public async Task Middleware_ResponseBodyContainsDetailField_OnUnhandledException()
    {
        // Arrange
        using var host = BuildHostWithThrowingEndpoint();
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/throw");
        var body = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Contains("\"detail\"", body);
    }

    [Fact]
    public async Task Middleware_ResponseBodyDoesNotContainStackTrace_OnUnhandledException()
    {
        // Arrange
        using var host = BuildHostWithThrowingEndpoint();
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/throw");
        var body = await response.Content.ReadAsStringAsync();

        // Assert — no stack trace exposed (NFR6)
        Assert.DoesNotContain("stackTrace", body);
        Assert.DoesNotContain("StackTrace", body);
        Assert.DoesNotContain("InvalidOperationException", body);
    }

    [Fact]
    public async Task Middleware_ResponseBodyHasCorrectProblemDetailsValues()
    {
        // Arrange
        using var host = BuildHostWithThrowingEndpoint();
        await host.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("/throw");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // Assert
        Assert.Equal(500, root.GetProperty("status").GetInt32());
        Assert.Equal("Internal Server Error", root.GetProperty("title").GetString());
        Assert.Equal("An unexpected error occurred.", root.GetProperty("detail").GetString());
    }
}
