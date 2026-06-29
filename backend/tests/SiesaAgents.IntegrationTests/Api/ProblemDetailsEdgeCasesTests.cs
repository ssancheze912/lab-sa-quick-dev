using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Hosting;

namespace SiesaAgents.IntegrationTests.Api;

/// <summary>
/// Edge cases on top of the ATDD <c>ProblemDetailsTests</c>:
/// - The Development-only <c>/api/v1/test-error</c> endpoint MUST NOT be available outside Development.
/// - Problem Details Instance MUST equal the request path that triggered the exception.
/// - Wrong HTTP method on the endpoint still surfaces a recognizable response (405 or 500 — never a stack trace).
/// </summary>
public class ProblemDetailsEdgeCasesTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ProblemDetailsEdgeCasesTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task TestErrorEndpoint_InNonDevelopmentEnvironment_Returns404()
    {
        // GIVEN: the API hosted with ASPNETCORE_ENVIRONMENT=Production (no test-error endpoint registered).
        using var prodFactory = _factory.WithWebHostBuilder(b => b.UseEnvironment(Environments.Production));
        var client = prodFactory.CreateClient();

        // WHEN: a request hits the Development-only path.
        var response = await client.GetAsync("/api/v1/test-error");

        // THEN: it must be 404 — the endpoint is guarded by IsDevelopment().
        response.StatusCode.Should().Be(HttpStatusCode.NotFound,
            "the test-error endpoint must only be registered in Development");
    }

    [Fact]
    public async Task TestErrorEndpoint_InStagingEnvironment_Returns404()
    {
        // GIVEN: a Staging-like environment (anything not "Development").
        using var stagingFactory = _factory.WithWebHostBuilder(b => b.UseEnvironment("Staging"));
        var client = stagingFactory.CreateClient();

        // WHEN: requested.
        var response = await client.GetAsync("/api/v1/test-error");

        // THEN: 404. The middleware is unrelated — endpoint is simply not mapped.
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task TestErrorEndpoint_ProblemDetailsInstance_EqualsRequestPath()
    {
        // GIVEN: the API in Development.
        using var devFactory = _factory.WithWebHostBuilder(b => b.UseEnvironment(Environments.Development));
        var client = devFactory.CreateClient();

        // WHEN: the test endpoint is hit.
        var response = await client.GetAsync("/api/v1/test-error");
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        // THEN: Instance carries the exact request path (used by clients to correlate).
        problem!.Instance.Should().Be("/api/v1/test-error",
            "Instance must reflect the request path that triggered the exception");
    }

    [Fact]
    public async Task TestErrorEndpoint_ProblemDetailsType_IsRfc7231SectionLink()
    {
        // GIVEN: Dev env.
        using var devFactory = _factory.WithWebHostBuilder(b => b.UseEnvironment(Environments.Development));
        var client = devFactory.CreateClient();

        // WHEN.
        var response = await client.GetAsync("/api/v1/test-error");
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        // THEN: the Type field links to the RFC section per ExceptionHandlingMiddleware.
        problem!.Type.Should().Be("https://tools.ietf.org/html/rfc7231#section-6.6.1");
    }

    [Fact]
    public async Task TestErrorEndpoint_WrongHttpMethod_NeverLeaksStackTrace()
    {
        // GIVEN: Dev env where the endpoint is registered as GET.
        using var devFactory = _factory.WithWebHostBuilder(b => b.UseEnvironment(Environments.Development));
        var client = devFactory.CreateClient();

        // WHEN: a POST is sent to the GET-only endpoint.
        var response = await client.PostAsJsonAsync("/api/v1/test-error", new { });
        var body = await response.Content.ReadAsStringAsync();

        // THEN: regardless of the exact status code (405 / 404 / 500), no stack trace leaks.
        response.StatusCode.Should().BeOneOf(HttpStatusCode.MethodNotAllowed, HttpStatusCode.NotFound, HttpStatusCode.InternalServerError);
        body.Should().NotContain("StackTrace");
        body.Should().NotContain("stackTrace");
        body.Should().NotContain("at SiesaAgents.", "no internal namespace/frames may leak");
    }

    [Fact]
    public async Task UnknownEndpoint_Returns404_AndDoesNotInvokeExceptionHandlingMiddleware()
    {
        // GIVEN: Dev env.
        using var devFactory = _factory.WithWebHostBuilder(b => b.UseEnvironment(Environments.Development));
        var client = devFactory.CreateClient();

        // WHEN: requesting an unknown path.
        var response = await client.GetAsync("/api/v1/does-not-exist-anywhere");

        // THEN: 404 from routing (not from the exception middleware) — content-type is not application/problem+json.
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var mediaType = response.Content.Headers.ContentType?.MediaType;
        // ASP.NET Core may not set a content-type on a 404; if set, it must not be the problem+json one.
        if (mediaType is not null)
        {
            mediaType.Should().NotBe("application/problem+json",
                "routing-level 404 must not be reshaped by the exception middleware");
        }
    }
}
