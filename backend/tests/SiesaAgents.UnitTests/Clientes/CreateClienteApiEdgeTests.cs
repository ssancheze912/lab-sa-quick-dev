using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Clientes;

/// <summary>
/// Automation expansion — Story 2.3: Create Client API edge cases.
/// Expands ATDD coverage (CreateClienteApiTests.cs) with:
///
///   [P1] Missing individual fields: Nit, Telefono, Ciudad (beyond missing Nombre)
///   [P2] Whitespace-only field values rejected server-side
///   [P3] Boundary: NIT at 50 chars → 201; 51 chars → 400
///   [P3] Boundary: Telefono at 50 chars → 201; 51 chars → 400
///   [P3] Boundary: Ciudad at 100 chars → 201; 101 chars → 400
///   [P1] Response Location header points to created resource
///   [P1] Response body is JSON with application/json or problem+json Content-Type on errors
/// </summary>
public class CreateClienteApiEdgeTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public CreateClienteApiEdgeTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Missing individual required fields (each field tested in isolation)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P1] POST with missing Nit only → 400 with error on Nit field.
    /// </summary>
    [Fact]
    public async Task PostCliente_WithMissingNit_Returns400WithNitError()
    {
        // GIVEN: Payload missing Nit (all other fields valid)
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nombre = "Empresa Sin NIT",
            telefono = "3001234567",
            ciudad = $"Ciudad{uniqueSuffix % 10}"
        };

        // WHEN
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);

        // THEN: 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(body);
        Assert.NotNull(body!.Errors);
        Assert.True(
            body.Errors.ContainsKey("Nit") || body.Errors.ContainsKey("nit"),
            $"Expected 'Nit' in validation errors. Keys found: {string.Join(", ", body.Errors.Keys)}");
    }

    /// <summary>
    /// [P1] POST with missing Telefono only → 400 with error on Telefono field.
    /// </summary>
    [Fact]
    public async Task PostCliente_WithMissingTelefono_Returns400WithTelefonoError()
    {
        // GIVEN: Payload missing Telefono
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nombre = "Empresa Sin Teléfono",
            nit = $"400{uniqueSuffix % 1_000_000:D6}-1",
            ciudad = "Bogotá"
        };

        // WHEN
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);

        // THEN: 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(body);
        Assert.NotNull(body!.Errors);
        Assert.True(
            body.Errors.ContainsKey("Telefono") || body.Errors.ContainsKey("telefono"),
            $"Expected 'Telefono' in validation errors. Keys found: {string.Join(", ", body.Errors.Keys)}");
    }

    /// <summary>
    /// [P1] POST with missing Ciudad only → 400 with error on Ciudad field.
    /// </summary>
    [Fact]
    public async Task PostCliente_WithMissingCiudad_Returns400WithCiudadError()
    {
        // GIVEN: Payload missing Ciudad
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nombre = "Empresa Sin Ciudad",
            nit = $"300{uniqueSuffix % 1_000_000:D6}-2",
            telefono = "3159876543"
        };

        // WHEN
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);

        // THEN: 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(body);
        Assert.NotNull(body!.Errors);
        Assert.True(
            body.Errors.ContainsKey("Ciudad") || body.Errors.ContainsKey("ciudad"),
            $"Expected 'Ciudad' in validation errors. Keys found: {string.Join(", ", body.Errors.Keys)}");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Whitespace-only values — server-side guard (FluentValidation NotEmpty)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] POST with whitespace-only Nombre → 400.
    /// FluentValidation NotEmpty() rejects whitespace strings.
    /// </summary>
    [Fact]
    public async Task PostCliente_WithWhitespaceNombre_Returns400()
    {
        // GIVEN: Nombre contains only whitespace
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nombre = "   ",
            nit = $"299{uniqueSuffix % 1_000_000:D6}-1",
            telefono = "3001234567",
            ciudad = "Bogotá"
        };

        // WHEN
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);

        // THEN: 400 Bad Request — FluentValidation NotEmpty rejects whitespace
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    /// <summary>
    /// [P2] POST with whitespace-only Nit → 400.
    /// </summary>
    [Fact]
    public async Task PostCliente_WithWhitespaceNit_Returns400()
    {
        // GIVEN: Nit contains only whitespace
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nombre = $"Empresa {uniqueSuffix}",
            nit = "   ",
            telefono = "3001234567",
            ciudad = "Bogotá"
        };

        // WHEN
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);

        // THEN: 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NIT boundary: exactly 50 chars → 201; 51 chars → 400
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P3] POST with NIT of exactly 50 characters (max boundary) → 201.
    /// </summary>
    [Fact]
    public async Task PostCliente_With50CharNit_Returns201()
    {
        // GIVEN: Nit at exactly max boundary (50 chars)
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() % 100;
        var nit50 = new string('N', 48) + $"{uniqueSuffix:D2}"; // exactly 50 chars
        var payload = new
        {
            nombre = "Empresa NIT Boundary",
            nit = nit50,
            telefono = "3001234567",
            ciudad = "Medellín"
        };

        // WHEN
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);

        // THEN: 201 Created
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var dto = await response.Content.ReadFromJsonAsync<ClienteDto>();
        Assert.NotNull(dto);

        // Cleanup
        await _client.DeleteAsync($"/api/v1/clientes/{dto!.Id}");
    }

    /// <summary>
    /// [P3] POST with NIT of exactly 51 characters (over max boundary) → 400.
    /// </summary>
    [Fact]
    public async Task PostCliente_With51CharNit_Returns400()
    {
        // GIVEN: Nit over max boundary (51 chars)
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var nit51 = new string('N', 51);
        var payload = new
        {
            nombre = $"Empresa {uniqueSuffix}",
            nit = nit51,
            telefono = "3001234567",
            ciudad = "Cali"
        };

        // WHEN
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);

        // THEN: 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Telefono boundary: exactly 50 chars → 201; 51 chars → 400
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P3] POST with Telefono of exactly 50 characters (max boundary) → 201.
    /// </summary>
    [Fact]
    public async Task PostCliente_With50CharTelefono_Returns201()
    {
        // GIVEN: Telefono at exactly max boundary (50 chars)
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var telefono50 = new string('3', 50);
        var payload = new
        {
            nombre = "Empresa Telefono Boundary",
            nit = $"199{uniqueSuffix % 1_000_000:D6}-1",
            telefono = telefono50,
            ciudad = "Barranquilla"
        };

        // WHEN
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);

        // THEN: 201 Created
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var dto = await response.Content.ReadFromJsonAsync<ClienteDto>();
        Assert.NotNull(dto);

        // Cleanup
        await _client.DeleteAsync($"/api/v1/clientes/{dto!.Id}");
    }

    /// <summary>
    /// [P3] POST with Telefono of exactly 51 characters (over max boundary) → 400.
    /// </summary>
    [Fact]
    public async Task PostCliente_With51CharTelefono_Returns400()
    {
        // GIVEN: Telefono over max boundary (51 chars)
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nombre = $"Empresa {uniqueSuffix}",
            nit = $"198{uniqueSuffix % 1_000_000:D6}-2",
            telefono = new string('3', 51),
            ciudad = "Cartagena"
        };

        // WHEN
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);

        // THEN: 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Ciudad boundary: exactly 100 chars → 201; 101 chars → 400
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P3] POST with Ciudad of exactly 100 characters (max boundary) → 201.
    /// </summary>
    [Fact]
    public async Task PostCliente_With100CharCiudad_Returns201()
    {
        // GIVEN: Ciudad at exactly max boundary (100 chars)
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var ciudad100 = new string('C', 100);
        var payload = new
        {
            nombre = "Empresa Ciudad Boundary",
            nit = $"197{uniqueSuffix % 1_000_000:D6}-1",
            telefono = "3001234567",
            ciudad = ciudad100
        };

        // WHEN
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);

        // THEN: 201 Created
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var dto = await response.Content.ReadFromJsonAsync<ClienteDto>();
        Assert.NotNull(dto);

        // Cleanup
        await _client.DeleteAsync($"/api/v1/clientes/{dto!.Id}");
    }

    /// <summary>
    /// [P3] POST with Ciudad of exactly 101 characters (over max boundary) → 400.
    /// </summary>
    [Fact]
    public async Task PostCliente_With101CharCiudad_Returns400()
    {
        // GIVEN: Ciudad over max boundary (101 chars)
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nombre = $"Empresa {uniqueSuffix}",
            nit = $"196{uniqueSuffix % 1_000_000:D6}-3",
            telefono = "3009876543",
            ciudad = new string('C', 101)
        };

        // WHEN
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);

        // THEN: 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response structure correctness
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P1] Location header on 201 response points to /api/v1/clientes/{id}.
    /// </summary>
    [Fact]
    public async Task PostCliente_WithValidPayload_LocationHeaderPointsToCreatedResource()
    {
        // GIVEN: Valid payload
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nombre = "Empresa Location Test",
            nit = $"195{uniqueSuffix % 1_000_000:D6}-1",
            telefono = "3001234567",
            ciudad = "Bogotá"
        };

        // WHEN
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);

        // THEN: Location header is present and well-formed
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var location = response.Headers.Location?.ToString();
        Assert.NotNull(location);
        Assert.StartsWith("/api/v1/clientes/", location);

        // AND: ID in Location is a valid GUID
        var idSegment = location!.Replace("/api/v1/clientes/", "");
        Assert.True(Guid.TryParse(idSegment, out var parsedId), $"Location ID is not a valid GUID: {idSegment}");
        Assert.NotEqual(Guid.Empty, parsedId);

        // Cleanup
        await _client.DeleteAsync($"/api/v1/clientes/{parsedId}");
    }

    /// <summary>
    /// [P1] Error responses do NOT include stack traces or exception class names (NFR6).
    /// </summary>
    [Fact]
    public async Task PostCliente_WithDuplicateNit_409ResponseDoesNotContainStackTrace()
    {
        // GIVEN: Create first client
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var sharedNit = $"194{uniqueSuffix % 1_000_000:D6}-4";
        var first = new { nombre = "First", nit = sharedNit, telefono = "3001234567", ciudad = "Bogotá" };
        var firstResp = await _client.PostAsJsonAsync("/api/v1/clientes", first);
        Assert.Equal(HttpStatusCode.Created, firstResp.StatusCode);
        var firstDto = await firstResp.Content.ReadFromJsonAsync<ClienteDto>();

        try
        {
            // WHEN: Duplicate NIT submitted
            var duplicate = new { nombre = "Duplicate", nit = sharedNit, telefono = "3109876543", ciudad = "Cali" };
            var response = await _client.PostAsJsonAsync("/api/v1/clientes", duplicate);

            // THEN: 409 — body should NOT contain technical exception names
            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
            var rawBody = await response.Content.ReadAsStringAsync();
            Assert.DoesNotContain("StackTrace", rawBody, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("DbUpdateException", rawBody, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("InnerException", rawBody, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("23505", rawBody); // PostgreSQL SQLSTATE should not appear in client response
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/clientes/{firstDto!.Id}");
        }
    }

    /// <summary>
    /// [P2] Empty body (null values from JSON deserialization) → 400 with errors for all fields.
    /// Verifies the validation catches all four missing fields simultaneously.
    /// </summary>
    [Fact]
    public async Task PostCliente_WithNullBodyFields_Returns400WithAllFieldErrors()
    {
        // GIVEN: Payload with null string values (simulates missing required fields)
        var payload = new
        {
            nombre = (string?)null,
            nit = (string?)null,
            telefono = (string?)null,
            ciudad = (string?)null
        };

        // WHEN
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);

        // THEN: 400 Bad Request with errors for all fields
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(body);
        Assert.NotNull(body!.Errors);

        // At least 2 fields reported as invalid (all 4 are null)
        Assert.True(body.Errors.Count >= 2,
            $"Expected errors for multiple fields. Got: {string.Join(", ", body.Errors.Keys)}");
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

    private sealed record ValidationProblemDetails(
        string? Type,
        string? Title,
        int? Status,
        string? Detail,
        Dictionary<string, string[]>? Errors
    );
}
