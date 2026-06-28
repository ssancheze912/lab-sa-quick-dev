using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Contactos;

/// <summary>
/// ATDD API integration tests — Story 3.4: Edit Contact (RED phase)
/// Tests fail until:
///   - PUT /api/v1/contactos/:id endpoint is implemented
///   - UpdateContactoCommandHandler, UpdateContactoRequestValidator are implemented
///   - IContactoRepository.UpdateAsync is implemented
///   - ContactoEntity.Update method is implemented
///
/// Test IDs covered:
///   TC-E3-3-4-API-1 (P1) — PUT valid payload returns 200 + updated ContactoDto
///   TC-E3-3-4-API-2 (P1) — PUT Nombre=null returns 400 + Problem Details with errors object
///   TC-E3-3-4-API-3 (P1) — PUT unknown UUID returns 404 + Problem Details
///   TC-E3-3-4-API-4 (P2) — PUT duplicate email returns 409 + Problem Details "El email ya está registrado"
/// </summary>
public class UpdateContactoApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public UpdateContactoApiTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-4-API-1 (P1) — PUT valid payload returns 200 + updated ContactoDto
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-4-API-1 (P1)
    /// GIVEN a contact exists with known values
    /// WHEN PUT /api/v1/contactos/:id is called with all four fields updated
    /// THEN the response status is 200 OK (NOT 201) and the body is the updated ContactoDto
    ///      with DateTimeOffset fields and the new Nombre value,
    ///      and UpdatedAt is greater than or equal to CreatedAt
    /// </summary>
    [Fact]
    public async Task PutContacto_WithValidPayload_Returns200WithUpdatedContactoDto()
    {
        // GIVEN: A contact is created so we have a valid ID
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var createPayload = new
        {
            nombre = "María Original",
            cargo = "Analista",
            telefono = "3001234567",
            email = $"maria.original.{uniqueSuffix}@empresa.co"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/contactos", createPayload);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<ContactoDto>();
        Assert.NotNull(created);

        try
        {
            // WHEN: PUT /api/v1/contactos/:id with all fields updated
            var updatePayload = new
            {
                nombre = "María Actualizada",
                cargo = "Directora Comercial",
                telefono = "3109876543",
                email = $"maria.actualizada.{uniqueSuffix}@empresa.co"
            };

            var response = await _client.PutAsJsonAsync($"/api/v1/contactos/{created!.Id}", updatePayload);

            // THEN: Response is 200 OK (NOT 201 — edit returns 200 per architecture enforcement)
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            // AND: Body is the updated ContactoDto with all fields changed
            var dto = await response.Content.ReadFromJsonAsync<ContactoDto>();
            Assert.NotNull(dto);
            Assert.Equal(created.Id, dto!.Id);
            Assert.Equal(updatePayload.nombre, dto.Nombre);
            Assert.Equal(updatePayload.cargo, dto.Cargo);
            Assert.Equal(updatePayload.telefono, dto.Telefono);
            Assert.Equal(updatePayload.email, dto.Email);

            // AND: UpdatedAt and CreatedAt are valid DateTimeOffset — NEVER DateTime
            Assert.True(dto.CreatedAt > DateTimeOffset.MinValue,
                "CreatedAt must be a valid DateTimeOffset — NEVER DateTime (architecture enforcement).");
            Assert.True(dto.UpdatedAt > DateTimeOffset.MinValue,
                "UpdatedAt must be a valid DateTimeOffset — NEVER DateTime (architecture enforcement).");

            // AND: UpdatedAt >= CreatedAt (field was updated)
            Assert.True(dto.UpdatedAt >= dto.CreatedAt,
                "UpdatedAt must be >= CreatedAt after an update.");
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{created!.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-4-API-2 (P1) — PUT Nombre=null returns 400 + Problem Details errors
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-4-API-2 (P1)
    /// GIVEN an existing contact
    /// WHEN PUT /api/v1/contactos/:id is called with Nombre=null
    /// THEN the response status is 400 Bad Request and the body contains Problem Details RFC 7807
    ///      with an errors object containing a validation error for the Nombre field
    /// </summary>
    [Fact]
    public async Task PutContacto_WithNombreNull_Returns400WithProblemDetailsErrors()
    {
        // GIVEN: A contact exists
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var createPayload = new
        {
            nombre = "Contacto Para Validar",
            cargo = "Supervisor",
            telefono = "3001234567",
            email = $"validar.{uniqueSuffix}@empresa.co"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/contactos", createPayload);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<ContactoDto>();
        Assert.NotNull(created);

        try
        {
            // WHEN: PUT with Nombre=null (invalid payload — required field missing)
            var invalidPayload = new
            {
                nombre = (string?)null,
                cargo = createPayload.cargo,
                telefono = createPayload.telefono,
                email = createPayload.email
            };

            var response = await _client.PutAsJsonAsync($"/api/v1/contactos/{created!.Id}", invalidPayload);

            // THEN: Response is 400 Bad Request (FluentValidation NotEmpty rule)
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            // AND: Body is Problem Details with errors object (Results.ValidationProblem — NOT raw string)
            var body = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
            Assert.NotNull(body);
            Assert.Equal(400, body!.Status);
            Assert.NotNull(body.Errors);
            Assert.NotEmpty(body.Errors);

            // AND: Errors contain Nombre field
            Assert.True(
                body.Errors.ContainsKey("Nombre") || body.Errors.ContainsKey("nombre"),
                $"Expected 'Nombre' in validation errors. Keys found: {string.Join(", ", body.Errors.Keys)}");
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{created!.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-4-API-3 (P1) — PUT unknown UUID returns 404 + Problem Details
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-4-API-3 (P1)
    /// GIVEN a UUID that does not exist in the system
    /// WHEN PUT /api/v1/contactos/:id is called with that UUID
    /// THEN the response status is 404 Not Found with Problem Details RFC 7807
    ///      with title containing "encontrado" and no stack traces (NFR6)
    /// </summary>
    [Fact]
    public async Task PutContacto_WithUnknownUuid_Returns404WithProblemDetails()
    {
        // GIVEN: A UUID that certainly does not exist
        var unknownId = Guid.NewGuid();

        // WHEN: PUT /api/v1/contactos/{unknownId} with a valid payload
        var payload = new
        {
            nombre = "Contacto Inexistente",
            cargo = "Cargo Inexistente",
            telefono = "3001234567",
            email = "inexistente@empresa.co"
        };

        var response = await _client.PutAsJsonAsync($"/api/v1/contactos/{unknownId}", payload);

        // THEN: Response is 404 Not Found (Results.Problem — NOT Results.NotFound() with empty body)
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // AND: Body is Problem Details RFC 7807 (NOT empty body)
        var body = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(body);
        Assert.Equal(404, body!.Status);

        // AND: Title contains "encontrado" (Spanish — "Contacto no encontrado")
        Assert.NotNull(body.Title);
        Assert.Contains("encontrado", body.Title ?? "", StringComparison.OrdinalIgnoreCase);

        // AND: No stack trace exposed (NFR6)
        Assert.DoesNotContain("StackTrace", body.Detail ?? "", StringComparison.OrdinalIgnoreCase);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-4-API-4 (P2) — PUT duplicate email returns 409 + Problem Details
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-4-API-4 (P2)
    /// GIVEN two contacts exist with different emails
    /// WHEN PUT /api/v1/contactos/:id is called updating Contact A's email to match Contact B's email
    /// THEN the response status is 409 Conflict with Problem Details RFC 7807
    ///      with detail "El email ya está registrado" (no stack trace — NFR6)
    /// </summary>
    [Fact]
    public async Task PutContacto_WithEmailAlreadyUsedByAnotherContacto_Returns409WithProblemDetails()
    {
        // GIVEN: Contact A exists
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payloadA = new
        {
            nombre = "Contacto A",
            cargo = "Analista",
            telefono = "3001111111",
            email = $"contacto.a.{uniqueSuffix}@empresa.co"
        };

        var responseA = await _client.PostAsJsonAsync("/api/v1/contactos", payloadA);
        Assert.Equal(HttpStatusCode.Created, responseA.StatusCode);
        var contactoA = await responseA.Content.ReadFromJsonAsync<ContactoDto>();
        Assert.NotNull(contactoA);

        // GIVEN: Contact B exists with a different email
        var payloadB = new
        {
            nombre = "Contacto B",
            cargo = "Supervisor",
            telefono = "3002222222",
            email = $"contacto.b.{uniqueSuffix}@empresa.co"
        };

        var responseB = await _client.PostAsJsonAsync("/api/v1/contactos", payloadB);
        Assert.Equal(HttpStatusCode.Created, responseB.StatusCode);
        var contactoB = await responseB.Content.ReadFromJsonAsync<ContactoDto>();
        Assert.NotNull(contactoB);

        try
        {
            // WHEN: PUT Contact A's email to match Contact B's email (unique constraint violation on uk_contactos_email)
            var conflictPayload = new
            {
                nombre = "Contacto A Renombrado",
                cargo = "Analista Senior",
                telefono = "3001111111",
                email = payloadB.email // duplicate email
            };

            var response = await _client.PutAsJsonAsync($"/api/v1/contactos/{contactoA!.Id}", conflictPayload);

            // THEN: Response is 409 Conflict (DbUpdateException 23505 caught explicitly — NOT in middleware)
            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

            // AND: Body is Problem Details RFC 7807 with the expected detail message
            var body = await response.Content.ReadFromJsonAsync<ProblemDetails>();
            Assert.NotNull(body);
            Assert.Equal(409, body!.Status);
            Assert.NotNull(body.Detail);
            Assert.Contains("email ya está registrado", body.Detail,
                StringComparison.OrdinalIgnoreCase);

            // AND: No stack trace exposed (NFR6 — no technical details)
            Assert.DoesNotContain("StackTrace", body.Detail ?? "", StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("DbUpdateException", body.Detail ?? "", StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{contactoA!.Id}");
            await _client.DeleteAsync($"/api/v1/contactos/{contactoB!.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response DTOs (match PUT /api/v1/contactos/:id JSON shape)
    // ─────────────────────────────────────────────────────────────────────────

    private sealed record ContactoDto(
        Guid Id,
        string Nombre,
        string Cargo,
        string Telefono,
        string Email,
        string? ClienteId,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt
    );

    private sealed record ProblemDetails(
        string? Type,
        string? Title,
        int? Status,
        string? Detail
    );

    private sealed record ValidationProblemDetails(
        string? Type,
        string? Title,
        int? Status,
        string? Detail,
        Dictionary<string, string[]>? Errors
    );
}
