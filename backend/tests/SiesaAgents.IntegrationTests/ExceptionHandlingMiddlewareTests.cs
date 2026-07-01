using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Integration tests for Story 1.1 Task 4 — ExceptionHandlingMiddleware.
///
/// Covers test-design cases (see _bmad-output/implementation-artifacts/test-design-epic-1.md):
///   - TC-E1-P0-05: Middleware returns RFC 7807 Problem Details on unhandled exception (R3)
///
/// Also covers edge cases:
///   - No stack-trace leakage (NFR6)
///   - Correct Content-Type (application/problem+json)
///   - Correct HTTP status (500)
///   - Instance points at the failing request path
///
/// Uses WebApplicationFactory&lt;Program&gt; with an injected test endpoint that throws.
/// </summary>
public class ExceptionHandlingMiddlewareTests : IClassFixture<TestExceptionAppFactory>
{
    private readonly HttpClient _client;

    public ExceptionHandlingMiddlewareTests(TestExceptionAppFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact(DisplayName = "[P0] Unhandled exception returns 500 Internal Server Error")]
    public async Task Throwing_Endpoint_Returns_500_Status()
    {
        // GIVEN a test endpoint that throws an unhandled exception
        // WHEN the client calls it
        var response = await _client.GetAsync("/test-error");

        // THEN status is 500 (handled by ExceptionHandlingMiddleware, not raw runtime crash)
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact(DisplayName = "[P0] Unhandled exception returns application/problem+json content type")]
    public async Task Throwing_Endpoint_Returns_ProblemJson_ContentType()
    {
        // GIVEN a test endpoint that throws
        // WHEN the client calls it
        var response = await _client.GetAsync("/test-error");

        // THEN Content-Type is RFC 7807 problem+json
        Assert.NotNull(response.Content.Headers.ContentType);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType!.MediaType);
    }

    [Fact(DisplayName = "[P0] Problem Details body contains status/title/type/instance fields")]
    public async Task Throwing_Endpoint_Returns_ProblemDetails_Body()
    {
        // GIVEN a test endpoint that throws
        var response = await _client.GetAsync("/test-error");
        var json = await response.Content.ReadAsStringAsync();

        // THEN body is valid JSON with the RFC 7807 required properties
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.Equal(JsonValueKind.Object, root.ValueKind);
        Assert.True(root.TryGetProperty("status", out var status), "Problem Details must contain 'status'");
        Assert.Equal(500, status.GetInt32());
        Assert.True(root.TryGetProperty("title", out _), "Problem Details must contain 'title'");
        Assert.True(root.TryGetProperty("type", out _), "Problem Details must contain 'type'");
        Assert.True(root.TryGetProperty("instance", out var instance), "Problem Details must contain 'instance'");
        Assert.Equal("/test-error", instance.GetString());
    }

    [Fact(DisplayName = "[P0] Problem Details body MUST NOT expose stack trace or exception internals (NFR6)")]
    public async Task Throwing_Endpoint_Does_Not_Leak_Stack_Trace()
    {
        // GIVEN a test endpoint that throws with a secret message
        var response = await _client.GetAsync("/test-error");
        var body = await response.Content.ReadAsStringAsync();

        // THEN response body must contain none of these leakage markers
        Assert.DoesNotContain("stackTrace", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("stack_trace", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("exception", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("innerException", body, StringComparison.OrdinalIgnoreCase);

        // The secret exception message must never surface to clients
        Assert.DoesNotContain("SECRET-INTERNAL-DETAIL", body);
        // .NET stack frames typically render "at SiesaAgents." — none allowed
        Assert.DoesNotContain("at SiesaAgents.", body);
    }

    [Fact(DisplayName = "[P1] Middleware handles multiple exception types (Exception, InvalidOperationException)")]
    public async Task Throwing_Endpoint_Handles_Different_Exception_Types()
    {
        // GIVEN endpoints throwing different exception types
        var responseGeneric = await _client.GetAsync("/test-error");
        var responseInvalidOp = await _client.GetAsync("/test-error-invalidop");

        // THEN both are normalized to 500 + Problem Details
        Assert.Equal(HttpStatusCode.InternalServerError, responseGeneric.StatusCode);
        Assert.Equal(HttpStatusCode.InternalServerError, responseInvalidOp.StatusCode);
        Assert.Equal("application/problem+json", responseGeneric.Content.Headers.ContentType?.MediaType);
        Assert.Equal("application/problem+json", responseInvalidOp.Content.Headers.ContentType?.MediaType);
    }
}

/// <summary>
/// [P0] CORS integration tests. Uses the real Program.cs pipeline + configured origins
/// from appsettings. Covers R1 (top-risk).
/// </summary>
public class CorsMiddlewareTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public CorsMiddlewareTests(WebApplicationFactory<Program> factory)
    {
        // Disable auto-redirect so we can assert on the actual response
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });
    }

    [Fact(DisplayName = "[P0] Preflight OPTIONS from allowed origin returns CORS headers")]
    public async Task Preflight_From_Allowed_Origin_Returns_Cors_Headers()
    {
        // GIVEN a preflight request from the whitelisted frontend origin
        var request = new HttpRequestMessage(HttpMethod.Options, "/scalar");
        request.Headers.Add("Origin", "http://localhost:5173");
        request.Headers.Add("Access-Control-Request-Method", "GET");

        // WHEN the request hits the server
        var response = await _client.SendAsync(request);

        // THEN preflight must be granted (204 or 200) with an echo of the origin
        Assert.True(
            response.StatusCode == HttpStatusCode.NoContent ||
            response.StatusCode == HttpStatusCode.OK,
            $"Expected 204 or 200 for preflight, got {(int)response.StatusCode}");

        Assert.True(response.Headers.Contains("Access-Control-Allow-Origin"),
            "Access-Control-Allow-Origin header must be present for allowed origin");

        var allowedOrigin = string.Join(",", response.Headers.GetValues("Access-Control-Allow-Origin"));
        Assert.Equal("http://localhost:5173", allowedOrigin);
    }

    [Fact(DisplayName = "[P0] Preflight from disallowed origin does NOT emit Access-Control-Allow-Origin for that origin")]
    public async Task Preflight_From_Disallowed_Origin_Does_Not_Emit_Cors()
    {
        // GIVEN a preflight from an attacker origin
        var request = new HttpRequestMessage(HttpMethod.Options, "/scalar");
        request.Headers.Add("Origin", "http://evil.example.com");
        request.Headers.Add("Access-Control-Request-Method", "GET");

        // WHEN the request hits the server
        var response = await _client.SendAsync(request);

        // THEN the disallowed origin must NOT be echoed back (and no wildcard)
        if (response.Headers.TryGetValues("Access-Control-Allow-Origin", out var values))
        {
            var joined = string.Join(",", values);
            Assert.NotEqual("http://evil.example.com", joined);
            Assert.NotEqual("*", joined);
        }
    }

    [Fact(DisplayName = "[P1] GET / redirects to /scalar per Program.cs wiring")]
    public async Task Root_Redirects_To_Scalar()
    {
        // GIVEN Program.cs registers app.MapGet("/", () => Results.Redirect("/scalar"))
        var response = await _client.GetAsync("/");

        // THEN 3xx redirect to /scalar
        Assert.True(
            (int)response.StatusCode >= 300 && (int)response.StatusCode < 400,
            $"Expected 3xx redirect from /, got {(int)response.StatusCode}");
        Assert.NotNull(response.Headers.Location);
        Assert.Contains("/scalar", response.Headers.Location!.ToString());
    }

    [Fact(DisplayName = "[P1] Scalar page loads at /scalar with 200 or redirect + HTML")]
    public async Task Scalar_Page_Loads()
    {
        // GIVEN Program.cs registers app.MapScalarApiReference()
        var response = await _client.GetAsync("/scalar");

        // Scalar may redirect /scalar → /scalar/ — accept either
        Assert.True(
            (int)response.StatusCode == 200 || ((int)response.StatusCode >= 300 && (int)response.StatusCode < 400),
            $"Expected 200 or 3xx from /scalar, got {(int)response.StatusCode}");
    }

    [Fact(DisplayName = "[P2] Swagger endpoint MUST NOT be exposed (Scalar-only mandate)")]
    public async Task Swagger_Endpoint_Is_Not_Exposed()
    {
        // GIVEN corporate standard: no Swashbuckle, no /swagger
        var response = await _client.GetAsync("/swagger");

        // THEN /swagger must not return 200
        Assert.NotEqual(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact(DisplayName = "[P2] WeatherForecast default template endpoint MUST be removed")]
    public async Task WeatherForecast_Endpoint_Removed()
    {
        // GIVEN the default webapi template's WeatherForecast is required to be removed
        var response = await _client.GetAsync("/weatherforecast");

        // THEN endpoint does not respond as if it exists
        Assert.NotEqual(HttpStatusCode.OK, response.StatusCode);
    }
}

