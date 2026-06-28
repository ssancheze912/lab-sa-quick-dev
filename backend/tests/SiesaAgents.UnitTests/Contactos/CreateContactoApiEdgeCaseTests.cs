using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Contactos;

/// <summary>
/// API edge-case integration tests — Story 3.3: Create Contact (automation expansion)
///
/// Covers edge cases NOT in CreateContactoApiTests.cs:
///   POST with whitespace-only Nombre → 400 (FluentValidation NotEmpty trims whitespace)
///   POST with Nombre exactly 255 chars → 201 (boundary: max allowed)
///   POST with Nombre 256 chars → 400 (boundary: one over max)
///   POST with invalid email format → 400 (FluentValidation .EmailAddress())
///   POST with Email exceeding 255 chars → 400 (MaximumLength boundary)
///   POST with Telefono exceeding 50 chars → 400 (MaximumLength boundary)
///   201 response includes Location header pointing to the new resource
///   POST with only one missing field returns 400 with that specific field in errors
/// </summary>
public class CreateContactoApiEdgeCaseTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public CreateContactoApiEdgeCaseTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P2] POST with whitespace-only Nombre → 400 (FluentValidation NotEmpty)
    // FluentValidation's .NotEmpty() trims strings and treats "   " as empty
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] Boundary: whitespace-only Nombre treated as empty by FluentValidation.NotEmpty()
    /// </summary>
    [Fact]
    public async Task PostContacto_WithWhitespaceOnlyNombre_Returns400()
    {
        // GIVEN: Payload with whitespace-only Nombre
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nombre = "   ",
            cargo = "Gerente",
            telefono = $"300{timestamp % 10_000_000:D7}",
            email = $"whitespace.nombre.{timestamp}@empresa.co"
        };

        // WHEN: POST /api/v1/contactos
        var response = await _client.PostAsJsonAsync("/api/v1/contactos", payload);

        // THEN: 400 Bad Request (NotEmpty fails for whitespace)
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // AND: Body has Problem Details with errors on Nombre
        var body = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(body);
        Assert.True(body!.Errors.Count > 0, "Expected validation errors in Problem Details.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P2] POST with Nombre exactly 255 chars → 201 (boundary: max allowed)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] Boundary: Nombre at exactly 255 characters is accepted.
    /// </summary>
    [Fact]
    public async Task PostContacto_WithNombreAt255Chars_Returns201()
    {
        // GIVEN: Nombre is exactly 255 characters (max boundary)
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var nombre255 = new string('A', 255);
        var payload = new
        {
            nombre = nombre255,
            cargo = "Gerente",
            telefono = $"301{timestamp % 10_000_000:D7}",
            email = $"nombre.max.{timestamp}@empresa.co"
        };

        // WHEN: POST /api/v1/contactos
        var response = await _client.PostAsJsonAsync("/api/v1/contactos", payload);

        // THEN: 201 Created (exactly at boundary is valid)
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        // Cleanup
        var body = await response.Content.ReadFromJsonAsync<ContactoDto>();
        if (body is not null)
            await _client.DeleteAsync($"/api/v1/contactos/{body.Id}");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P2] POST with Nombre 256 chars → 400 (boundary: one over max)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] Boundary: Nombre at 256 characters (one over MaximumLength(255)) is rejected.
    /// </summary>
    [Fact]
    public async Task PostContacto_WithNombreAt256Chars_Returns400()
    {
        // GIVEN: Nombre is 256 characters (one over the max boundary)
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var nombre256 = new string('B', 256);
        var payload = new
        {
            nombre = nombre256,
            cargo = "Analista",
            telefono = $"302{timestamp % 10_000_000:D7}",
            email = $"nombre.over.max.{timestamp}@empresa.co"
        };

        // WHEN: POST /api/v1/contactos
        var response = await _client.PostAsJsonAsync("/api/v1/contactos", payload);

        // THEN: 400 Bad Request (exceeds MaximumLength(255))
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(body);
        Assert.True(body!.Errors.Count > 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P2] POST with invalid email format → 400 (FluentValidation .EmailAddress())
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] Boundary: non-empty but malformed email fails FluentValidation .EmailAddress().
    /// </summary>
    [Fact]
    public async Task PostContacto_WithInvalidEmailFormat_Returns400()
    {
        // GIVEN: Payload with a malformed email (not an empty string — tests .EmailAddress() rule)
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nombre = "Juan Pérez",
            cargo = "Gerente",
            telefono = $"303{timestamp % 10_000_000:D7}",
            email = "notanemail"  // non-empty but not a valid email
        };

        // WHEN: POST /api/v1/contactos
        var response = await _client.PostAsJsonAsync("/api/v1/contactos", payload);

        // THEN: 400 Bad Request (EmailAddress validation fails)
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(body);
        Assert.True(body!.Errors.Count > 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P2] POST with Email exceeding 255 chars → 400 (MaximumLength boundary)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] Boundary: email local-part exceeds MaximumLength(255) — entire field over limit.
    /// </summary>
    [Fact]
    public async Task PostContacto_WithEmailExceeding255Chars_Returns400()
    {
        // GIVEN: Email with local-part padded to exceed 255 total chars
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var localPart = new string('a', 250);
        var payload = new
        {
            nombre = "María López",
            cargo = "Directora",
            telefono = $"304{timestamp % 10_000_000:D7}",
            email = $"{localPart}@empresa.co" // > 255 chars total
        };

        // WHEN: POST /api/v1/contactos
        var response = await _client.PostAsJsonAsync("/api/v1/contactos", payload);

        // THEN: 400 Bad Request (exceeds MaximumLength(255) on Email)
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(body);
        Assert.True(body!.Errors.Count > 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P2] POST with Telefono exceeding 50 chars → 400 (MaximumLength boundary)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] Boundary: Telefono at 51 characters (one over MaximumLength(50)) is rejected.
    /// </summary>
    [Fact]
    public async Task PostContacto_WithTelefonoExceeding50Chars_Returns400()
    {
        // GIVEN: Telefono with 51 digits (one over max)
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var longTelefono = new string('9', 51);
        var payload = new
        {
            nombre = "Ana Gómez",
            cargo = "Analista",
            telefono = longTelefono,
            email = $"telefono.long.{timestamp}@empresa.co"
        };

        // WHEN: POST /api/v1/contactos
        var response = await _client.PostAsJsonAsync("/api/v1/contactos", payload);

        // THEN: 400 Bad Request (exceeds MaximumLength(50))
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(body);
        Assert.True(body!.Errors.Count > 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P1] 201 response includes Location header pointing to the new resource
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P1] Results.Created() sets Location header to /api/v1/contactos/{id} (RFC 7231 §6.3.2).
    /// </summary>
    [Fact]
    public async Task PostContacto_WithValidPayload_Returns201WithLocationHeader()
    {
        // GIVEN: A valid contact payload
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nombre = $"Location Header Test {timestamp}",
            cargo = "Gerente",
            telefono = $"305{timestamp % 10_000_000:D7}",
            email = $"location.header.{timestamp}@empresa.co"
        };

        // WHEN: POST /api/v1/contactos
        var response = await _client.PostAsJsonAsync("/api/v1/contactos", payload);

        // THEN: 201 Created
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        // AND: Location header is present and points to the new resource
        Assert.NotNull(response.Headers.Location);
        Assert.Contains("/api/v1/contactos/", response.Headers.Location!.ToString());

        // Cleanup
        var body = await response.Content.ReadFromJsonAsync<ContactoDto>();
        if (body is not null)
            await _client.DeleteAsync($"/api/v1/contactos/{body.Id}");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P1] POST with only Nombre missing → 400 with Nombre in errors object
    // (single-field missing — verifies field-level error targeting)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P1] Single missing field: only Nombre is null — errors object contains Nombre key.
    /// </summary>
    [Fact]
    public async Task PostContacto_WithOnlyNombreMissing_Returns400WithNombreError()
    {
        // GIVEN: Payload with only Nombre null
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nombre = (string?)null,
            cargo = "Gerente",
            telefono = $"306{timestamp % 10_000_000:D7}",
            email = $"single.missing.{timestamp}@empresa.co"
        };

        // WHEN: POST /api/v1/contactos
        var response = await _client.PostAsJsonAsync("/api/v1/contactos", payload);

        // THEN: 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // AND: errors object contains at least Nombre
        var body = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(body);
        Assert.True(body!.Errors.Count > 0);
        // Nombre should be in errors (case-insensitive lookup for resilience)
        var hasNombreError = body.Errors.Keys.Any(k => k.Equals("Nombre", StringComparison.OrdinalIgnoreCase));
        Assert.True(hasNombreError, "Expected 'Nombre' key in errors object when Nombre is null.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P1] POST with only Email missing → 400 with Email in errors object
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P1] Single missing field: only Email is null — errors object contains Email key.
    /// </summary>
    [Fact]
    public async Task PostContacto_WithOnlyEmailMissing_Returns400WithEmailError()
    {
        // GIVEN: Payload with only Email null
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nombre = "Carlos Torres",
            cargo = "Director",
            telefono = $"307{timestamp % 10_000_000:D7}",
            email = (string?)null
        };

        // WHEN: POST /api/v1/contactos
        var response = await _client.PostAsJsonAsync("/api/v1/contactos", payload);

        // THEN: 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // AND: errors object contains Email
        var body = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(body);
        Assert.True(body!.Errors.Count > 0);
        var hasEmailError = body.Errors.Keys.Any(k => k.Equals("Email", StringComparison.OrdinalIgnoreCase));
        Assert.True(hasEmailError, "Expected 'Email' key in errors object when Email is null.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response DTOs (matching POST and GET JSON shape)
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
