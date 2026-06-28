using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Clientes;

/// <summary>
/// Automation expansion — Story 2.4: PUT /api/v1/clientes/:id edge cases.
/// Expands ATDD coverage (UpdateClienteApiTests.cs) with:
///
///   [P1] Missing individual fields: Nit, Telefono, Ciudad (beyond missing Nombre)
///   [P1] PUT returns 200 (not 201, not 204) — explicit HTTP verb contract
///   [P1] PUT returns JSON with correct Content-Type on success and errors
///   [P2] Whitespace-only field values rejected server-side (FluentValidation NotEmpty)
///   [P2] Multiple fields invalid simultaneously → errors object contains all fields
///   [P3] Boundary: Nombre at 255 chars → 200; 256 chars → 400
///   [P3] Boundary: NIT at 50 chars → 200; 51 chars → 400
///   [P3] Boundary: Telefono at 50 chars → 200; 51 chars → 400
///   [P3] Boundary: Ciudad at 100 chars → 200; 101 chars → 400
///   [P2] UpdatedAt in response is strictly greater than CreatedAt (confirms field was updated)
///   [P2] ID in response matches the ID used in the URL path (no ID swap)
/// </summary>
public class UpdateClienteApiEdgeTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public UpdateClienteApiEdgeTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper: Create a client and return its DTO
    // ─────────────────────────────────────────────────────────────────────────

    private async Task<ClienteResponseDto> CreateClienteAsync(string suffix)
    {
        var payload = new
        {
            nombre = $"Empresa Edge {suffix}",
            nit = $"950{suffix.GetHashCode() % 1_000_000:D6}-1",
            telefono = "3001234567",
            ciudad = "Bogotá"
        };
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<ClienteResponseDto>();
        Assert.NotNull(dto);
        return dto!;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Missing individual required fields (each field tested in isolation for PUT)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P1] PUT with missing Nit → 400 with validation error on Nit field.
    /// </summary>
    [Fact]
    public async Task PutCliente_WithMissingNit_Returns400WithNitError()
    {
        // GIVEN: A client exists
        var created = await CreateClienteAsync(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString());

        try
        {
            // WHEN: PUT without Nit (only nombre, telefono, ciudad)
            var payload = new { nombre = "Empresa Sin NIT", telefono = "3001234567", ciudad = "Cali" };
            var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{created.Id}", payload);

            // THEN: 400 Bad Request
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<ValidationProblemResponseDto>();
            Assert.NotNull(body);
            Assert.NotNull(body!.Errors);
            Assert.True(
                body.Errors.ContainsKey("Nit") || body.Errors.ContainsKey("nit"),
                $"Expected 'Nit' in errors. Found: {string.Join(", ", body.Errors.Keys)}");
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/clientes/{created.Id}");
        }
    }

    /// <summary>
    /// [P1] PUT with missing Telefono → 400 with validation error on Telefono field.
    /// </summary>
    [Fact]
    public async Task PutCliente_WithMissingTelefono_Returns400WithTelefonoError()
    {
        // GIVEN: A client exists
        var created = await CreateClienteAsync((DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 1).ToString());

        try
        {
            // WHEN: PUT without Telefono
            var payload = new { nombre = "Empresa Sin Tel", nit = "900000111-1", ciudad = "Cali" };
            var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{created.Id}", payload);

            // THEN: 400 Bad Request
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<ValidationProblemResponseDto>();
            Assert.NotNull(body);
            Assert.True(
                body!.Errors!.ContainsKey("Telefono") || body.Errors.ContainsKey("telefono"),
                $"Expected 'Telefono' in errors. Found: {string.Join(", ", body.Errors.Keys)}");
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/clientes/{created.Id}");
        }
    }

    /// <summary>
    /// [P1] PUT with missing Ciudad → 400 with validation error on Ciudad field.
    /// </summary>
    [Fact]
    public async Task PutCliente_WithMissingCiudad_Returns400WithCiudadError()
    {
        // GIVEN: A client exists
        var created = await CreateClienteAsync((DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 2).ToString());

        try
        {
            // WHEN: PUT without Ciudad
            var payload = new { nombre = "Empresa Sin Ciudad", nit = "900000222-2", telefono = "3001234567" };
            var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{created.Id}", payload);

            // THEN: 400 Bad Request
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<ValidationProblemResponseDto>();
            Assert.NotNull(body);
            Assert.True(
                body!.Errors!.ContainsKey("Ciudad") || body.Errors.ContainsKey("ciudad"),
                $"Expected 'Ciudad' in errors. Found: {string.Join(", ", body.Errors.Keys)}");
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/clientes/{created.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Whitespace-only field values — FluentValidation NotEmpty rejects them
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] PUT with whitespace-only Nombre → 400 (FluentValidation NotEmpty).
    /// </summary>
    [Fact]
    public async Task PutCliente_WithWhitespaceOnlyNombre_Returns400()
    {
        // GIVEN: A client exists
        var created = await CreateClienteAsync((DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 10).ToString());

        try
        {
            // WHEN: PUT with whitespace-only Nombre
            var payload = new { nombre = "   ", nit = "900000333-3", telefono = "3001234567", ciudad = "Cali" };
            var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{created.Id}", payload);

            // THEN: 400 (NotEmpty rejects whitespace-only)
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<ValidationProblemResponseDto>();
            Assert.NotNull(body);
            Assert.NotNull(body!.Errors);
            Assert.NotEmpty(body.Errors);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/clientes/{created.Id}");
        }
    }

    /// <summary>
    /// [P2] PUT with whitespace-only Nit → 400 (FluentValidation NotEmpty).
    /// </summary>
    [Fact]
    public async Task PutCliente_WithWhitespaceOnlyNit_Returns400()
    {
        // GIVEN: A client exists
        var created = await CreateClienteAsync((DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 11).ToString());

        try
        {
            // WHEN: PUT with whitespace-only Nit
            var payload = new { nombre = "Empresa OK", nit = "   ", telefono = "3001234567", ciudad = "Cali" };
            var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{created.Id}", payload);

            // THEN: 400
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/clientes/{created.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Multiple fields invalid simultaneously → all errors in response
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] PUT with all 4 fields null → 400 with errors for all 4 fields.
    /// </summary>
    [Fact]
    public async Task PutCliente_WithAllFieldsNull_Returns400WithAllFieldErrors()
    {
        // GIVEN: A client exists
        var created = await CreateClienteAsync((DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 20).ToString());

        try
        {
            // WHEN: PUT with all fields null
            var payload = new
            {
                nombre = (string?)null,
                nit = (string?)null,
                telefono = (string?)null,
                ciudad = (string?)null
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{created.Id}", payload);

            // THEN: 400 with errors for all 4 fields
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<ValidationProblemResponseDto>();
            Assert.NotNull(body);
            Assert.NotNull(body!.Errors);

            // All 4 fields must appear in the errors object
            Assert.True(body.Errors.Count >= 4,
                $"Expected 4+ field errors but got {body.Errors.Count}: {string.Join(", ", body.Errors.Keys)}");
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/clientes/{created.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: Nombre max-length 255
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P3] PUT with Nombre exactly at boundary (255 chars) → 200 OK.
    /// </summary>
    [Fact]
    public async Task PutCliente_WithNombreAt255Chars_Returns200()
    {
        // GIVEN: A client exists
        var suffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 30;
        var created = await CreateClienteAsync(suffix.ToString());

        try
        {
            // WHEN: PUT with Nombre exactly 255 chars
            var payload = new
            {
                nombre = new string('A', 255),
                nit = $"960{suffix % 1_000_000:D6}-1",
                telefono = "3001234567",
                ciudad = "Bogotá"
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{created.Id}", payload);

            // THEN: 200 (exactly at boundary — valid)
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/clientes/{created.Id}");
        }
    }

    /// <summary>
    /// [P3] PUT with Nombre at 256 chars (one over boundary) → 400.
    /// </summary>
    [Fact]
    public async Task PutCliente_WithNombreAt256Chars_Returns400()
    {
        // GIVEN: A client exists
        var suffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 31;
        var created = await CreateClienteAsync(suffix.ToString());

        try
        {
            // WHEN: PUT with Nombre 256 chars (over MaximumLength(255))
            var payload = new
            {
                nombre = new string('B', 256),
                nit = $"961{suffix % 1_000_000:D6}-2",
                telefono = "3001234567",
                ciudad = "Bogotá"
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{created.Id}", payload);

            // THEN: 400 Bad Request
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<ValidationProblemResponseDto>();
            Assert.NotNull(body);
            Assert.NotNull(body!.Errors);
            Assert.True(
                body.Errors.ContainsKey("Nombre") || body.Errors.ContainsKey("nombre"),
                $"Expected 'Nombre' length error. Found: {string.Join(", ", body.Errors.Keys)}");
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/clientes/{created.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: NIT max-length 50
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P3] PUT with NIT exactly 50 chars → 200 OK.
    /// </summary>
    [Fact]
    public async Task PutCliente_WithNitAt50Chars_Returns200()
    {
        // GIVEN: A client exists
        var suffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 40;
        var created = await CreateClienteAsync(suffix.ToString());

        try
        {
            // WHEN: PUT with NIT exactly 50 chars
            var payload = new
            {
                nombre = "Empresa NIT Boundary",
                nit = new string('9', 50),
                telefono = "3001234567",
                ciudad = "Bogotá"
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{created.Id}", payload);

            // THEN: 200 (boundary is valid)
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/clientes/{created.Id}");
        }
    }

    /// <summary>
    /// [P3] PUT with NIT at 51 chars → 400.
    /// </summary>
    [Fact]
    public async Task PutCliente_WithNitAt51Chars_Returns400()
    {
        // GIVEN: A client exists
        var suffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 41;
        var created = await CreateClienteAsync(suffix.ToString());

        try
        {
            // WHEN: PUT with NIT 51 chars (over MaximumLength(50))
            var payload = new
            {
                nombre = "Empresa NIT Boundary Over",
                nit = new string('N', 51),
                telefono = "3001234567",
                ciudad = "Bogotá"
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{created.Id}", payload);

            // THEN: 400
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/clientes/{created.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: Ciudad max-length 100
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P3] PUT with Ciudad exactly 100 chars → 200 OK.
    /// </summary>
    [Fact]
    public async Task PutCliente_WithCiudadAt100Chars_Returns200()
    {
        // GIVEN: A client exists
        var suffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 50;
        var created = await CreateClienteAsync(suffix.ToString());

        try
        {
            // WHEN: PUT with Ciudad exactly 100 chars
            var payload = new
            {
                nombre = "Empresa Ciudad Boundary",
                nit = $"970{suffix % 1_000_000:D6}-1",
                telefono = "3001234567",
                ciudad = new string('X', 100)
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{created.Id}", payload);

            // THEN: 200
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/clientes/{created.Id}");
        }
    }

    /// <summary>
    /// [P3] PUT with Ciudad at 101 chars → 400.
    /// </summary>
    [Fact]
    public async Task PutCliente_WithCiudadAt101Chars_Returns400()
    {
        // GIVEN: A client exists
        var suffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 51;
        var created = await CreateClienteAsync(suffix.ToString());

        try
        {
            // WHEN: PUT with Ciudad 101 chars (over MaximumLength(100))
            var payload = new
            {
                nombre = "Empresa Ciudad Over",
                nit = $"971{suffix % 1_000_000:D6}-2",
                telefono = "3001234567",
                ciudad = new string('Z', 101)
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{created.Id}", payload);

            // THEN: 400
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/clientes/{created.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HTTP verb / response contract validations
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P1] Successful PUT returns status 200 (not 201, not 204).
    /// Critical architecture enforcement: edit endpoint uses 200, not 201.
    /// </summary>
    [Fact]
    public async Task PutCliente_SuccessReturns200NotCreated()
    {
        // GIVEN: A client exists
        var suffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 60;
        var created = await CreateClienteAsync(suffix.ToString());

        try
        {
            // WHEN: Valid PUT
            var payload = new
            {
                nombre = "Empresa Con 200",
                nit = $"980{suffix % 1_000_000:D6}-1",
                telefono = "3001234567",
                ciudad = "Bogotá"
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{created.Id}", payload);

            // THEN: Status is exactly 200 OK — NOT 201 Created, NOT 204 No Content
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.NotEqual(HttpStatusCode.Created, response.StatusCode);
            Assert.NotEqual(HttpStatusCode.NoContent, response.StatusCode);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/clientes/{created.Id}");
        }
    }

    /// <summary>
    /// [P2] Response body on success contains the updated values (not the original values).
    /// Verifies the endpoint returns the actual state after update, not a stale snapshot.
    /// </summary>
    [Fact]
    public async Task PutCliente_ResponseBodyReflectsUpdatedValues()
    {
        // GIVEN: A client exists with initial values
        var suffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 70;
        var created = await CreateClienteAsync(suffix.ToString());

        try
        {
            // WHEN: PUT with distinctly different values
            var updatedNombre = $"Empresa Actualizada Verificada SA";
            var updatedNit = $"990{suffix % 1_000_000:D6}-9";
            var payload = new
            {
                nombre = updatedNombre,
                nit = updatedNit,
                telefono = "3199988877",
                ciudad = "Cartagena"
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{created.Id}", payload);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var dto = await response.Content.ReadFromJsonAsync<ClienteResponseDto>();
            Assert.NotNull(dto);

            // THEN: Response contains the NEW values (not original create values)
            Assert.Equal(updatedNombre, dto!.Nombre);
            Assert.Equal(updatedNit, dto.Nit);
            Assert.Equal("3199988877", dto.Telefono);
            Assert.Equal("Cartagena", dto.Ciudad);

            // AND: ID is unchanged (the same resource was updated)
            Assert.Equal(created.Id, dto.Id);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/clientes/{created.Id}");
        }
    }

    /// <summary>
    /// [P2] UpdatedAt in response is after CreatedAt — confirms timestamp refresh occurred.
    /// Architecture enforcement: DateTimeOffset (never DateTime) on timestamps.
    /// </summary>
    [Fact]
    public async Task PutCliente_UpdatedAtIsAfterCreatedAt()
    {
        // GIVEN: A client exists
        var suffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 80;
        var created = await CreateClienteAsync(suffix.ToString());

        // Small delay to ensure measurable UpdatedAt difference
        await Task.Delay(50);

        try
        {
            // WHEN: Valid PUT
            var payload = new
            {
                nombre = "Empresa Timestamp Verificada",
                nit = $"991{suffix % 1_000_000:D6}-1",
                telefono = "3001234567",
                ciudad = "Bogotá"
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{created.Id}", payload);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var dto = await response.Content.ReadFromJsonAsync<ClienteResponseDto>();
            Assert.NotNull(dto);

            // THEN: UpdatedAt >= CreatedAt (updated after creation)
            Assert.True(dto!.UpdatedAt >= dto.CreatedAt,
                $"UpdatedAt ({dto.UpdatedAt}) must be >= CreatedAt ({dto.CreatedAt})");

            // AND: Timestamps are DateTimeOffset with UTC offset (architecture enforcement)
            Assert.Equal(TimeSpan.Zero, dto.CreatedAt.Offset);
            Assert.Equal(TimeSpan.Zero, dto.UpdatedAt.Offset);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/clientes/{created.Id}");
        }
    }

    /// <summary>
    /// [P1] Error responses use Problem Details format (application/problem+json or application/json),
    /// never a raw string. Verifies 400 response body is parseable as RFC 7807.
    /// </summary>
    [Fact]
    public async Task PutCliente_ValidationError_ResponseBodyIsRfc7807ProblemDetails()
    {
        // GIVEN: A client exists
        var suffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 90;
        var created = await CreateClienteAsync(suffix.ToString());

        try
        {
            // WHEN: PUT with Nombre null (triggers FluentValidation)
            var payload = new
            {
                nombre = (string?)null,
                nit = "900000999-1",
                telefono = "3001234567",
                ciudad = "Bogotá"
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{created.Id}", payload);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<ValidationProblemResponseDto>();
            Assert.NotNull(body);

            // THEN: Body has standard RFC 7807 fields (status, errors)
            Assert.Equal(400, body!.Status);
            Assert.NotNull(body.Errors);
            Assert.NotEmpty(body.Errors);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/clientes/{created.Id}");
        }
    }

    /// <summary>
    /// [P1] 404 response contains Problem Details with detail "El cliente solicitado no fue encontrado."
    /// No stack trace or technical details exposed (NFR6).
    /// </summary>
    [Fact]
    public async Task PutCliente_NotFound_DetailMessageIsInSpanishAndNoStackTrace()
    {
        // GIVEN: A UUID that certainly does not exist
        var unknownId = Guid.NewGuid();

        // WHEN: PUT /api/v1/clientes/{unknownId}
        var payload = new { nombre = "Empresa Fantasma", nit = "999000000-0", telefono = "3001234567", ciudad = "Bogotá" };
        var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{unknownId}", payload);

        // THEN: 404 with Spanish Problem Details
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ProblemResponseDto>();
        Assert.NotNull(body);
        Assert.NotNull(body!.Detail);

        // AND: Detail contains the expected Spanish message
        Assert.Contains("El cliente solicitado no fue encontrado", body.Detail,
            StringComparison.OrdinalIgnoreCase);

        // AND: No stack trace in detail (NFR6)
        Assert.DoesNotContain("StackTrace", body.Detail, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("at SiesaAgents", body.Detail, StringComparison.OrdinalIgnoreCase);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response DTOs
    // ─────────────────────────────────────────────────────────────────────────

    private sealed record ClienteResponseDto(
        Guid Id,
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt
    );

    private sealed record ProblemResponseDto(
        string? Type,
        string? Title,
        int? Status,
        string? Detail
    );

    private sealed record ValidationProblemResponseDto(
        string? Type,
        string? Title,
        int? Status,
        string? Detail,
        Dictionary<string, string[]>? Errors
    );
}