/// <summary>
/// Custom WebApplicationFactory that enables the SIESA_TEST_ENDPOINTS gate in Program.cs.
/// The test endpoints (/test-error, /test-error-invalidop) are compiled into Program.cs
/// but only registered when the environment variable is set — keeps the pipeline
/// (and its ExceptionHandlingMiddleware ordering) 100% identical to production.
///
/// The factory captures the previous value of SIESA_TEST_ENDPOINTS before mutating the
/// process env and restores it on Dispose so it does NOT leak across test classes
/// (which would break tests such as <c>AppDbContextStartupNegativeTests</c>).
/// </summary>
public class TestExceptionAppFactory : WebApplicationFactory<Program>
{
    private const string EnvVarName = "SIESA_TEST_ENDPOINTS";
    private string? _previousEnvValue;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        // Program.cs reads this env var to register the throwing test endpoints.
        _previousEnvValue = Environment.GetEnvironmentVariable(EnvVarName);
        Environment.SetEnvironmentVariable(EnvVarName, "1");
    }

    protected override void Dispose(bool disposing)
    {
        try
        {
            // Restore whatever value (or absence) was set before this factory ran.
            Environment.SetEnvironmentVariable(EnvVarName, _previousEnvValue);
        }
        finally
        {
            base.Dispose(disposing);
        }
    }
}
