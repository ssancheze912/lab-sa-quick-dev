using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Contactos;

/// <summary>
/// Automation expansion — Story 3.4: PUT /api/v1/contactos/:id edge cases.
/// Expands ATDD coverage (UpdateContactoApiTests.cs) with:
///
///   [P1] PUT with missing Cargo → 400 with Cargo validation error
///   [P1] PUT with missing Telefono → 400 with Telefono validation error
///   [P1] PUT with missing Email → 400 with Email validation error
///   [P1] PUT returns 200 (not 201, not 204) — explicit HTTP verb contract
///   [P1] 404 response contains Spanish Problem Details with no stack trace (NFR6)
///   [P2] PUT with whitespace-only Nombre → 400 (FluentValidation NotEmpty rejects whitespace)
///   [P2] PUT with whitespace-only Cargo → 400
///   [P2] PUT with invalid Email format → 400 with Email validation error
///   [P2] PUT with all 4 fields null simultaneously → 400 with 4 field errors
///   [P2] UpdatedAt in response is after CreatedAt (confirms timestamp refresh — DateTimeOffset)
///   [P2] Response ID matches the URL path ID (no ID swap)
///   [P2] Response body reflects updated values (not stale create-time snapshot)
///   [P3] Nombre boundary: exactly 255 chars → 200 OK
///   [P3] Nombre boundary: 256 chars → 400 Bad Request
///   [P3] Telefono boundary: exactly 50 chars → 200 OK
///   [P3] Telefono boundary: 51 chars → 400 Bad Request
/// </summary>
public class UpdateContactoApiEdgeTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public UpdateContactoApiEdgeTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper: Create a contacto and return its DTO
    // ─────────────────────────────────────────────────────────────────────────

    private async Task<ContactoEdgeResponseDto> CreateContactoAsync(long suffix)
    {
        var payload = new
        {
            nombre = $"Contacto Edge {suffix}",
            cargo = "Analista de Pruebas",
            telefono = "3001234567",
            email = $"edge.{suffix}@empresa.co"
        };
        var response = await _client.PostAsJsonAsync("/api/v1/contactos", payload);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<ContactoEdgeResponseDto>();
        Assert.NotNull(dto);
        return dto!;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Missing individual required fields (each tested in isolation for PUT)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P1] PUT with missing Cargo → 400 with validation error for Cargo field.
    /// </summary>
    [Fact]
    public async Task PutContacto_WithMissingCargo_Returns400WithCargoError()
    {
        // GIVEN: A contacto exists
        var created = await CreateContactoAsync(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());

        try
        {
            // WHEN: PUT without Cargo (only nombre, telefono, email)
            var payload = new
            {
                nombre = "Contacto Sin Cargo",
                telefono = "3001234567",
                email = $"sin.cargo.{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}@empresa.co"
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/contactos/{created.Id}", payload);

            // THEN: 400 Bad Request (FluentValidation NotEmpty on Cargo)
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<ValidationEdgeProblemDetails>();
            Assert.NotNull(body);
            Assert.NotNull(body!.Errors);
            Assert.True(
                body.Errors.ContainsKey("Cargo") || body.Errors.ContainsKey("cargo"),
                $"Expected 'Cargo' in validation errors. Keys found: {string.Join(", ", body.Errors.Keys)}");
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{created.Id}");
        }
    }

    /// <summary>
    /// [P1] PUT with missing Telefono → 400 with validation error for Telefono field.
    /// </summary>
    [Fact]
    public async Task PutContacto_WithMissingTelefono_Returns400WithTelefonoError()
    {
        // GIVEN: A contacto exists
        var created = await CreateContactoAsync(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 1);

        try
        {
            // WHEN: PUT without Telefono
            var payload = new
            {
                nombre = "Contacto Sin Telefono",
                cargo = "Analista",
                email = $"sin.tel.{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}@empresa.co"
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/contactos/{created.Id}", payload);

            // THEN: 400 Bad Request
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<ValidationEdgeProblemDetails>();
            Assert.NotNull(body);
            Assert.True(
                body!.Errors!.ContainsKey("Telefono") || body.Errors.ContainsKey("telefono"),
                $"Expected 'Telefono' in errors. Found: {string.Join(", ", body.Errors.Keys)}");
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{created.Id}");
        }
    }

    /// <summary>
    /// [P1] PUT with missing Email → 400 with validation error for Email field.
    /// </summary>
    [Fact]
    public async Task PutContacto_WithMissingEmail_Returns400WithEmailError()
    {
        // GIVEN: A contacto exists
        var created = await CreateContactoAsync(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 2);

        try
        {
            // WHEN: PUT without Email
            var payload = new
            {
                nombre = "Contacto Sin Email",
                cargo = "Consultor",
                telefono = "3001234567"
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/contactos/{created.Id}", payload);

            // THEN: 400 Bad Request
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<ValidationEdgeProblemDetails>();
            Assert.NotNull(body);
            Assert.True(
                body!.Errors!.ContainsKey("Email") || body.Errors.ContainsKey("email"),
                $"Expected 'Email' in errors. Found: {string.Join(", ", body.Errors.Keys)}");
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{created.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Whitespace-only field values — FluentValidation NotEmpty rejects them
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] PUT with whitespace-only Nombre → 400 (FluentValidation NotEmpty rejects whitespace).
    /// </summary>
    [Fact]
    public async Task PutContacto_WithWhitespaceOnlyNombre_Returns400()
    {
        // GIVEN: A contacto exists
        var created = await CreateContactoAsync(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 10);

        try
        {
            // WHEN: PUT with whitespace-only Nombre
            var payload = new
            {
                nombre = "   ",
                cargo = "Analista",
                telefono = "3001234567",
                email = $"ws.{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}@empresa.co"
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/contactos/{created.Id}", payload);

            // THEN: 400 (NotEmpty rejects whitespace)
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<ValidationEdgeProblemDetails>();
            Assert.NotNull(body);
            Assert.NotNull(body!.Errors);
            Assert.NotEmpty(body.Errors);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{created.Id}");
        }
    }

    /// <summary>
    /// [P2] PUT with whitespace-only Cargo → 400.
    /// </summary>
    [Fact]
    public async Task PutContacto_WithWhitespaceOnlyCargo_Returns400()
    {
        // GIVEN: A contacto exists
        var created = await CreateContactoAsync(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 11);

        try
        {
            // WHEN: PUT with whitespace-only Cargo
            var payload = new
            {
                nombre = "Contacto OK",
                cargo = "   ",
                telefono = "3001234567",
                email = $"ws.cargo.{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}@empresa.co"
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/contactos/{created.Id}", payload);

            // THEN: 400
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{created.Id}");
        }
    }

    /// <summary>
    /// [P2] PUT with invalid Email format (missing @) → 400 with Email validation error.
    /// </summary>
    [Fact]
    public async Task PutContacto_WithInvalidEmailFormat_Returns400WithEmailError()
    {
        // GIVEN: A contacto exists
        var created = await CreateContactoAsync(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 12);

        try
        {
            // WHEN: PUT with malformed Email (no @ sign)
            var payload = new
            {
                nombre = "Contacto Email Invalido",
                cargo = "Analista",
                telefono = "3001234567",
                email = "notanemail"
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/contactos/{created.Id}", payload);

            // THEN: 400 Bad Request (FluentValidation EmailAddress rule)
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<ValidationEdgeProblemDetails>();
            Assert.NotNull(body);
            Assert.True(
                body!.Errors!.ContainsKey("Email") || body.Errors.ContainsKey("email"),
                $"Expected 'Email' in errors. Found: {string.Join(", ", body.Errors.Keys)}");
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{created.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Multiple fields invalid simultaneously → all errors in response
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] PUT with all 4 fields null → 400 with errors for all 4 fields.
    /// Verifies FluentValidation cascade mode produces all errors in a single response.
    /// </summary>
    [Fact]
    public async Task PutContacto_WithAllFieldsNull_Returns400WithAllFourFieldErrors()
    {
        // GIVEN: A contacto exists
        var created = await CreateContactoAsync(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 20);

        try
        {
            // WHEN: PUT with all 4 fields null
            var payload = new
            {
                nombre = (string?)null,
                cargo = (string?)null,
                telefono = (string?)null,
                email = (string?)null
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/contactos/{created.Id}", payload);

            // THEN: 400 with errors for all 4 fields
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<ValidationEdgeProblemDetails>();
            Assert.NotNull(body);
            Assert.NotNull(body!.Errors);
            Assert.True(body.Errors.Count >= 4,
                $"Expected 4+ field errors but got {body.Errors.Count}: {string.Join(", ", body.Errors.Keys)}");
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{created.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HTTP verb / response contract validations
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P1] Successful PUT returns status 200 (NOT 201, NOT 204).
    /// Architecture enforcement: edit endpoint returns 200, NOT 201.
    /// </summary>
    [Fact]
    public async Task PutContacto_Success_Returns200NotCreatedNotNoContent()
    {
        // GIVEN: A contacto exists
        var suffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 30;
        var created = await CreateContactoAsync(suffix);

        try
        {
            // WHEN: Valid PUT
            var payload = new
            {
                nombre = "Contacto Actualizado 200",
                cargo = "Director",
                telefono = "3001234567",
                email = $"ok200.{suffix}@empresa.co"
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/contactos/{created.Id}", payload);

            // THEN: Status is exactly 200 OK — NOT 201 Created, NOT 204 No Content
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.NotEqual(HttpStatusCode.Created, response.StatusCode);
            Assert.NotEqual(HttpStatusCode.NoContent, response.StatusCode);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{created.Id}");
        }
    }

    /// <summary>
    /// [P1] 404 response contains Spanish Problem Details message with no stack trace (NFR6).
    /// </summary>
    [Fact]
    public async Task PutContacto_NotFound_DetailIsSpanishAndNoStackTrace()
    {
        // GIVEN: A UUID that certainly does not exist
        var unknownId = Guid.NewGuid();

        // WHEN: PUT to unknown ID
        var payload = new
        {
            nombre = "Contacto Fantasma",
            cargo = "Cargo Fantasma",
            telefono = "3001234567",
            email = "fantasma@empresa.co"
        };
        var response = await _client.PutAsJsonAsync($"/api/v1/contactos/{unknownId}", payload);

        // THEN: 404 with Spanish Problem Details
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ProblemEdgeDetails>();
        Assert.NotNull(body);
        Assert.NotNull(body!.Detail);

        // AND: Detail contains Spanish message
        Assert.Contains("El contacto solicitado no fue encontrado", body.Detail,
            StringComparison.OrdinalIgnoreCase);

        // AND: No stack trace in detail (NFR6 — no technical details)
        Assert.DoesNotContain("StackTrace", body.Detail, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("at SiesaAgents", body.Detail, StringComparison.OrdinalIgnoreCase);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response body content validations
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] Response body reflects the UPDATED values, not stale create-time values.
    /// </summary>
    [Fact]
    public async Task PutContacto_ResponseBodyReflectsUpdatedValues()
    {
        // GIVEN: A contacto exists with initial values
        var suffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 40;
        var created = await CreateContactoAsync(suffix);

        try
        {
            // WHEN: PUT with distinctly different values
            var updatedNombre = "Contacto Nombre Actualizado Verificado";
            var updatedCargo = "Directora Comercial Actualizada";
            var updatedTelefono = "3199988877";
            var updatedEmail = $"verificado.{suffix}@empresa.co";

            var payload = new
            {
                nombre = updatedNombre,
                cargo = updatedCargo,
                telefono = updatedTelefono,
                email = updatedEmail
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/contactos/{created.Id}", payload);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var dto = await response.Content.ReadFromJsonAsync<ContactoEdgeResponseDto>();
            Assert.NotNull(dto);

            // THEN: Response contains the NEW values (not the original create-time values)
            Assert.Equal(updatedNombre, dto!.Nombre);
            Assert.Equal(updatedCargo, dto.Cargo);
            Assert.Equal(updatedTelefono, dto.Telefono);
            Assert.Equal(updatedEmail, dto.Email);

            // AND: ID is unchanged (same resource was updated — no ID swap)
            Assert.Equal(created.Id, dto.Id);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{created.Id}");
        }
    }

    /// <summary>
    /// [P2] UpdatedAt in response is after CreatedAt (confirms timestamp refresh).
    /// Architecture enforcement: DateTimeOffset (never DateTime) on both timestamps.
    /// </summary>
    [Fact]
    public async Task PutContacto_UpdatedAtIsAfterOrEqualCreatedAt_WithUtcOffset()
    {
        // GIVEN: A contacto exists
        var suffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 50;
        var created = await CreateContactoAsync(suffix);

        // Small delay to ensure measurable UpdatedAt difference
        await Task.Delay(50);

        try
        {
            // WHEN: Valid PUT
            var payload = new
            {
                nombre = "Contacto Timestamp Edge",
                cargo = "Directora",
                telefono = "3001234567",
                email = $"ts.edge.{suffix}@empresa.co"
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/contactos/{created.Id}", payload);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var dto = await response.Content.ReadFromJsonAsync<ContactoEdgeResponseDto>();
            Assert.NotNull(dto);

            // THEN: UpdatedAt >= CreatedAt (updated after creation)
            Assert.True(dto!.UpdatedAt >= dto.CreatedAt,
                $"UpdatedAt ({dto.UpdatedAt}) must be >= CreatedAt ({dto.CreatedAt})");

            // CRITICAL: Timestamps are DateTimeOffset with UTC offset (architecture enforcement — NEVER DateTime)
            Assert.Equal(TimeSpan.Zero, dto.CreatedAt.Offset);
            Assert.Equal(TimeSpan.Zero, dto.UpdatedAt.Offset);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{created.Id}");
        }
    }

    /// <summary>
    /// [P2] Response ID matches the URL path ID (no ID swap — integrity check).
    /// </summary>
    [Fact]
    public async Task PutContacto_ResponseIdMatchesUrlPathId()
    {
        // GIVEN: A contacto exists
        var suffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 60;
        var created = await CreateContactoAsync(suffix);

        try
        {
            // WHEN: Valid PUT
            var payload = new
            {
                nombre = "Contacto ID Check",
                cargo = "Director",
                telefono = "3001234567",
                email = $"id.check.{suffix}@empresa.co"
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/contactos/{created.Id}", payload);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var dto = await response.Content.ReadFromJsonAsync<ContactoEdgeResponseDto>();
            Assert.NotNull(dto);

            // THEN: Response ID matches the URL path ID (same resource, no ID swap)
            Assert.Equal(created.Id, dto!.Id);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{created.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: Nombre max-length 255
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P3] PUT with Nombre exactly at boundary (255 chars) → 200 OK (inclusive boundary).
    /// </summary>
    [Fact]
    public async Task PutContacto_WithNombreAt255Chars_Returns200()
    {
        // GIVEN: A contacto exists
        var suffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 70;
        var created = await CreateContactoAsync(suffix);

        try
        {
            // WHEN: PUT with Nombre exactly 255 chars
            var payload = new
            {
                nombre = new string('N', 255),
                cargo = "Analista",
                telefono = "3001234567",
                email = $"boundary.nom255.{suffix}@empresa.co"
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/contactos/{created.Id}", payload);

            // THEN: 200 OK (255 chars is at the MaximumLength boundary — valid)
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{created.Id}");
        }
    }

    /// <summary>
    /// [P3] PUT with Nombre at 256 chars (one over boundary) → 400 Bad Request.
    /// </summary>
    [Fact]
    public async Task PutContacto_WithNombreAt256Chars_Returns400()
    {
        // GIVEN: A contacto exists
        var suffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 71;
        var created = await CreateContactoAsync(suffix);

        try
        {
            // WHEN: PUT with Nombre 256 chars (exceeds MaximumLength(255))
            var payload = new
            {
                nombre = new string('N', 256),
                cargo = "Analista",
                telefono = "3001234567",
                email = $"boundary.nom256.{suffix}@empresa.co"
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/contactos/{created.Id}", payload);

            // THEN: 400 Bad Request (MaximumLength rule violated)
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<ValidationEdgeProblemDetails>();
            Assert.NotNull(body);
            Assert.True(
                body!.Errors!.ContainsKey("Nombre") || body.Errors.ContainsKey("nombre"),
                $"Expected 'Nombre' length error. Keys: {string.Join(", ", body.Errors.Keys)}");
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{created.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: Telefono max-length 50
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P3] PUT with Telefono exactly at boundary (50 chars) → 200 OK (inclusive boundary).
    /// </summary>
    [Fact]
    public async Task PutContacto_WithTelefonoAt50Chars_Returns200()
    {
        // GIVEN: A contacto exists
        var suffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 80;
        var created = await CreateContactoAsync(suffix);

        try
        {
            // WHEN: PUT with Telefono exactly 50 chars (MaximumLength boundary)
            var payload = new
            {
                nombre = "Contacto Tel Boundary",
                cargo = "Consultor",
                telefono = new string('3', 50),
                email = $"boundary.tel50.{suffix}@empresa.co"
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/contactos/{created.Id}", payload);

            // THEN: 200 OK (exactly at boundary — valid)
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{created.Id}");
        }
    }

    /// <summary>
    /// [P3] PUT with Telefono at 51 chars (one over boundary) → 400 Bad Request.
    /// </summary>
    [Fact]
    public async Task PutContacto_WithTelefonoAt51Chars_Returns400()
    {
        // GIVEN: A contacto exists
        var suffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 81;
        var created = await CreateContactoAsync(suffix);

        try
        {
            // WHEN: PUT with Telefono 51 chars (exceeds MaximumLength(50))
            var payload = new
            {
                nombre = "Contacto Tel Over",
                cargo = "Consultor",
                telefono = new string('3', 51),
                email = $"boundary.tel51.{suffix}@empresa.co"
            };
            var response = await _client.PutAsJsonAsync($"/api/v1/contactos/{created.Id}", payload);

            // THEN: 400 Bad Request
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<ValidationEdgeProblemDetails>();
            Assert.NotNull(body);
            Assert.True(
                body!.Errors!.ContainsKey("Telefono") || body.Errors.ContainsKey("telefono"),
                $"Expected 'Telefono' length error. Keys: {string.Join(", ", body.Errors.Keys)}");
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{created.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response DTOs
    // ─────────────────────────────────────────────────────────────────────────

    private sealed record ContactoEdgeResponseDto(
        Guid Id,
        string Nombre,
        string Cargo,
        string Telefono,
        string Email,
        string? ClienteId,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt
    );

    private sealed record ProblemEdgeDetails(
        string? Type,
        string? Title,
        int? Status,
        string? Detail
    );

    private sealed record ValidationEdgeProblemDetails(
        string? Type,
        string? Title,
        int? Status,
        string? Detail,
        Dictionary<string, string[]>? Errors
    );
}
