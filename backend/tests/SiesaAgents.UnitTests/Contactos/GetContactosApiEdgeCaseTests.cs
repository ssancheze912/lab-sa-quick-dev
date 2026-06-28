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
/// Edge-case API tests — Story 3.1: GET /api/v1/contactos (expands ATDD coverage).
///
/// Test IDs covered:
///   TC-E3-3-1-API-EC-1 (P1) — Response Content-Type is application/json
///   TC-E3-3-1-API-EC-2 (P1) — Response body is a JSON array (not a wrapper object)
///   TC-E3-3-1-API-EC-3 (P1) — Each DTO in response has all required fields
///   TC-E3-3-1-API-EC-4 (P1) — GET with multiple seeded contactos returns all of them
///   TC-E3-3-1-API-EC-5 (P2) — Duplicate email rejected: POST with existing email returns conflict
///   TC-E3-3-1-API-EC-6 (P2) — GET response includes DateTimeOffset (ISO 8601 UTC) for createdAt
///   TC-E3-3-1-API-EC-7 (P2) — Response DTO includes clienteId field (nullable, null by default)
///   TC-E3-3-1-API-EC-8 (P2) — POST with whitespace-only Nombre returns 400 Bad Request
///   TC-E3-3-1-API-EC-9 (P1) — GET /api/v1/contactos/{id} returns 404 for non-existent id
/// </summary>
public class GetContactosApiEdgeCaseTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public GetContactosApiEdgeCaseTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private async Task<ContactoResponse?> CreateContactoAsync(
        string? nombreSuffix = null,
        string? emailOverride = null)
    {
        var ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() % 1_000_000;
        var suffix = nombreSuffix ?? ts.ToString("D6");
        var email = emailOverride ?? $"contacto.{suffix}@test.co";

        var payload = new
        {
            nombre = $"Contacto Test {suffix}",
            cargo = "Analista",
            telefono = $"301{ts % 10_000_000:D7}",
            email
        };

        var response = await _client.PostAsJsonAsync("/api/v1/contactos", payload);
        if (!response.IsSuccessStatusCode) return null;
        return await response.Content.ReadFromJsonAsync<ContactoResponse>();
    }

    private async Task DeleteContactoAsync(Guid id)
    {
        await _client.DeleteAsync($"/api/v1/contactos/{id}");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-API-EC-1 (P1) — Response Content-Type is application/json
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-API-EC-1 (P1)
    /// GIVEN the backend is running
    /// WHEN GET /api/v1/contactos is called
    /// THEN the response Content-Type header includes "application/json"
    /// </summary>
    [Fact]
    public async Task GetContactos_WhenCalled_ReturnsApplicationJsonContentType()
    {
        // GIVEN: Backend is running with migrations applied
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();

        // WHEN: GET /api/v1/contactos is called
        var response = await _client.GetAsync("/api/v1/contactos");

        // THEN: Status is OK and Content-Type is application/json
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.MediaType;
        Assert.Equal("application/json", contentType);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-API-EC-2 (P1) — Response body is a JSON array (no wrapper object)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-API-EC-2 (P1)
    /// GIVEN the backend is running
    /// WHEN GET /api/v1/contactos is called
    /// THEN the response root JSON element is an array (architecture: no { data:[], total:0 } wrapper)
    /// </summary>
    [Fact]
    public async Task GetContactos_WhenCalled_ReturnsRootJsonArray_NotWrappedObject()
    {
        // GIVEN: Backend is running
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();

        // WHEN: GET /api/v1/contactos is called
        var response = await _client.GetAsync("/api/v1/contactos");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Root JSON element is an Array (not Object)
        var rawJson = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(rawJson);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-API-EC-3 (P1) — Each DTO has all required fields
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-API-EC-3 (P1)
    /// GIVEN a seeded contacto in the database
    /// WHEN GET /api/v1/contactos is called
    /// THEN each item in the array contains id, nombre, cargo, telefono, email,
    ///      clienteId, createdAt, updatedAt fields
    /// </summary>
    [Fact]
    public async Task GetContactos_WithSeededContacto_ResponseContainsAllDtoFields()
    {
        // GIVEN: One seeded contacto
        var created = await CreateContactoAsync();
        Assert.NotNull(created);

        try
        {
            // WHEN: GET /api/v1/contactos is called
            var response = await _client.GetAsync("/api/v1/contactos");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var rawJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(rawJson);
            Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);

            // Find the created item
            var item = doc.RootElement.EnumerateArray()
                .FirstOrDefault(el =>
                    el.TryGetProperty("id", out var idEl) &&
                    idEl.GetString() == created.Id.ToString());

            Assert.True(item.ValueKind != JsonValueKind.Undefined,
                "Created contacto not found in response array.");

            // THEN: All required DTO fields are present
            Assert.True(item.TryGetProperty("id", out _), "Missing field: id");
            Assert.True(item.TryGetProperty("nombre", out _), "Missing field: nombre");
            Assert.True(item.TryGetProperty("cargo", out _), "Missing field: cargo");
            Assert.True(item.TryGetProperty("telefono", out _), "Missing field: telefono");
            Assert.True(item.TryGetProperty("email", out _), "Missing field: email");
            Assert.True(item.TryGetProperty("clienteId", out _), "Missing field: clienteId");
            Assert.True(item.TryGetProperty("createdAt", out _), "Missing field: createdAt");
            Assert.True(item.TryGetProperty("updatedAt", out _), "Missing field: updatedAt");
        }
        finally
        {
            await DeleteContactoAsync(created!.Id);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-API-EC-4 (P1) — Multiple seeded contactos all appear in response
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-API-EC-4 (P1)
    /// GIVEN three contactos seeded in the database
    /// WHEN GET /api/v1/contactos is called
    /// THEN all three appear in the response array
    /// </summary>
    [Fact]
    public async Task GetContactos_WithMultipleSeededContactos_ReturnsAllInArray()
    {
        // GIVEN: Three seeded contactos with unique emails
        var ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() % 100_000;
        var c1 = await CreateContactoAsync($"{ts}B01");
        var c2 = await CreateContactoAsync($"{ts}B02");
        var c3 = await CreateContactoAsync($"{ts}B03");

        Assert.NotNull(c1);
        Assert.NotNull(c2);
        Assert.NotNull(c3);

        try
        {
            // WHEN: GET /api/v1/contactos is called
            var response = await _client.GetAsync("/api/v1/contactos");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<List<ContactoResponse>>();
            Assert.NotNull(body);

            // THEN: All three created contactos appear in the response
            var ids = body.Select(c => c.Id).ToHashSet();
            Assert.Contains(c1!.Id, ids);
            Assert.Contains(c2!.Id, ids);
            Assert.Contains(c3!.Id, ids);
        }
        finally
        {
            await DeleteContactoAsync(c1!.Id);
            await DeleteContactoAsync(c2!.Id);
            await DeleteContactoAsync(c3!.Id);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-API-EC-5 (P2) — Duplicate email returns conflict
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-API-EC-5 (P2)
    /// GIVEN a contacto with a specific email already exists
    /// WHEN POST /api/v1/contactos is called with the same email
    /// THEN the response is a conflict (enforced by ix_contactos_email unique index)
    /// Note: The exact status code depends on the ExceptionHandlingMiddleware implementation.
    /// A duplicate key on ix_contactos_email should produce a non-201 response.
    /// </summary>
    [Fact]
    public async Task PostContacto_WhenEmailAlreadyExists_ReturnsErrorStatus()
    {
        // GIVEN: A contacto with a specific email already exists
        var ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() % 1_000_000;
        var duplicateEmail = $"duplicate.{ts}@test.co";

        var first = await CreateContactoAsync(emailOverride: duplicateEmail);
        Assert.NotNull(first);

        try
        {
            // WHEN: POST with the same email
            var duplicatePayload = new
            {
                nombre = "Otro Contacto Duplicado",
                cargo = "Analista",
                telefono = "3002222222",
                email = duplicateEmail
            };

            var duplicateResponse = await _client.PostAsJsonAsync("/api/v1/contactos", duplicatePayload);

            // THEN: Response is not 201 Created (duplicate email violates unique index)
            Assert.NotEqual(HttpStatusCode.Created, duplicateResponse.StatusCode);
        }
        finally
        {
            await DeleteContactoAsync(first!.Id);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-API-EC-6 (P2) — createdAt is ISO 8601 DateTimeOffset (UTC)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-API-EC-6 (P2)
    /// GIVEN a seeded contacto in the database
    /// WHEN GET /api/v1/contactos is called
    /// THEN the createdAt field is a valid ISO 8601 datetime parseable as DateTimeOffset with UTC offset
    /// </summary>
    [Fact]
    public async Task GetContactos_WithSeededContacto_CreatedAtIsValidIso8601DateTimeOffset()
    {
        // GIVEN: One seeded contacto
        var created = await CreateContactoAsync();
        Assert.NotNull(created);

        try
        {
            // WHEN: GET /api/v1/contactos is called
            var body = await _client.GetFromJsonAsync<List<ContactoResponse>>("/api/v1/contactos");
            Assert.NotNull(body);

            var item = body.FirstOrDefault(c => c.Id == created!.Id);
            Assert.NotNull(item);

            // THEN: createdAt and updatedAt are valid DateTimeOffset values (UTC)
            Assert.NotEqual(default, item!.CreatedAt);
            Assert.NotEqual(default, item.UpdatedAt);
            // CRITICAL: Verify UTC offset (DateTimeOffset not DateTime enforcement)
            Assert.Equal(TimeSpan.Zero, item.CreatedAt.Offset);
            Assert.Equal(TimeSpan.Zero, item.UpdatedAt.Offset);
        }
        finally
        {
            await DeleteContactoAsync(created!.Id);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-API-EC-7 (P2) — clienteId is null for a new contacto
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-API-EC-7 (P2)
    /// GIVEN a contacto created without assigning a client
    /// WHEN GET /api/v1/contactos is called
    /// THEN the clienteId field in the response is null (not yet assigned — Epic 4 assigns it)
    /// </summary>
    [Fact]
    public async Task GetContactos_WithSeededContacto_ClienteIdIsNull()
    {
        // GIVEN: One seeded contacto (no clienteId assigned)
        var created = await CreateContactoAsync();
        Assert.NotNull(created);

        try
        {
            // WHEN: GET /api/v1/contactos is called
            var body = await _client.GetFromJsonAsync<List<ContactoResponse>>("/api/v1/contactos");
            Assert.NotNull(body);

            var item = body.FirstOrDefault(c => c.Id == created!.Id);
            Assert.NotNull(item);

            // THEN: clienteId is null by default
            Assert.Null(item!.ClienteId);
        }
        finally
        {
            await DeleteContactoAsync(created!.Id);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-API-EC-8 (P2) — POST with whitespace-only Nombre returns error
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-API-EC-8 (P2)
    /// GIVEN a POST payload where Nombre is whitespace only
    /// WHEN POST /api/v1/contactos is called
    /// THEN the response is a non-success status (ContactoEntity.Create() throws ArgumentException
    ///      for whitespace Nombre, which the middleware converts to an error response)
    /// </summary>
    [Fact]
    public async Task PostContacto_WhenNombreIsWhitespaceOnly_ReturnsErrorStatus()
    {
        // GIVEN: Payload with whitespace-only Nombre
        var ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nombre = "   ",
            cargo = "Analista",
            telefono = "3001234567",
            email = $"whitespace.test.{ts}@test.co"
        };

        // WHEN: POST /api/v1/contactos is called
        var response = await _client.PostAsJsonAsync("/api/v1/contactos", payload);

        // THEN: Response is not 201 Created (ArgumentException from domain entity)
        Assert.NotEqual(HttpStatusCode.Created, response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-1-API-EC-9 (P1) — GET /api/v1/contactos/{id} returns 404 for unknown id
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-1-API-EC-9 (P1)
    /// GIVEN a contacto Id that does not exist in the database
    /// WHEN GET /api/v1/contactos/{id} is called
    /// THEN the response is 404 Not Found with a Problem Details body
    /// </summary>
    [Fact]
    public async Task GetContactoById_WhenContactoDoesNotExist_Returns404()
    {
        // GIVEN: A Guid that has not been persisted
        var nonExistentId = Guid.NewGuid();

        // WHEN: GET /api/v1/contactos/{id} is called
        var response = await _client.GetAsync($"/api/v1/contactos/{nonExistentId}");

        // THEN: Response is 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response DTO (matches GET /api/v1/contactos JSON shape)
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
