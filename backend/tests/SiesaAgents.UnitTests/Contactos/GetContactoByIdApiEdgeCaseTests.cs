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
/// Edge-case API tests — Story 3.2: GET /api/v1/contactos/{id}
/// Expands ATDD coverage with boundary conditions and error paths.
///
/// Test IDs covered:
///   TC-E3-3-2-API-EC-1 (P1) — GET /api/v1/contactos/{id} returns Content-Type application/json
///   TC-E3-3-2-API-EC-2 (P1) — GET /api/v1/contactos/{id} response includes clienteId (nullable null)
///   TC-E3-3-2-API-EC-3 (P1) — GET /api/v1/contactos/{id} timestamps are UTC DateTimeOffset
///   TC-E3-3-2-API-EC-4 (P1) — GET /api/v1/contactos/{zero-guid} returns 404 (no crash)
///   TC-E3-3-2-API-EC-5 (P1) — GET /api/v1/contactos/{id} 404 body has no stack trace (NFR6)
///   TC-E3-3-2-API-EC-6 (P2) — GET /api/v1/contactos/{id} returns a JSON Object (not array)
///   TC-E3-3-2-API-EC-7 (P2) — GET /api/v1/contactos/{id} response Id matches requested Id
///   TC-E3-3-2-API-EC-8 (P2) — GET /api/v1/contactos/{deleted-id} returns 404 after DELETE
/// </summary>
public class GetContactoByIdApiEdgeCaseTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public GetContactoByIdApiEdgeCaseTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private async Task<ContactoByIdResponse?> CreateContactoAsync(string? suffix = null)
    {
        var ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() % 1_000_000;
        var s = suffix ?? ts.ToString("D6");
        var payload = new
        {
            nombre = $"Contacto EC {s}",
            cargo = "Analista de Pruebas",
            telefono = $"301{ts % 10_000_000:D7}",
            email = $"contacto.ec.{s}@test.co"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/contactos", payload);
        if (!response.IsSuccessStatusCode) return null;
        return await response.Content.ReadFromJsonAsync<ContactoByIdResponse>();
    }

    private async Task DeleteContactoAsync(Guid id)
    {
        await _client.DeleteAsync($"/api/v1/contactos/{id}");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-2-API-EC-1 (P1) — Response Content-Type is application/json
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-2-API-EC-1 (P1)
    /// GIVEN a seeded contacto
    /// WHEN GET /api/v1/contactos/{id} is called
    /// THEN the response Content-Type header is "application/json"
    /// </summary>
    [Fact]
    public async Task GetContactoById_WhenContactoExists_ReturnsApplicationJsonContentType()
    {
        // GIVEN: Seed a contacto via POST
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var created = await CreateContactoAsync("EC1");
        Assert.NotNull(created);

        try
        {
            // WHEN: GET /api/v1/contactos/{id} is called
            var response = await _client.GetAsync($"/api/v1/contactos/{created!.Id}");

            // THEN: 200 OK with application/json Content-Type
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var contentType = response.Content.Headers.ContentType?.MediaType;
            Assert.Equal("application/json", contentType);
        }
        finally
        {
            await DeleteContactoAsync(created!.Id);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-2-API-EC-2 (P1) — Response includes clienteId field (null by default)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-2-API-EC-2 (P1)
    /// GIVEN a seeded contacto without a clienteId assigned
    /// WHEN GET /api/v1/contactos/{id} is called
    /// THEN the response body includes a "clienteId" field with null value
    /// </summary>
    [Fact]
    public async Task GetContactoById_WhenContactoExists_ResponseIncludesNullClienteId()
    {
        // GIVEN: Seed a contacto (no clienteId assigned)
        var created = await CreateContactoAsync("EC2");
        Assert.NotNull(created);

        try
        {
            // WHEN: GET /api/v1/contactos/{id} is called
            var response = await _client.GetAsync($"/api/v1/contactos/{created!.Id}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var rawJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(rawJson);
            var root = doc.RootElement;

            // THEN: Response includes clienteId field with null value
            Assert.True(root.TryGetProperty("clienteId", out var clienteIdProp),
                "Response ContactoDto must include 'clienteId' field.");
            Assert.Equal(JsonValueKind.Null, clienteIdProp.ValueKind);
        }
        finally
        {
            await DeleteContactoAsync(created!.Id);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-2-API-EC-3 (P1) — Timestamps are UTC DateTimeOffset
    // Enforcement: project rule is NEVER DateTime — always DateTimeOffset
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-2-API-EC-3 (P1)
    /// GIVEN a seeded contacto
    /// WHEN GET /api/v1/contactos/{id} is called
    /// THEN createdAt and updatedAt are valid UTC DateTimeOffset values (offset = +00:00)
    /// </summary>
    [Fact]
    public async Task GetContactoById_WhenContactoExists_TimestampsAreUtcDateTimeOffset()
    {
        // GIVEN: Seed a contacto
        var created = await CreateContactoAsync("EC3");
        Assert.NotNull(created);

        try
        {
            // WHEN: GET /api/v1/contactos/{id} is called
            var dto = await _client.GetFromJsonAsync<ContactoByIdResponse>(
                $"/api/v1/contactos/{created!.Id}");
            Assert.NotNull(dto);

            // THEN: createdAt and updatedAt are non-default values
            Assert.True(dto!.CreatedAt > DateTimeOffset.MinValue,
                "createdAt must be a valid non-default DateTimeOffset.");
            Assert.True(dto.UpdatedAt > DateTimeOffset.MinValue,
                "updatedAt must be a valid non-default DateTimeOffset.");

            // CRITICAL: UTC offset must be zero (DateTimeOffset not DateTime enforcement)
            Assert.Equal(TimeSpan.Zero, dto.CreatedAt.Offset);
            Assert.Equal(TimeSpan.Zero, dto.UpdatedAt.Offset);
        }
        finally
        {
            await DeleteContactoAsync(created!.Id);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-2-API-EC-4 (P1) — GET /api/v1/contactos/{zero-guid} returns 404
    // Boundary: Guid.Empty (00000000-0000-0000-0000-000000000000) is a valid Guid but cannot exist
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-2-API-EC-4 (P1)
    /// GIVEN the zero/empty GUID (00000000-0000-0000-0000-000000000000)
    /// WHEN GET /api/v1/contactos/{zero-guid} is called
    /// THEN the response is 404 Not Found (no crash, no 500)
    /// </summary>
    [Fact]
    public async Task GetContactoById_WhenIdIsZeroGuid_Returns404WithNoServerError()
    {
        // GIVEN: The all-zeros GUID (valid Guid format but will never match a seeded entity)
        var zeroGuid = Guid.Empty;

        // WHEN: GET /api/v1/contactos/{zero-guid} is called
        var response = await _client.GetAsync($"/api/v1/contactos/{zeroGuid}");

        // THEN: 404 Not Found — handled gracefully (no 500 Internal Server Error)
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-2-API-EC-5 (P1) — 404 response body contains no stack trace (NFR6)
    // NFR6: Security — no stack traces or internal namespaces exposed in API responses
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-2-API-EC-5 (P1)
    /// GIVEN a non-existent contacto ID
    /// WHEN GET /api/v1/contactos/{unknown-uuid} is called
    /// THEN the 404 response body does NOT expose stack traces or internal namespaces
    /// </summary>
    [Fact]
    public async Task GetContactoById_WhenContactoDoesNotExist_404ResponseHasNoStackTrace()
    {
        // GIVEN: A UUID guaranteed not to exist
        var unknownId = Guid.NewGuid();

        // WHEN: GET /api/v1/contactos/{unknown-uuid} is called
        var response = await _client.GetAsync($"/api/v1/contactos/{unknownId}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrEmpty(body));

        // THEN: No internal information is exposed (NFR6 — security enforcement)
        Assert.False(body.Contains("System."),
            "Response body must not expose .NET System.* namespaces.");
        Assert.False(body.Contains("at SiesaAgents."),
            "Response body must not expose SiesaAgents internal namespace.");
        Assert.False(body.Contains("at Microsoft."),
            "Response body must not expose Microsoft internal namespace.");
        Assert.False(body.Contains("StackTrace"),
            "Response body must not contain StackTrace key.");
        Assert.False(body.Contains("InnerException"),
            "Response body must not expose InnerException details.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-2-API-EC-6 (P2) — Response body is a JSON Object (not array)
    // GET /{id} must return a single object, not a wrapping array
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-2-API-EC-6 (P2)
    /// GIVEN a seeded contacto
    /// WHEN GET /api/v1/contactos/{id} is called
    /// THEN the root JSON element is an Object (not an Array)
    /// </summary>
    [Fact]
    public async Task GetContactoById_WhenContactoExists_ReturnsJsonObjectNotArray()
    {
        // GIVEN: Seed a contacto
        var created = await CreateContactoAsync("EC6");
        Assert.NotNull(created);

        try
        {
            // WHEN: GET /api/v1/contactos/{id} is called
            var response = await _client.GetAsync($"/api/v1/contactos/{created!.Id}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var rawJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(rawJson);

            // THEN: Root element is an Object (not Array — GetById must return single entity)
            Assert.Equal(JsonValueKind.Object, doc.RootElement.ValueKind);
        }
        finally
        {
            await DeleteContactoAsync(created!.Id);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-2-API-EC-7 (P2) — Response Id matches the requested Id exactly
    // Ensures the endpoint returns data for the exact requested entity
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-2-API-EC-7 (P2)
    /// GIVEN two seeded contactos
    /// WHEN GET /api/v1/contactos/{id1} is called
    /// THEN the response Id matches id1 exactly (not id2)
    /// </summary>
    [Fact]
    public async Task GetContactoById_WhenTwoContactosExist_ReturnsCorrectOne()
    {
        // GIVEN: Two seeded contactos
        var ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() % 10_000;
        var c1 = await CreateContactoAsync($"EC7A{ts}");
        var c2 = await CreateContactoAsync($"EC7B{ts}");
        Assert.NotNull(c1);
        Assert.NotNull(c2);

        try
        {
            // WHEN: GET /api/v1/contactos/{c1.Id}
            var response = await _client.GetAsync($"/api/v1/contactos/{c1!.Id}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var dto = await response.Content.ReadFromJsonAsync<ContactoByIdResponse>();
            Assert.NotNull(dto);

            // THEN: Response Id matches c1, not c2
            Assert.Equal(c1.Id, dto!.Id);
            Assert.NotEqual(c2!.Id, dto.Id);

            // WHEN: GET /api/v1/contactos/{c2.Id}
            var response2 = await _client.GetAsync($"/api/v1/contactos/{c2.Id}");
            Assert.Equal(HttpStatusCode.OK, response2.StatusCode);

            var dto2 = await response2.Content.ReadFromJsonAsync<ContactoByIdResponse>();
            Assert.NotNull(dto2);
            Assert.Equal(c2.Id, dto2!.Id);
            Assert.NotEqual(c1.Id, dto2.Id);
        }
        finally
        {
            await DeleteContactoAsync(c1!.Id);
            await DeleteContactoAsync(c2!.Id);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-2-API-EC-8 (P2) — GET after DELETE returns 404
    // Boundary: deleted entity must not be retrievable (soft-delete or hard-delete consistent)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-2-API-EC-8 (P2)
    /// GIVEN a contacto is created then deleted
    /// WHEN GET /api/v1/contactos/{deleted-id} is called
    /// THEN the response is 404 Not Found (entity no longer accessible)
    /// </summary>
    [Fact]
    public async Task GetContactoById_AfterDeletion_Returns404()
    {
        // GIVEN: Seed a contacto
        var created = await CreateContactoAsync("EC8");
        Assert.NotNull(created);

        // Verify it exists first
        var existsResponse = await _client.GetAsync($"/api/v1/contactos/{created!.Id}");
        Assert.Equal(HttpStatusCode.OK, existsResponse.StatusCode);

        // Delete it
        var deleteResponse = await _client.DeleteAsync($"/api/v1/contactos/{created.Id}");
        Assert.True(
            deleteResponse.StatusCode == HttpStatusCode.NoContent ||
            deleteResponse.StatusCode == HttpStatusCode.OK,
            $"DELETE should succeed; got {deleteResponse.StatusCode}");

        // WHEN: GET /api/v1/contactos/{deleted-id} is called after deletion
        var response = await _client.GetAsync($"/api/v1/contactos/{created.Id}");

        // THEN: 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response DTO (matches GET /api/v1/contactos/{id} JSON shape)
    // ─────────────────────────────────────────────────────────────────────────

    private sealed record ContactoByIdResponse(
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
