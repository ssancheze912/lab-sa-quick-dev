using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Clientes;

/// <summary>
/// ATDD tests — Story 2.4: Edit Client (RED phase)
/// Tests fail until PUT /api/v1/clientes/:id endpoint, UpdateClienteCommandHandler,
/// UpdateClienteRequestValidator, and IClienteRepository.UpdateAsync are implemented.
///
/// Test IDs covered:
///   TC-E2-2-4-API-1 (P1) — PUT valid payload returns 200 + updated ClienteDto
///   TC-E2-2-4-API-2 (P1) — PUT Nombre=null returns 400 + Problem Details with errors object
///   TC-E2-2-4-API-3 (P1) — PUT unknown UUID returns 404 + Problem Details
///   TC-E2-2-4-API-4 (P2) — PUT NIT conflict returns 409 + Problem Details "El NIT/RUC ya está registrado"
/// </summary>
public class UpdateClienteApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public UpdateClienteApiTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-4-API-1 (P1) — PUT valid payload returns 200 + updated ClienteDto
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-4-API-1 (P1)
    /// GIVEN a client exists with known values
    /// WHEN PUT /api/v1/clientes/:id is called with all four fields updated
    /// THEN the response status is 200 OK (NOT 201) and the body is the updated ClienteDto
    ///      with DateTimeOffset fields and the new Nombre value
    /// </summary>
    [Fact]
    public async Task PutCliente_WithValidPayload_Returns200WithUpdatedClienteDto()
    {
        // GIVEN: A client is created first so we have a valid ID
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var createPayload = new
        {
            nombre = "Empresa Original SA",
            nit = $"900{uniqueSuffix % 1_000_000:D6}-1",
            telefono = "3001234567",
            ciudad = "Bogotá"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/clientes", createPayload);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<ClienteDto>();
        Assert.NotNull(created);

        try
        {
            // WHEN: PUT /api/v1/clientes/:id with updated payload
            var updatePayload = new
            {
                nombre = "Empresa Actualizada SA",
                nit = $"800{uniqueSuffix % 1_000_000:D6}-2",
                telefono = "3109876543",
                ciudad = "Medellín"
            };

            var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{created!.Id}", updatePayload);

            // THEN: Response is 200 OK (NOT 201 — edit returns 200 per architecture enforcement)
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            // AND: Body is the updated ClienteDto
            var dto = await response.Content.ReadFromJsonAsync<ClienteDto>();
            Assert.NotNull(dto);
            Assert.Equal(created.Id, dto!.Id);
            Assert.Equal(updatePayload.nombre, dto.Nombre);
            Assert.Equal(updatePayload.nit, dto.Nit);
            Assert.Equal(updatePayload.telefono, dto.Telefono);
            Assert.Equal(updatePayload.ciudad, dto.Ciudad);

            // AND: UpdatedAt is DateTimeOffset and greater than CreatedAt (field was updated)
            Assert.True(dto.CreatedAt > DateTimeOffset.MinValue,
                "CreatedAt must be a valid DateTimeOffset — NEVER DateTime (architecture enforcement).");
            Assert.True(dto.UpdatedAt > DateTimeOffset.MinValue,
                "UpdatedAt must be a valid DateTimeOffset — NEVER DateTime (architecture enforcement).");
            Assert.True(dto.UpdatedAt >= dto.CreatedAt,
                "UpdatedAt must be >= CreatedAt after an update.");
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/clientes/{created!.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-4-API-2 (P1) — PUT Nombre=null returns 400 + Problem Details errors
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-4-API-2 (P1)
    /// GIVEN an existing client
    /// WHEN PUT /api/v1/clientes/:id is called with Nombre=null
    /// THEN the response status is 400 Bad Request and the body contains Problem Details RFC 7807
    ///      with an errors object containing a validation error for the Nombre field
    /// </summary>
    [Fact]
    public async Task PutCliente_WithNombreNull_Returns400WithProblemDetailsErrors()
    {
        // GIVEN: A client exists
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var createPayload = new
        {
            nombre = "Empresa Para Validacion SA",
            nit = $"700{uniqueSuffix % 1_000_000:D6}-3",
            telefono = "3001234567",
            ciudad = "Cali"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/clientes", createPayload);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<ClienteDto>();
        Assert.NotNull(created);

        try
        {
            // WHEN: PUT with Nombre=null (invalid payload — required field missing)
            var invalidPayload = new
            {
                nombre = (string?)null,
                nit = createPayload.nit,
                telefono = createPayload.telefono,
                ciudad = createPayload.ciudad
            };

            var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{created!.Id}", invalidPayload);

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
            await _client.DeleteAsync($"/api/v1/clientes/{created!.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-4-API-3 (P1) — PUT unknown UUID returns 404 + Problem Details
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-4-API-3 (P1)
    /// GIVEN a UUID that does not exist in the system
    /// WHEN PUT /api/v1/clientes/:id is called with that UUID
    /// THEN the response status is 404 Not Found with Problem Details RFC 7807
    ///      with title "Cliente no encontrado" and detail "El cliente solicitado no fue encontrado."
    /// </summary>
    [Fact]
    public async Task PutCliente_WithUnknownUuid_Returns404WithProblemDetails()
    {
        // GIVEN: A UUID that certainly does not exist
        var unknownId = Guid.NewGuid();

        // WHEN: PUT /api/v1/clientes/{unknownId}
        var payload = new
        {
            nombre = "Empresa Inexistente SA",
            nit = "900000000-1",
            telefono = "3001234567",
            ciudad = "Bogotá"
        };

        var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{unknownId}", payload);

        // THEN: Response is 404 Not Found (Results.Problem — NOT Results.NotFound() with empty body)
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // AND: Body is Problem Details RFC 7807 (NOT empty body)
        var body = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(body);
        Assert.Equal(404, body!.Status);

        // AND: Title and detail are the expected Spanish messages
        Assert.NotNull(body.Title);
        Assert.Contains("encontrado", body.Title ?? "", StringComparison.OrdinalIgnoreCase);

        // AND: No stack trace exposed (NFR6)
        Assert.DoesNotContain("StackTrace", body.Detail ?? "", StringComparison.OrdinalIgnoreCase);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-4-API-4 (P2) — PUT NIT conflict returns 409 + Problem Details
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-4-API-4 (P2)
    /// GIVEN two clients exist with different NITs
    /// WHEN PUT /api/v1/clientes/:id is called updating Client A's NIT to match Client B's NIT
    /// THEN the response status is 409 Conflict with Problem Details RFC 7807
    ///      with detail "El NIT/RUC ya está registrado" (no stack trace — NFR6)
    /// </summary>
    [Fact]
    public async Task PutCliente_WithNitAlreadyUsedByAnotherCliente_Returns409WithProblemDetails()
    {
        // GIVEN: Client A exists
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payloadA = new
        {
            nombre = "Empresa A SA",
            nit = $"910{uniqueSuffix % 1_000_000:D6}-1",
            telefono = "3001234567",
            ciudad = "Bogotá"
        };

        var responseA = await _client.PostAsJsonAsync("/api/v1/clientes", payloadA);
        Assert.Equal(HttpStatusCode.Created, responseA.StatusCode);
        var clienteA = await responseA.Content.ReadFromJsonAsync<ClienteDto>();
        Assert.NotNull(clienteA);

        // GIVEN: Client B exists with a different NIT
        var payloadB = new
        {
            nombre = "Empresa B SA",
            nit = $"920{uniqueSuffix % 1_000_000:D6}-2",
            telefono = "3109876543",
            ciudad = "Medellín"
        };

        var responseB = await _client.PostAsJsonAsync("/api/v1/clientes", payloadB);
        Assert.Equal(HttpStatusCode.Created, responseB.StatusCode);
        var clienteB = await responseB.Content.ReadFromJsonAsync<ClienteDto>();
        Assert.NotNull(clienteB);

        try
        {
            // WHEN: PUT Client A's NIT to match Client B's NIT (unique constraint violation)
            var conflictPayload = new
            {
                nombre = "Empresa A Renombrada SA",
                nit = payloadB.nit, // duplicate NIT
                telefono = "3001234567",
                ciudad = "Bogotá"
            };

            var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{clienteA!.Id}", conflictPayload);

            // THEN: Response is 409 Conflict (DbUpdateException 23505 caught explicitly — NOT in middleware)
            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

            // AND: Body is Problem Details RFC 7807 with the expected detail message
            var body = await response.Content.ReadFromJsonAsync<ProblemDetails>();
            Assert.NotNull(body);
            Assert.Equal(409, body!.Status);
            Assert.NotNull(body.Detail);
            Assert.Contains("NIT/RUC", body.Detail,
                StringComparison.OrdinalIgnoreCase);

            // AND: No stack trace exposed (NFR6 — no technical details)
            Assert.DoesNotContain("StackTrace", body.Detail ?? "", StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("DbUpdateException", body.Detail ?? "", StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/clientes/{clienteA!.Id}");
            await _client.DeleteAsync($"/api/v1/clientes/{clienteB!.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response DTOs (match PUT /api/v1/clientes/:id JSON shape)
    // ─────────────────────────────────────────────────────────────────────────

    private sealed record ClienteDto(
        Guid Id,
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad,
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
