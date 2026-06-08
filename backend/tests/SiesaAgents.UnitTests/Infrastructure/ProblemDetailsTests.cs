// Story 1.3: Backend Database Foundation
// Epic 1: Project Foundation & Application Shell
//
// ATDD Acceptance Tests — RED Phase (API Integration via WebApplicationFactory)
// These tests are intentionally FAILING until the exception path through the full
// pipeline is verified to comply with RFC 7807 + NFR6 (no sensitive leak).
//
// Acceptance Criteria covered:
//   AC #3 — Unhandled exception => HTTP 500 with application/problem+json,
//           ProblemDetails body (status, title, type, instance), Detail == null,
//           no stackTrace / exception / innerException / targetSite / raw message.
//   AC #6 — ExceptionHandlingMiddleware remains the FIRST middleware.
//
// Test Design references:
//   TC-E1-P0-05 — ExceptionHandlingMiddleware Returns Problem Details RFC 7807
//
// Strategy: Boot a test-only WebApplicationFactory<Program> that registers a transient
// endpoint GET /api/v1/test-error which throws InvalidOperationException. The endpoint
// is registered ONLY in the test host (via WithWebHostBuilder) so production routes
// remain untouched.

using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;

namespace SiesaAgents.UnitTests.Infrastructure;

public class ProblemDetailsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private const string SensitiveExceptionMessage = "internal test message — must not leak";
    private const string TestErrorRoute = "/api/v1/test-error";

    private readonly WebApplicationFactory<Program> _factory;

    public ProblemDetailsTests(WebApplicationFactory<Program> factory)
    {
        // Program.cs registers a guarded /api/v1/test-error endpoint only when the host
        // environment is "Testing". Switching the environment here activates that endpoint
        // so the ExceptionHandlingMiddleware path is exercised end-to-end through the
        // exact production pipeline (no middleware reordering, no Configure override).
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
        });
    }

    [Fact]
    public async Task UnhandledException_ResponseStatusCode_Is500()
    {
        // GIVEN: An endpoint that throws an unhandled exception
        var client = _factory.CreateClient();

        // WHEN: The endpoint is invoked
        var response = await client.GetAsync(TestErrorRoute);

        // THEN: The HTTP status is 500 (Internal Server Error)
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task UnhandledException_ResponseContentType_IsApplicationProblemJson()
    {
        // GIVEN: An endpoint that throws an unhandled exception
        var client = _factory.CreateClient();

        // WHEN: The endpoint is invoked
        var response = await client.GetAsync(TestErrorRoute);

        // THEN: The Content-Type starts with application/problem+json (RFC 7807)
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.Equal("application/problem+json", contentType);
    }

    [Fact]
    public async Task UnhandledException_ResponseBody_DeserializesToProblemDetailsWithStatus500()
    {
        // GIVEN: An endpoint that throws an unhandled exception
        var client = _factory.CreateClient();

        // WHEN: The endpoint is invoked and the body is deserialized
        var response = await client.GetAsync(TestErrorRoute);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        // THEN: ProblemDetails.Status is 500
        Assert.NotNull(problem);
        Assert.Equal(500, problem!.Status);
    }

    [Fact]
    public async Task UnhandledException_ProblemDetailsTitle_IsGenericMessage()
    {
        // GIVEN: An endpoint that throws an unhandled exception
        var client = _factory.CreateClient();

        // WHEN: The endpoint is invoked and the body is deserialized
        var response = await client.GetAsync(TestErrorRoute);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        // THEN: ProblemDetails.Title is the generic "An unexpected error occurred." message
        Assert.NotNull(problem);
        Assert.Equal("An unexpected error occurred.", problem!.Title);
    }

    [Fact]
    public async Task UnhandledException_ProblemDetailsDetail_IsNullOrEmpty()
    {
        // GIVEN: An endpoint that throws an unhandled exception
        var client = _factory.CreateClient();

        // WHEN: The endpoint is invoked and the body is deserialized
        var response = await client.GetAsync(TestErrorRoute);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        // THEN: ProblemDetails.Detail is null (NFR6: no sensitive detail surface)
        Assert.NotNull(problem);
        Assert.True(string.IsNullOrEmpty(problem!.Detail));
    }

    [Fact]
    public async Task UnhandledException_RawBody_DoesNotContainSensitiveTokens()
    {
        // GIVEN: An endpoint that throws an unhandled exception with a sensitive message
        var client = _factory.CreateClient();

        // WHEN: The endpoint is invoked and the RAW response body is inspected
        var response = await client.GetAsync(TestErrorRoute);
        var rawBody = await response.Content.ReadAsStringAsync();

        // THEN: NONE of the sensitive tokens appear in the response body (NFR6)
        Assert.DoesNotContain("stackTrace", rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("exception", rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("innerException", rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("targetSite", rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("InvalidOperationException", rawBody, StringComparison.Ordinal);
        Assert.DoesNotContain(SensitiveExceptionMessage, rawBody, StringComparison.Ordinal);
    }

    [Fact]
    public async Task UnhandledException_ProblemDetails_ContainsInstanceMatchingRequestPath()
    {
        // GIVEN: An endpoint that throws an unhandled exception
        var client = _factory.CreateClient();

        // WHEN: The endpoint is invoked and the body is deserialized
        var response = await client.GetAsync(TestErrorRoute);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        // THEN: ProblemDetails.Instance reflects the request path
        Assert.NotNull(problem);
        Assert.Equal(TestErrorRoute, problem!.Instance);
    }

    [Fact]
    public async Task UnhandledException_ProblemDetails_ContainsTypeUri()
    {
        // GIVEN: An endpoint that throws an unhandled exception
        var client = _factory.CreateClient();

        // WHEN: The endpoint is invoked and the body is deserialized
        var response = await client.GetAsync(TestErrorRoute);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        // THEN: ProblemDetails.Type is a non-empty URI (RFC 7807 requirement)
        Assert.NotNull(problem);
        Assert.False(string.IsNullOrWhiteSpace(problem!.Type));
    }
}
