using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Contactos;

/// <summary>
/// API integration tests — Story 3.3: Create Contact
///
/// Test IDs covered:
///   TC-E3-3-3-API-1 (P0) — POST /api/v1/contactos with valid payload returns 201 + ContactoDto
///   TC-E3-3-3-API-2 (P0) — POST + re-GET confirms new contact in list
///   TC-E3-3-3-API-3 (P1) — POST with empty body returns 400 + Problem Details with errors object
///   TC-E3-3-3-API-4 (P1) — POST same email twice → second returns 409 Problem Details (R-001 doc)
/// </summary>
public class CreateContactoApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public CreateContactoApiTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-3-API-1 (P0) — POST with valid payload returns 201 + ContactoDto
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-3-API-1 (P0)
    /// GIVEN a valid contact payload with Nombre, Cargo, Telefono, Email
    /// WHEN POST /api/v1/contactos is called
    /// THEN response status is 201 Created and body contains ContactoDto shape
    /// </summary>
    [Fact]
    public async Task PostContacto_WithValidPayload_Returns201AndContactoDto()
    {
        // GIVEN: A valid contact payload
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nombre = $"María López {timestamp}",
            cargo = "Gerente Comercial",
            telefono = $"310{timestamp % 10_000_000:D7}",
            email = $"maria.lopez.{timestamp}@empresa.co"
        };

        // WHEN: POST /api/v1/contactos
        var response = await _client.PostAsJsonAsync("/api/v1/contactos", payload);

        // THEN: 201 Created
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        // AND: Body has ContactoDto shape
        var body = await response.Content.ReadFromJsonAsync<ContactoDto>();
        Assert.NotNull(body);
        Assert.NotEqual(Guid.Empty, body!.Id);
        Assert.Equal(payload.nombre, body.Nombre);
        Assert.Equal(payload.cargo, body.Cargo);
        Assert.Equal(payload.telefono, body.Telefono);
        Assert.Equal(payload.email, body.Email);
        Assert.Null(body.ClienteId);
        Assert.True(body.CreatedAt > DateTimeOffset.MinValue);
        Assert.True(body.UpdatedAt > DateTimeOffset.MinValue);

        // Cleanup
        await _client.DeleteAsync($"/api/v1/contactos/{body.Id}");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-3-API-2 (P0) — POST + re-GET confirms new contact in list
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-3-API-2 (P0)
    /// GIVEN a newly created contact via POST
    /// WHEN GET /api/v1/contactos is called immediately after
    /// THEN the new contact appears in the list
    /// </summary>
    [Fact]
    public async Task PostContacto_ThenGetList_NewContactAppearsInList()
    {
        // GIVEN: A contact is created via POST
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nombre = $"Nuevo Contacto {timestamp}",
            cargo = "Analista",
            telefono = $"300{timestamp % 10_000_000:D7}",
            email = $"nuevo.contacto.{timestamp}@test.co"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/contactos", payload);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<ContactoDto>();
        Assert.NotNull(created);

        try
        {
            // WHEN: GET /api/v1/contactos
            var listResponse = await _client.GetAsync("/api/v1/contactos");
            Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);

            var list = await listResponse.Content.ReadFromJsonAsync<List<ContactoDto>>();
            Assert.NotNull(list);

            // THEN: New contact is in the list
            Assert.True(
                list.Any(c => c.Id == created!.Id && c.Nombre == payload.nombre),
                $"Expected contact '{payload.nombre}' (Id={created!.Id}) in GET list response."
            );
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{created!.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-3-API-3 (P1) — POST empty body → 400 + Problem Details with errors
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-3-API-3 (P1)
    /// GIVEN an empty/invalid request body
    /// WHEN POST /api/v1/contactos is called
    /// THEN response status is 400 Bad Request with Problem Details containing errors object
    /// </summary>
    [Fact]
    public async Task PostContacto_WithEmptyBody_Returns400WithProblemDetails()
    {
        // GIVEN: Empty payload (all fields null/missing)
        var payload = new
        {
            nombre = (string?)null,
            cargo = (string?)null,
            telefono = (string?)null,
            email = (string?)null
        };

        // WHEN: POST /api/v1/contactos
        var response = await _client.PostAsJsonAsync("/api/v1/contactos", payload);

        // THEN: 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // AND: Problem Details with errors object
        var body = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(body);
        Assert.NotNull(body!.Errors);
        Assert.True(body.Errors.Count > 0, "Expected at least one validation error in Problem Details.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-3-API-4 (P1) — POST same email twice → second returns 409 (R-001)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-3-API-4 (P1)
    /// GIVEN a contact already exists with a given email
    /// WHEN POST /api/v1/contactos is called with the same email
    /// THEN response status is 409 Conflict with Problem Details "El email ya está registrado"
    /// Documents R-001 behavior: DB enforces email uniqueness via uk_contactos_email index
    /// </summary>
    [Fact]
    public async Task PostContacto_WithDuplicateEmail_Returns409Conflict()
    {
        // GIVEN: A contact is created with a specific email
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var sharedEmail = $"duplicate.{timestamp}@empresa.co";

        var firstPayload = new
        {
            nombre = "Primer Contacto",
            cargo = "Gerente",
            telefono = $"301{timestamp % 10_000_000:D7}",
            email = sharedEmail
        };

        var firstResponse = await _client.PostAsJsonAsync("/api/v1/contactos", firstPayload);
        Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);

        var first = await firstResponse.Content.ReadFromJsonAsync<ContactoDto>();
        Assert.NotNull(first);

        try
        {
            // WHEN: POST same email again
            var secondPayload = new
            {
                nombre = "Segundo Contacto",
                cargo = "Analista",
                telefono = $"302{timestamp % 10_000_000:D7}",
                email = sharedEmail
            };

            var secondResponse = await _client.PostAsJsonAsync("/api/v1/contactos", secondPayload);

            // THEN: 409 Conflict
            Assert.Equal(HttpStatusCode.Conflict, secondResponse.StatusCode);

            // AND: Problem Details contains email conflict message
            var body = await secondResponse.Content.ReadAsStringAsync();
            Assert.Contains("email", body.ToLowerInvariant());
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{first!.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response DTO (matches POST /api/v1/contactos and GET response JSON shape)
    // ─────────────────────────────────────────────────────────────────────────

    private sealed record ContactoDto(
        Guid Id,
        string Nombre,
        string Cargo,
        string Telefono,
        string Email,
        Guid? ClienteId,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt
    );

    private sealed class ValidationProblemDetails
    {
        public string? Title { get; set; }
        public int Status { get; set; }
        public Dictionary<string, string[]> Errors { get; set; } = new();
    }
}
