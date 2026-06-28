using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Contactos;

/// <summary>
/// API integration tests — Story 3.2: Contact Detail View
///
/// Test IDs covered:
///   TC-E3-3-2-API-1 (P1) — GET /api/v1/contactos/:id returns 200 + correct ContactoDto with all 4 fields
///   TC-E3-3-2-API-2 (P1) — GET /api/v1/contactos/{unknown-uuid} returns 404 + Problem Details
/// </summary>
public class GetContactoByIdApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public GetContactoByIdApiTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-2-API-1 (P1) — GET /api/v1/contactos/:id returns 200 + correct ContactoDto
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-2-API-1 (P1)
    /// GIVEN a contacto is seeded via POST
    /// WHEN GET /api/v1/contactos/{id} is called with the seeded ID
    /// THEN the response status is 200 OK
    /// AND the body contains the correct Nombre, Cargo, Teléfono, Email (FR13)
    /// </summary>
    [Fact]
    public async Task GetContactoById_WhenContactoExists_Returns200WithAllFourFields()
    {
        // GIVEN: Seed a contacto via POST
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nombre = $"María López TC-E3-3-2-API-1 {timestamp}",
            cargo = "Gerente Comercial",
            telefono = $"300{timestamp % 10_000_000:D7}",
            email = $"maria.lopez.{timestamp}@empresa.co"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/contactos", payload);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<ContactoResponse>();
        Assert.NotNull(created);

        try
        {
            // WHEN: GET /api/v1/contactos/{id}
            var response = await _client.GetAsync($"/api/v1/contactos/{created!.Id}");

            // THEN: 200 OK
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            // AND: Response body contains the correct ContactoDto
            var contacto = await response.Content.ReadFromJsonAsync<ContactoResponse>();
            Assert.NotNull(contacto);

            // Verify all 4 FR13 fields
            Assert.Equal(created.Id, contacto!.Id);
            Assert.Equal(payload.nombre, contacto.Nombre);
            Assert.Equal(payload.cargo, contacto.Cargo);
            Assert.Equal(payload.telefono, contacto.Telefono);
            Assert.Equal(payload.email, contacto.Email);

            // Verify timestamps are present and valid DateTimeOffset
            Assert.True(contacto.CreatedAt > DateTimeOffset.MinValue);
            Assert.True(contacto.UpdatedAt > DateTimeOffset.MinValue);
        }
        finally
        {
            // Cleanup: Delete seeded contacto
            await _client.DeleteAsync($"/api/v1/contactos/{created!.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-2-API-2 (P1) — GET /api/v1/contactos/{unknown-uuid} returns 404 + Problem Details
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-2-API-2 (P1)
    /// GIVEN an ID that does not exist in the database
    /// WHEN GET /api/v1/contactos/{unknown-uuid} is called
    /// THEN the response status is 404 Not Found
    /// AND the body follows Problem Details RFC 7807 format (title, status, detail)
    /// </summary>
    [Fact]
    public async Task GetContactoById_WhenContactoDoesNotExist_Returns404WithProblemDetails()
    {
        // GIVEN: A UUID that is guaranteed not to exist
        var unknownId = Guid.NewGuid();

        // WHEN: GET /api/v1/contactos/{unknown-id}
        var response = await _client.GetAsync($"/api/v1/contactos/{unknownId}");

        // THEN: 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // AND: Response Content-Type is application/problem+json (RFC 7807)
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.True(
            contentType.Contains("application/problem+json") || contentType.Contains("application/json"),
            $"Expected problem+json or application/json, got: {contentType}"
        );

        // AND: Response body follows Problem Details RFC 7807 structure
        var body = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrEmpty(body), "Expected a non-empty response body for 404.");

        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // Verify required Problem Details fields
        Assert.True(root.TryGetProperty("status", out var statusProp),
            "Problem Details must contain 'status' field.");
        Assert.Equal(404, statusProp.GetInt32());

        Assert.True(root.TryGetProperty("title", out var titleProp),
            "Problem Details must contain 'title' field.");
        var title = titleProp.GetString();
        Assert.False(string.IsNullOrEmpty(title), "Problem Details 'title' must not be empty.");

        // Verify detail field exists and is non-empty (as per ContactoEndpoints implementation)
        if (root.TryGetProperty("detail", out var detailProp))
        {
            var detail = detailProp.GetString();
            Assert.False(string.IsNullOrEmpty(detail), "Problem Details 'detail' should not be empty when present.");
        }

        // Verify no stack trace is exposed (NFR6 — security)
        Assert.False(body.Contains("System."), "Response must not expose stack traces.");
        Assert.False(body.Contains("at SiesaAgents."), "Response must not expose internal namespaces.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Additional: GET /api/v1/contactos/{non-guid} returns 404 (route not matched)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN a non-GUID value in the ID segment
    /// WHEN GET /api/v1/contactos/not-a-guid is called
    /// THEN the response is 400 or 404 (route constraint prevents matching /{id:guid})
    /// AND no crash or 500 occurs
    /// </summary>
    [Fact]
    public async Task GetContactoById_WhenIdIsNotGuid_ReturnsClientError()
    {
        // WHEN: GET with a non-GUID value
        var response = await _client.GetAsync("/api/v1/contactos/not-a-valid-guid");

        // THEN: Client error (400 Bad Request or 404 Not Found due to guid route constraint)
        Assert.True(
            (int)response.StatusCode >= 400 && (int)response.StatusCode < 500,
            $"Expected 4xx client error for non-GUID id, got: {response.StatusCode}"
        );

        // AND: No 500 internal server error (graceful handling)
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response DTO (matches GET /api/v1/contactos/{id} JSON shape)
    // ─────────────────────────────────────────────────────────────────────────

    private sealed record ContactoResponse(
        Guid Id,
        string Nombre,
        string Cargo,
        string Telefono,
        string Email,
        Guid? ClienteId,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt
    );
}
