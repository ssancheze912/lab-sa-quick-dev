using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using SiesaAgents.IntegrationTests.Fixtures;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// AUTOMATE expansion - Story 1.3.
///
/// Coverage for the <c>MapFallback</c> handler in <c>Program.cs</c> that emits
/// RFC 7807 Problem Details for unmatched routes. Backs NFR6: consistent
/// Problem Details responses across the whole API surface.
///
/// Covers:
///   - 404 fallback returns RFC 7807 with all four required keys.
///   - 404 fallback uses content type <c>application/problem+json</c>.
///   - 404 fallback "instance" field reflects the requested path.
///   - 404 fallback body contains NO stack trace / exception text leakage.
/// </summary>
public class NotFoundFallbackTests : IClassFixture<SiesaAgentsApiFactory>
{
    private readonly SiesaAgentsApiFactory _factory;

    public NotFoundFallbackTests(SiesaAgentsApiFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// GIVEN the API is running.
    /// WHEN  an unmatched route is requested.
    /// THEN  the response is 404 with Problem Details payload (RFC 7807 keys).
    /// Content-type is asserted separately by
    /// <see cref="NotFoundFallback_ContentType_IsProblemJson"/>.
    /// </summary>
    [Fact]
    public async Task NotFoundFallback_OnUnmatchedRoute_Returns404WithRfc7807Body()
    {
        // GIVEN
        using var client = _factory.CreateClient();

        // WHEN
        var response = await client.GetAsync("/no-such-endpoint-exists");

        // THEN — status 404 and an RFC 7807-shaped JSON body
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("status", out var status));
        Assert.Equal(404, status.GetInt32());
        Assert.True(root.TryGetProperty("title", out _));
        Assert.True(root.TryGetProperty("type", out _));
        Assert.True(root.TryGetProperty("instance", out _));
    }

    /// <summary>
    /// AC #4 / NFR6 — The 404 fallback emits <c>application/problem+json</c>.
    /// Fixed by code-review 1.3: <c>MapFallback</c> now uses
    /// <c>JsonSerializer.SerializeAsync</c> directly so the manually-set
    /// content type is preserved (the same fix already applied to the
    /// <c>ExceptionHandlingMiddleware</c>).
    /// </summary>
    [Fact]
    public async Task NotFoundFallback_ContentType_IsProblemJson()
    {
        // GIVEN
        using var client = _factory.CreateClient();

        // WHEN
        var response = await client.GetAsync("/no-such-endpoint-exists");

        // THEN — must be application/problem+json.
        Assert.NotNull(response.Content.Headers.ContentType);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType!.MediaType);
    }

    /// <summary>
    /// AC #4 — The <c>instance</c> property of the 404 Problem Details body
    /// MUST reflect the requested path, identical to the
    /// <c>ExceptionHandlingMiddleware</c> behaviour for 500 responses.
    /// </summary>
    [Fact]
    public async Task NotFoundFallback_InstanceField_ReflectsRequestedPath()
    {
        // GIVEN
        using var client = _factory.CreateClient();
        const string unknownPath = "/api/v1/nothing-here";

        // WHEN
        var response = await client.GetAsync(unknownPath);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        // THEN
        Assert.True(doc.RootElement.TryGetProperty("instance", out var instance));
        Assert.Equal(unknownPath, instance.GetString());
    }

    /// <summary>
    /// NFR6 — Even on a 404, the body MUST NOT contain stack frames or
    /// exception text. This guards against framework changes that might start
    /// pretty-printing an exception when no endpoint matches.
    /// </summary>
    [Fact]
    public async Task NotFoundFallback_Body_DoesNotLeakStackTraceOrExceptionText()
    {
        // GIVEN
        using var client = _factory.CreateClient();

        // WHEN
        var response = await client.GetAsync("/no-such-endpoint-exists");
        var body = await response.Content.ReadAsStringAsync();

        // THEN — none of the forbidden substrings appear
        var forbiddenSubstrings = new[]
        {
            "stackTrace",
            "StackTrace",
            "innerException",
            "InnerException",
            "at SiesaAgents",
        };

        foreach (var forbidden in forbiddenSubstrings)
        {
            Assert.DoesNotContain(forbidden, body);
        }
    }
}
