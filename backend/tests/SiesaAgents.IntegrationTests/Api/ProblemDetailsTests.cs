using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Hosting;

namespace SiesaAgents.IntegrationTests.Api;

/// <summary>
/// Integration tests for AC #2 (Problem Details RFC 7807) — TC-E1-P0-05.
/// RED phase: these tests fail until the Development-only /api/v1/test-error endpoint
/// is registered in Program.cs and the AppDbContext / Infrastructure DI are wired
/// (Program is partial so WebApplicationFactory can boot it).
/// </summary>
public class ProblemDetailsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ProblemDetailsTests(WebApplicationFactory<Program> factory)
    {
        // GIVEN: the API is hosted in-process with ASPNETCORE_ENVIRONMENT=Development
        // so that the test-only /api/v1/test-error endpoint is registered.
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment(Environments.Development);
        });
    }

    [Fact]
    public async Task TestErrorEndpoint_Returns500_WithApplicationProblemJsonContentType()
    {
        // GIVEN: the API is running and ExceptionHandlingMiddleware is registered first.
        var client = _factory.CreateClient();

        // WHEN: a request hits the Development-only endpoint that throws unhandled.
        var response = await client.GetAsync("/api/v1/test-error");

        // THEN: status is 500 and Content-Type is application/problem+json.
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task TestErrorEndpoint_BodyConformsToProblemDetails_WithStatusTitleTypeInstance()
    {
        // GIVEN: the API is running.
        var client = _factory.CreateClient();

        // WHEN: a request hits /api/v1/test-error.
        var response = await client.GetAsync("/api/v1/test-error");
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        // THEN: the Problem Details object has Status, Title, Type, Instance populated and Detail null.
        problem.Should().NotBeNull();
        problem!.Status.Should().Be(500);
        problem.Title.Should().NotBeNullOrWhiteSpace();
        problem.Type.Should().NotBeNullOrWhiteSpace();
        problem.Instance.Should().NotBeNullOrWhiteSpace();
        problem.Detail.Should().BeNull();
    }

    [Fact]
    public async Task TestErrorEndpoint_BodyDoesNotLeakStackTraceOrExceptionMessage()
    {
        // GIVEN: the API is running.
        var client = _factory.CreateClient();

        // WHEN: a request hits /api/v1/test-error.
        var response = await client.GetAsync("/api/v1/test-error");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: the body MUST NOT leak stack traces, exception details, or the raw message.
        body.Should().NotContain("stackTrace");
        body.Should().NotContain("StackTrace");
        body.Should().NotContain("exception");
        body.Should().NotContain("Exception");
        body.Should().NotContain("innerException");
        body.Should().NotContain("InnerException");
        body.Should().NotContain("internal test"); // the original exception message
    }
}
