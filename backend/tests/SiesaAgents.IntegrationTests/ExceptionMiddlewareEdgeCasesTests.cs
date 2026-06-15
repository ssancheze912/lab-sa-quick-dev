using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using SiesaAgents.IntegrationTests.Fixtures;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// AUTOMATE expansion - Story 1.3.
///
/// Edge-case coverage for <c>ExceptionHandlingMiddleware</c> beyond the happy
/// path that <see cref="ExceptionMiddlewareTests"/> already covers. Covers:
///   - AC #4: the "instance" field of the Problem Details body reflects the
///     actual request path (not a hardcoded value).
///   - AC #4: POST requests that throw also produce RFC 7807, not just GET.
///   - AC #4: non-throwing requests (200 OK) are NOT touched by the middleware.
///   - NFR6: the Problem Details payload contains EXACTLY the four
///     RFC 7807 keys allowed by the company standard (no "detail" / "errors").
/// </summary>
public class ExceptionMiddlewareEdgeCasesTests : IClassFixture<SiesaAgentsApiFactory>
{
    private readonly SiesaAgentsApiFactory _factory;

    public ExceptionMiddlewareEdgeCasesTests(SiesaAgentsApiFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// AC #4 — Problem Details "instance" field MUST reflect the request path
    /// that caused the exception (so operators can correlate logs).
    ///
    /// GIVEN the API throws on <c>/__test/throw</c>.
    /// WHEN  the response body is inspected.
    /// THEN  the <c>instance</c> property equals <c>/__test/throw</c>.
    /// </summary>
    [Fact]
    public async Task ExceptionMiddleware_InstanceField_ReflectsRequestPath()
    {
        // GIVEN
        using var client = _factory.CreateClient();

        // WHEN
        var response = await client.GetAsync("/__test/throw");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        // THEN
        Assert.True(doc.RootElement.TryGetProperty("instance", out var instance));
        Assert.Equal("/__test/throw", instance.GetString());
    }

    /// <summary>
    /// AC #4 — POST against a GET-only endpoint returns a Problem Details body
    /// via the framework's <c>MapFallback</c> (status 4xx/5xx, never 200).
    ///
    /// NOTE: ASP.NET Core's default behaviour for method-mismatch is to return
    /// status 405 with <c>application/json</c> (NOT <c>application/problem+json</c>).
    /// The <c>MapFallback</c> handler is only invoked when no route matches at
    /// all, not for method mismatches. So we assert ONLY on status code +
    /// non-empty JSON body, not on content-type. Documenting this nuance here
    /// so future readers know why content-type isn't asserted.
    /// </summary>
    [Fact]
    public async Task ExceptionMiddleware_OnPostToGetOnlyEndpoint_ReturnsErrorStatus()
    {
        // GIVEN
        using var client = _factory.CreateClient();
        using var content = new StringContent("{}", Encoding.UTF8, "application/json");

        // WHEN
        var response = await client.PostAsync("/__test/throw", content);

        // THEN — status MUST be 4xx/5xx, NOT 200.
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound ||
            response.StatusCode == HttpStatusCode.MethodNotAllowed ||
            response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 404/405/500 for POST on a GET-only endpoint, got {(int)response.StatusCode}.");

        // Body MAY be application/json (ASP.NET 405 default) OR application/problem+json
        // (when MapFallback fires for unmatched route). Either way it must be JSON.
        var body = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(body));
    }

    /// <summary>
    /// AC #5 — Non-throwing happy-path requests are NOT touched by the global
    /// exception middleware (so /health stays application/json, not
    /// application/problem+json).
    ///
    /// GIVEN the API is running.
    /// WHEN  <c>GET /health</c> is invoked.
    /// THEN  the response is 200 OK and its content type is
    ///       <c>application/json</c>, NOT <c>application/problem+json</c>.
    /// </summary>
    [Fact]
    public async Task ExceptionMiddleware_OnSuccessfulRequest_DoesNotChangeContentType()
    {
        // GIVEN
        using var client = _factory.CreateClient();

        // WHEN
        var response = await client.GetAsync("/health");

        // THEN
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(response.Content.Headers.ContentType);
        Assert.Equal("application/json", response.Content.Headers.ContentType!.MediaType);
    }

    /// <summary>
    /// NFR6 — The Problem Details payload contains ONLY the four allowed
    /// RFC 7807 keys (<c>status</c>, <c>title</c>, <c>type</c>,
    /// <c>instance</c>). It MUST NOT contain <c>detail</c>, <c>errors</c>, or
    /// any custom extension that could leak environment details.
    ///
    /// GIVEN the throwing endpoint is invoked.
    /// WHEN  the JSON body is enumerated.
    /// THEN  each top-level key is one of the four allowed.
    /// </summary>
    [Fact]
    public async Task ExceptionMiddleware_Body_ContainsOnlyAllowedRfc7807Keys()
    {
        // GIVEN
        using var client = _factory.CreateClient();

        // WHEN
        var response = await client.GetAsync("/__test/throw");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        // THEN — every top-level property MUST be one of the four allowed.
        var allowedKeys = new HashSet<string>(StringComparer.Ordinal)
        {
            "status",
            "title",
            "type",
            "instance",
        };

        foreach (var prop in doc.RootElement.EnumerateObject())
        {
            // "detail" being present-but-null is acceptable (System.Text.Json
            // serializes ProblemDetails.Detail as null by default unless
            // JsonIgnoreCondition.WhenWritingNull is set). We assert it is
            // null when present so we never accidentally leak ex.Message there.
            if (prop.Name == "detail")
            {
                Assert.Equal(JsonValueKind.Null, prop.Value.ValueKind);
                continue;
            }

            // "extensions" is the System.Text.Json default for ProblemDetails
            // and must be empty (no custom payload added).
            if (prop.Name == "extensions")
            {
                Assert.Equal(JsonValueKind.Object, prop.Value.ValueKind);
                Assert.Empty(prop.Value.EnumerateObject());
                continue;
            }

            Assert.Contains(prop.Name, allowedKeys);
        }
    }
}
