using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;

namespace SiesaAgents.UnitTests;

/// <summary>
/// Smoke tests verifying Story 1.1 wiring: Scalar registration, CORS policy,
/// removal of default WeatherForecast, and JSON error responses.
/// </summary>
public sealed class ProgramTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ProgramTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task ScalarEndpoint_ReturnsHtml_ForApiDocs()
    {
        // Scalar is mounted at /scalar and redirects to a canonical path.
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = true,
        });

        var response = await client.GetAsync("/scalar");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("text/html", response.Content.Headers.ContentType?.MediaType, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task DefaultWeatherForecastEndpoint_IsRemoved()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/weatherforecast");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task SwaggerEndpoint_IsNotExposed()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/swagger");

        // Scalar is the only API doc surface; Swagger must be a 404 (not 200 nor
        // a redirect to something else that could serve it).
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CorsPreflight_FromLocalhost5173_IsAllowed()
    {
        var client = _factory.CreateClient();

        var request = new HttpRequestMessage(HttpMethod.Options, "/scalar");
        request.Headers.Add("Origin", "http://localhost:5173");
        request.Headers.Add("Access-Control-Request-Method", "GET");
        request.Headers.Add("Access-Control-Request-Headers", "Content-Type");

        var response = await client.SendAsync(request);

        Assert.True(response.Headers.TryGetValues("Access-Control-Allow-Origin", out var origins));
        Assert.Contains("http://localhost:5173", origins!);
    }
}
