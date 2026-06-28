using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Clientes;

/// <summary>
/// ATDD tests — Story 2.3: Create Client (RED phase)
/// Tests fail until POST /api/v1/clientes endpoint, CreateClienteCommandHandler,
/// CreateClienteRequestValidator, and IClienteRepository.AddAsync are implemented.
///
/// Test IDs covered:
///   TC-E2-2-3-API-1 (P0) — POST valid payload returns 201 + ClienteDto
///   TC-E2-2-3-API-2 (P0) — POST duplicate NIT returns 409 + Problem Details
///   TC-E2-2-3-API-3 (P1) — POST empty body returns 400 + Problem Details errors
///   TC-E2-2-3-API-4 (P1) — POST missing Nombre only returns 400
///   TC-E2-2-3-API-5 (P3) — POST 255-char Nombre returns 201; 256-char returns 400
/// </summary>
public class CreateClienteApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public CreateClienteApiTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-3-API-1 (P0) — POST valid payload returns 201 + ClienteDto
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-3-API-1 (P0)
    /// GIVEN a valid CreateClienteRequest with all four required fields
    /// WHEN POST /api/v1/clientes is called
    /// THEN the response status is 201 Created and the body matches ClienteDto shape
    /// </summary>
    [Fact]
    public async Task PostCliente_WithValidPayload_Returns201WithClienteDto()
    {
        // GIVEN: Valid payload with all four required fields
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nombre = "Acme S.A.",
            nit = $"900{uniqueSuffix % 1_000_000:D6}-1",
            telefono = "3001234567",
            ciudad = "Bogotá"
        };

        // WHEN: POST /api/v1/clientes is called
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);

        // THEN: Response is 201 Created
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        // AND: Location header points to new resource
        Assert.NotNull(response.Headers.Location);
        Assert.Contains("/api/v1/clientes/", response.Headers.Location!.ToString());

        // AND: Body is a ClienteDto with matching fields
        var dto = await response.Content.ReadFromJsonAsync<ClienteDto>();
        Assert.NotNull(dto);
        Assert.NotEqual(Guid.Empty, dto!.Id);
        Assert.Equal(payload.nombre, dto.Nombre);
        Assert.Equal(payload.nit, dto.Nit);
        Assert.Equal(payload.telefono, dto.Telefono);
        Assert.Equal(payload.ciudad, dto.Ciudad);

        // AND: CreatedAt and UpdatedAt are DateTimeOffset (not DateTime — architecture enforcement)
        Assert.True(dto.CreatedAt > DateTimeOffset.MinValue,
            "CreatedAt must be a valid DateTimeOffset — NEVER DateTime (architecture enforcement).");
        Assert.True(dto.UpdatedAt > DateTimeOffset.MinValue,
            "UpdatedAt must be a valid DateTimeOffset — NEVER DateTime (architecture enforcement).");

        // Cleanup
        await _client.DeleteAsync($"/api/v1/clientes/{dto.Id}");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-3-API-2 (P0) — POST duplicate NIT returns 409 + Problem Details
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-3-API-2 (P0)
    /// GIVEN a client with a specific NIT already exists in the system
    /// WHEN POST /api/v1/clientes is called a second time with the same NIT
    /// THEN the response status is 409 Conflict and the body contains Problem Details
    ///      with detail "El NIT/RUC ya está registrado" (no stack trace — NFR6)
    /// </summary>
    [Fact]
    public async Task PostCliente_WithDuplicateNit_Returns409WithProblemDetails()
    {
        // GIVEN: A client already exists with a specific NIT
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var sharedNit = $"800{uniqueSuffix % 1_000_000:D6}-2";
        var firstPayload = new
        {
            nombre = "Empresa Original",
            nit = sharedNit,
            telefono = "3109876543",
            ciudad = "Medellín"
        };

        var firstResponse = await _client.PostAsJsonAsync("/api/v1/clientes", firstPayload);
        Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);
        var firstDto = await firstResponse.Content.ReadFromJsonAsync<ClienteDto>();
        Assert.NotNull(firstDto);

        try
        {
            // WHEN: POST /api/v1/clientes is called with the same NIT
            var duplicatePayload = new
            {
                nombre = "Empresa Duplicada",
                nit = sharedNit,
                telefono = "3101112233",
                ciudad = "Cali"
            };

            var response = await _client.PostAsJsonAsync("/api/v1/clientes", duplicatePayload);

            // THEN: Response is 409 Conflict
            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

            // AND: Content-Type is problem+json
            var contentType = response.Content.Headers.ContentType?.MediaType;
            Assert.True(
                contentType == "application/problem+json" || contentType == "application/json",
                $"Expected problem+json or json, got: {contentType}");

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
            // Cleanup
            await _client.DeleteAsync($"/api/v1/clientes/{firstDto!.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-3-API-3 (P1) — POST empty body returns 400 + Problem Details errors
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-3-API-3 (P1)
    /// GIVEN an empty JSON body (no fields provided)
    /// WHEN POST /api/v1/clientes is called
    /// THEN the response status is 400 Bad Request with Problem Details RFC 7807
    ///      and the errors object contains validation errors for all four required fields
    /// </summary>
    [Fact]
    public async Task PostCliente_WithEmptyBody_Returns400WithValidationErrors()
    {
        // GIVEN: Empty payload (no fields)
        var payload = new { };

        // WHEN: POST /api/v1/clientes is called
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);

        // THEN: Response is 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // AND: Body is Problem Details with errors object
        var body = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(body);
        Assert.NotNull(body!.Errors);
        Assert.NotEmpty(body.Errors);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-3-API-4 (P1) — POST with missing Nombre only returns 400
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-3-API-4 (P1)
    /// GIVEN a payload missing only the Nombre field (NIT, Teléfono, Ciudad provided)
    /// WHEN POST /api/v1/clientes is called
    /// THEN the response is 400 Bad Request with an error on the Nombre field
    /// </summary>
    [Fact]
    public async Task PostCliente_WithMissingNombre_Returns400WithNombreError()
    {
        // GIVEN: Payload missing Nombre
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nit = $"700{uniqueSuffix % 1_000_000:D6}-3",
            telefono = "3151234567",
            ciudad = "Barranquilla"
        };

        // WHEN: POST /api/v1/clientes is called
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);

        // THEN: Response is 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // AND: Errors reference the Nombre field
        var body = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(body);
        Assert.NotNull(body!.Errors);
        Assert.True(
            body.Errors.ContainsKey("Nombre") || body.Errors.ContainsKey("nombre"),
            $"Expected 'Nombre' in validation errors. Keys found: {string.Join(", ", body.Errors.Keys)}");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-3-API-5 (P3) — Boundary: 255-char Nombre → 201; 256-char → 400
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-3-API-5a (P3)
    /// GIVEN a payload with Nombre of exactly 255 characters (max boundary)
    /// WHEN POST /api/v1/clientes is called
    /// THEN the response is 201 Created (boundary is inclusive)
    /// </summary>
    [Fact]
    public async Task PostCliente_With255CharNombre_Returns201()
    {
        // GIVEN: Nombre at max boundary (255 chars)
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var nombre255 = new string('A', 250) + "12345"; // exactly 255 chars
        var payload = new
        {
            nombre = nombre255,
            nit = $"600{uniqueSuffix % 1_000_000:D6}-4",
            telefono = "3001112233",
            ciudad = "Cartagena"
        };

        // WHEN: POST /api/v1/clientes is called
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);

        // THEN: Response is 201 Created (255 chars is within MaximumLength(255))
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var dto = await response.Content.ReadFromJsonAsync<ClienteDto>();
        Assert.NotNull(dto);

        // Cleanup
        await _client.DeleteAsync($"/api/v1/clientes/{dto!.Id}");
    }

    /// <summary>
    /// TC-E2-2-3-API-5b (P3)
    /// GIVEN a payload with Nombre of exactly 256 characters (over max boundary)
    /// WHEN POST /api/v1/clientes is called
    /// THEN the response is 400 Bad Request (exceeds MaximumLength(255))
    /// </summary>
    [Fact]
    public async Task PostCliente_With256CharNombre_Returns400()
    {
        // GIVEN: Nombre over max boundary (256 chars)
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var nombre256 = new string('B', 256); // exactly 256 chars
        var payload = new
        {
            nombre = nombre256,
            nit = $"500{uniqueSuffix % 1_000_000:D6}-5",
            telefono = "3009998877",
            ciudad = "Bucaramanga"
        };

        // WHEN: POST /api/v1/clientes is called
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);

        // THEN: Response is 400 Bad Request (exceeds MaximumLength(255))
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response DTOs (match POST /api/v1/clientes JSON shape)
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
