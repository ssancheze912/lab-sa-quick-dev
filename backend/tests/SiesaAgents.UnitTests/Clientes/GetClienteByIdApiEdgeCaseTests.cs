using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Clientes;

/// <summary>
/// Edge-case API tests — Story 2.2: GET /api/v1/clientes/:id
///
/// Expands ATDD coverage (GetClienteByIdApiTests.cs) with:
///   TC-E2-2-2-API-EC-1 (P1) — Response Content-Type is application/json for 200
///   TC-E2-2-2-API-EC-2 (P1) — Response body contains all required ClienteDto fields
///   TC-E2-2-2-API-EC-3 (P1) — createdAt and updatedAt are valid DateTimeOffset UTC
///   TC-E2-2-2-API-EC-4 (P1) — GET by ID after DELETE returns 404
///   TC-E2-2-2-API-EC-5 (P1) — GET with invalid (non-GUID) ID returns 400 or 404
///   TC-E2-2-2-API-EC-6 (P2) — ID in response matches the requested ID exactly
///   TC-E2-2-2-API-EC-7 (P2) — 404 response Content-Type is application/problem+json or application/json
///   TC-E2-2-2-API-EC-8 (P2) — Fetching same client twice returns consistent data
/// </summary>
public class GetClienteByIdApiEdgeCaseTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public GetClienteByIdApiEdgeCaseTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private async Task<ClienteByIdResponse?> CreateClienteAsync(
        string? nombre = null,
        string? nit = null)
    {
        var ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() % 1_000_000;
        var payload = new
        {
            nombre = nombre ?? $"Edge Test Empresa {ts}",
            nit = nit ?? $"900{ts:D6}-3",
            telefono = "3019876543",
            ciudad = "Bogotá"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);
        if (!response.IsSuccessStatusCode) return null;
        return await response.Content.ReadFromJsonAsync<ClienteByIdResponse>();
    }

    private async Task DeleteClienteAsync(Guid id)
    {
        await _client.DeleteAsync($"/api/v1/clientes/{id}");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-2-API-EC-1 (P1) — 200 response Content-Type is application/json
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-2-API-EC-1 (P1)
    /// GIVEN a client exists in the system
    /// WHEN GET /api/v1/clientes/:id is called
    /// THEN the response Content-Type header is application/json
    /// </summary>
    [Fact]
    public async Task GetClienteById_WhenClienteExists_ReturnsApplicationJsonContentType()
    {
        // GIVEN: A seeded client
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var created = await CreateClienteAsync();
        Assert.NotNull(created);

        try
        {
            // WHEN: GET /api/v1/clientes/:id is called
            var response = await _client.GetAsync($"/api/v1/clientes/{created!.Id}");

            // THEN: Status is 200 OK
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            // AND: Content-Type is application/json
            var contentType = response.Content.Headers.ContentType?.MediaType;
            Assert.Equal("application/json", contentType);
        }
        finally
        {
            await DeleteClienteAsync(created!.Id);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-2-API-EC-2 (P1) — Response body contains all required ClienteDto fields
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-2-API-EC-2 (P1)
    /// GIVEN a client exists in the system
    /// WHEN GET /api/v1/clientes/:id is called
    /// THEN the response JSON contains id, nombre, nit, telefono, ciudad, createdAt, updatedAt
    /// </summary>
    [Fact]
    public async Task GetClienteById_WhenClienteExists_ResponseContainsAllRequiredFields()
    {
        // GIVEN: A seeded client
        var created = await CreateClienteAsync(nombre: "Empresa Campos Completos", nit: "900123002-4");
        Assert.NotNull(created);

        try
        {
            // WHEN: GET /api/v1/clientes/:id is called
            var response = await _client.GetAsync($"/api/v1/clientes/{created!.Id}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var rawJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(rawJson);

            // THEN: All required DTO fields are present in the JSON object
            Assert.True(doc.RootElement.TryGetProperty("id", out _), "Missing field: id");
            Assert.True(doc.RootElement.TryGetProperty("nombre", out _), "Missing field: nombre");
            Assert.True(doc.RootElement.TryGetProperty("nit", out _), "Missing field: nit");
            Assert.True(doc.RootElement.TryGetProperty("telefono", out _), "Missing field: telefono");
            Assert.True(doc.RootElement.TryGetProperty("ciudad", out _), "Missing field: ciudad");
            Assert.True(doc.RootElement.TryGetProperty("createdAt", out _), "Missing field: createdAt");
            Assert.True(doc.RootElement.TryGetProperty("updatedAt", out _), "Missing field: updatedAt");
        }
        finally
        {
            await DeleteClienteAsync(created!.Id);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-2-API-EC-3 (P1) — createdAt and updatedAt are DateTimeOffset UTC
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-2-API-EC-3 (P1)
    /// GIVEN a client exists in the system
    /// WHEN GET /api/v1/clientes/:id is called
    /// THEN createdAt and updatedAt are valid ISO 8601 DateTimeOffset values in UTC
    /// </summary>
    [Fact]
    public async Task GetClienteById_WhenClienteExists_CreatedAtAndUpdatedAtAreUtcDateTimeOffset()
    {
        // GIVEN: A seeded client
        var created = await CreateClienteAsync();
        Assert.NotNull(created);

        try
        {
            // WHEN: GET /api/v1/clientes/:id is called
            var body = await _client.GetFromJsonAsync<ClienteByIdResponse>($"/api/v1/clientes/{created!.Id}");
            Assert.NotNull(body);

            // THEN: createdAt is a non-default DateTimeOffset with UTC offset
            Assert.NotEqual(default, body!.CreatedAt);
            Assert.Equal(TimeSpan.Zero, body.CreatedAt.Offset); // UTC

            // AND: updatedAt is a non-default DateTimeOffset with UTC offset
            Assert.NotEqual(default, body.UpdatedAt);
            Assert.Equal(TimeSpan.Zero, body.UpdatedAt.Offset); // UTC
        }
        finally
        {
            await DeleteClienteAsync(created!.Id);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-2-API-EC-4 (P1) — GET by ID after DELETE returns 404
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-2-API-EC-4 (P1)
    /// GIVEN a client was created and then deleted
    /// WHEN GET /api/v1/clientes/:id is called with the deleted client's ID
    /// THEN the response is 404 Not Found (ghost record not served)
    /// </summary>
    [Fact]
    public async Task GetClienteById_WhenClienteWasDeleted_Returns404()
    {
        // GIVEN: A client is created and then deleted
        var created = await CreateClienteAsync();
        Assert.NotNull(created);

        var deleteResponse = await _client.DeleteAsync($"/api/v1/clientes/{created!.Id}");
        Assert.True(
            deleteResponse.IsSuccessStatusCode || deleteResponse.StatusCode == HttpStatusCode.NoContent,
            $"Expected DELETE to succeed but got {deleteResponse.StatusCode}"
        );

        // WHEN: GET /api/v1/clientes/:id is called with the deleted client's ID
        var response = await _client.GetAsync($"/api/v1/clientes/{created.Id}");

        // THEN: Response is 404 Not Found (no ghost record)
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-2-API-EC-5 (P1) — GET with non-GUID ID returns 400 or 404
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-2-API-EC-5 (P1)
    /// GIVEN a request with a non-GUID path segment (e.g. "abc")
    /// WHEN GET /api/v1/clientes/abc is called
    /// THEN the response is 400 Bad Request (route constraint fails) or 404 Not Found
    /// AND the response is NOT a 200 OK or 500 Internal Server Error
    /// </summary>
    [Fact]
    public async Task GetClienteById_WithNonGuidId_ReturnsBadRequestOrNotFound()
    {
        // GIVEN: A non-GUID path segment
        var invalidIds = new[] { "abc", "not-a-uuid", "12345", "!@#$%" };

        foreach (var invalidId in invalidIds)
        {
            // WHEN: GET /api/v1/clientes/{invalid-id} is called
            var response = await _client.GetAsync($"/api/v1/clientes/{invalidId}");

            // THEN: Response is 400 or 404 (never 200 or 500)
            Assert.True(
                response.StatusCode == HttpStatusCode.BadRequest ||
                response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 400 or 404 for id '{invalidId}' but got {(int)response.StatusCode}"
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-2-API-EC-6 (P2) — ID in response matches the requested ID
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-2-API-EC-6 (P2)
    /// GIVEN a client exists in the system
    /// WHEN GET /api/v1/clientes/:id is called
    /// THEN the id field in the response body matches the requested ID exactly
    /// </summary>
    [Fact]
    public async Task GetClienteById_WhenClienteExists_ResponseIdMatchesRequestedId()
    {
        // GIVEN: A seeded client
        var created = await CreateClienteAsync();
        Assert.NotNull(created);

        try
        {
            // WHEN: GET /api/v1/clientes/:id is called
            var body = await _client.GetFromJsonAsync<ClienteByIdResponse>($"/api/v1/clientes/{created!.Id}");
            Assert.NotNull(body);

            // THEN: The id in the response body matches the requested ID
            Assert.Equal(created.Id, body!.Id);
        }
        finally
        {
            await DeleteClienteAsync(created!.Id);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-2-API-EC-7 (P2) — 404 response Content-Type is problem+json or json
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-2-API-EC-7 (P2)
    /// GIVEN no client exists with the given ID
    /// WHEN GET /api/v1/clientes/{unknown-uuid} is called
    /// THEN the Content-Type is application/problem+json or application/json (RFC 7807 compatible)
    /// </summary>
    [Fact]
    public async Task GetClienteById_WhenClienteNotFound_ReturnsProblemContentType()
    {
        // GIVEN: A UUID that does not exist
        var unknownId = Guid.NewGuid();

        // WHEN: GET /api/v1/clientes/{unknown-uuid} is called
        var response = await _client.GetAsync($"/api/v1/clientes/{unknownId}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: Content-Type indicates problem details or JSON
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.True(
            contentType.Contains("problem+json") || contentType.Contains("application/json"),
            $"Expected application/problem+json or application/json but got: {contentType}"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-2-API-EC-8 (P2) — Fetching same client twice returns consistent data
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-2-API-EC-8 (P2)
    /// GIVEN a client exists in the system
    /// WHEN GET /api/v1/clientes/:id is called twice
    /// THEN both responses return identical data (idempotent read)
    /// </summary>
    [Fact]
    public async Task GetClienteById_CalledTwice_ReturnsSameData()
    {
        // GIVEN: A seeded client
        var created = await CreateClienteAsync(nombre: "Empresa Idempotente SA", nit: "900123003-8");
        Assert.NotNull(created);

        try
        {
            // WHEN: GET /api/v1/clientes/:id is called twice
            var body1 = await _client.GetFromJsonAsync<ClienteByIdResponse>($"/api/v1/clientes/{created!.Id}");
            var body2 = await _client.GetFromJsonAsync<ClienteByIdResponse>($"/api/v1/clientes/{created.Id}");

            Assert.NotNull(body1);
            Assert.NotNull(body2);

            // THEN: Both responses have identical field values
            Assert.Equal(body1!.Id, body2!.Id);
            Assert.Equal(body1.Nombre, body2.Nombre);
            Assert.Equal(body1.Nit, body2.Nit);
            Assert.Equal(body1.Telefono, body2.Telefono);
            Assert.Equal(body1.Ciudad, body2.Ciudad);
        }
        finally
        {
            await DeleteClienteAsync(created!.Id);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response DTOs
    // ─────────────────────────────────────────────────────────────────────────

    private sealed record ClienteByIdResponse(
        Guid Id,
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt
    );
}
