using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;

namespace SiesaAgents.UnitTests;

public class ApiSmokeTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ApiSmokeTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Health_Endpoint_Returns_Ok()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Scalar_Page_Is_Reachable()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = true
        });

        var response = await client.GetAsync("/scalar");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Scalar", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Cors_Allows_Frontend_Origin()
    {
        var client = _factory.CreateClient();

        using var request = new HttpRequestMessage(HttpMethod.Options, "/health");
        request.Headers.Add("Origin", "http://localhost:5173");
        request.Headers.Add("Access-Control-Request-Method", "GET");

        var response = await client.SendAsync(request);

        Assert.True(response.Headers.Contains("Access-Control-Allow-Origin"));
        Assert.Contains(
            "http://localhost:5173",
            response.Headers.GetValues("Access-Control-Allow-Origin"));
    }
}
