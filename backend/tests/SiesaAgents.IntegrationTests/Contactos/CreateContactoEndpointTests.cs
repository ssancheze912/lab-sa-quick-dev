/**
 * API Integration Tests — POST /api/v1/contactos
 * Story 3.3 — Create Contact (ATDD RED phase)
 *
 * Test IDs covered:
 *   TC-E3-P0-07   POST valid payload → 201 Created with ContactoDto (id, nombre, cargo, telefono, email, clienteId null, createdAt ISO 8601 with TZ)
 *   TC-E3-P1-19   POST empty body → 400 Bad Request + Problem Details with field-level errors (no stackTrace)
 *   TC-E3-email-400  POST with invalid email format → 400 + Problem Details (no stackTrace)
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
 *
 * Expected RED failures:
 *   - POST /api/v1/contactos not yet registered → 404 Not Found
 *   - CreateContactoCommandHandler not yet implemented
 *   - FluentValidation validator not yet created
 *
 * Given-When-Then format per test method.
 * Note: No 409 Conflict test — Email is indexed but NOT unique for contacts (story dev notes).
 */

using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Contactos;

/// <summary>
/// Isolated WebApplicationFactory for Story 3.3 create endpoint tests.
/// Each test class instance gets a unique in-memory database name to prevent
/// cross-test data pollution.
/// </summary>
public sealed class CreateContactoWebApplicationFactory : WebApplicationFactory<Program>
{
    public string DatabaseName { get; init; } = $"CreateContactoTestDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove all EF Core configuration services for AppDbContext to avoid
            // "dual provider" errors when swapping to InMemoryDatabase.
            var dbContextOptionsConfigType = typeof(Microsoft.EntityFrameworkCore.Infrastructure.IDbContextOptionsConfiguration<AppDbContext>);
            var toRemove = services
                .Where(d =>
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                    d.ServiceType == typeof(AppDbContext) ||
                    dbContextOptionsConfigType.IsAssignableFrom(d.ServiceType))
                .ToList();

            foreach (var d in toRemove)
                services.Remove(d);

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(DatabaseName));
        });
    }
}

/// <summary>
/// Integration tests for POST /api/v1/contactos endpoint.
/// Each test method that needs isolation creates its own factory with a unique DB name.
/// </summary>
public sealed class CreateContactoEndpointTests
{
    // ---------------------------------------------------------------------------
    // TC-E3-P0-07: POST valid payload → 201 Created with complete ContactoDto
    // ---------------------------------------------------------------------------

    /// <summary>
    /// TC-E3-P0-07 — Given a valid create-contact request body,
    /// When POST /api/v1/contactos is called,
    /// Then returns HTTP 201 Created with a ContactoDto body containing:
    /// id (UUID), nombre, cargo, telefono, email, clienteId (null), createdAt (ISO 8601 with TZ).
    /// And a follow-up GET confirms the record was persisted.
    /// </summary>
    [Fact]
    public async Task TC_E3_P0_07_PostContacto_Returns201_WithCompleteDtoAndPersists()
    {
        // GIVEN: A valid create-contact payload (all 4 required fields present)
        using var factory = new CreateContactoWebApplicationFactory();
        var client = factory.CreateClient();

        var payload = new
        {
            nombre = "Ana García Integration",
            cargo = "Directora Comercial",
            telefono = "3101234567",
            email = "ana.garcia.integration@siesa.com"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: POST /api/v1/contactos is called
        var response = await client.PostAsync("/api/v1/contactos", content);

        // THEN: HTTP 201 Created
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        // THEN: Response body is a ContactoDto (not wrapped)
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: id must be a valid UUID
        Assert.True(doc.RootElement.TryGetProperty("id", out var idProp),
            $"Response must contain 'id' field. Body: {json}");
        Assert.True(Guid.TryParse(idProp.GetString(), out _),
            $"'id' must be a valid UUID but got: {idProp.GetString()}");

        // THEN: nombre matches what was sent
        Assert.True(doc.RootElement.TryGetProperty("nombre", out var nombreProp),
            "Response must contain 'nombre' field");
        Assert.Equal(payload.nombre, nombreProp.GetString());

        // THEN: cargo matches
        Assert.True(doc.RootElement.TryGetProperty("cargo", out var cargoProp),
            "Response must contain 'cargo' field");
        Assert.Equal(payload.cargo, cargoProp.GetString());

        // THEN: telefono matches
        Assert.True(doc.RootElement.TryGetProperty("telefono", out var telefonoProp),
            "Response must contain 'telefono' field");
        Assert.Equal(payload.telefono, telefonoProp.GetString());

        // THEN: email matches
        Assert.True(doc.RootElement.TryGetProperty("email", out var emailProp),
            "Response must contain 'email' field");
        Assert.Equal(payload.email, emailProp.GetString());

        // THEN: clienteId is null (contacts created independently per FR25)
        Assert.True(doc.RootElement.TryGetProperty("clienteId", out var clienteIdProp),
            "Response must contain 'clienteId' field");
        Assert.True(clienteIdProp.ValueKind == JsonValueKind.Null,
            $"'clienteId' must be null on creation but got: {clienteIdProp}");

        // THEN: createdAt is present as ISO 8601 with timezone (DateTimeOffset)
        Assert.True(doc.RootElement.TryGetProperty("createdAt", out var createdAtProp),
            "Response must contain 'createdAt' field");
        var createdAtStr = createdAtProp.GetString();
        Assert.False(string.IsNullOrEmpty(createdAtStr), "'createdAt' must not be empty");
        Assert.True(
            DateTimeOffset.TryParse(createdAtStr, out _),
            $"'createdAt' must be a valid DateTimeOffset ISO 8601 string but got: {createdAtStr}"
        );
        Assert.True(
            createdAtStr!.EndsWith('Z') || createdAtStr.Contains('+') || createdAtStr.Contains('-', StringComparison.Ordinal),
            $"'createdAt' must include timezone information but got: {createdAtStr}"
        );

        // THEN: Location header points to the new resource
        Assert.NotNull(response.Headers.Location);
        var location = response.Headers.Location.ToString();
        Assert.Contains("/api/v1/contactos/", location);

        // THEN: Follow-up GET confirms the record is persisted
        var createdId = idProp.GetString();
        var getResponse = await client.GetAsync($"/api/v1/contactos/{createdId}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
    }

    /// <summary>
    /// TC-E3-P0-07 variant — Verifies Content-Type is application/json on 201 response.
    /// </summary>
    [Fact]
    public async Task PostContacto_Returns201_WithJsonContentType()
    {
        // GIVEN: A valid create-contact payload
        using var factory = new CreateContactoWebApplicationFactory();
        var client = factory.CreateClient();

        var payload = new
        {
            nombre = "Luis Martínez ContentType",
            cargo = "Analista",
            telefono = "3009876543",
            email = "luis.martinez.ct@empresa.co"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: POST /api/v1/contactos is called
        var response = await client.PostAsync("/api/v1/contactos", content);

        // THEN: HTTP 201 Created
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        // THEN: Content-Type is application/json
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.Contains("application/json", contentType);
    }

    // ---------------------------------------------------------------------------
    // TC-E3-P1-19: POST empty body → 400 Bad Request + Problem Details with field errors
    // ---------------------------------------------------------------------------

    /// <summary>
    /// TC-E3-P1-19 — Given an empty JSON body ({}),
    /// When POST /api/v1/contactos is called,
    /// Then returns HTTP 400 Bad Request with Problem Details RFC 7807 containing:
    ///   - status: 400
    ///   - errors object with entries for nombre, cargo, telefono, email
    ///   - NO stackTrace key
    /// </summary>
    [Fact]
    public async Task TC_E3_P1_19_PostContacto_Returns400_WithProblemDetails_OnEmptyBody()
    {
        // GIVEN: An empty JSON body
        using var factory = new CreateContactoWebApplicationFactory();
        var client = factory.CreateClient();

        var content = new StringContent(
            "{}",
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: POST /api/v1/contactos is called with empty body
        var response = await client.PostAsync("/api/v1/contactos", content);

        // THEN: HTTP 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // THEN: Response body is Problem Details
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: status: 400 present
        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            $"Problem Details must contain 'status' field. Body: {json}");
        Assert.Equal(400, statusProp.GetInt32());

        // THEN: errors object is present with validation failures
        Assert.True(doc.RootElement.TryGetProperty("errors", out var errorsProp),
            $"Problem Details must contain 'errors' field. Body: {json}");
        Assert.Equal(JsonValueKind.Object, errorsProp.ValueKind);

        // THEN: errors object contains entries for all 4 required fields
        Assert.True(errorsProp.TryGetProperty("nombre", out _) ||
                    errorsProp.TryGetProperty("Nombre", out _),
            $"'errors' must contain entry for 'nombre'. Body: {json}");
        Assert.True(errorsProp.TryGetProperty("cargo", out _) ||
                    errorsProp.TryGetProperty("Cargo", out _),
            $"'errors' must contain entry for 'cargo'. Body: {json}");
        Assert.True(errorsProp.TryGetProperty("telefono", out _) ||
                    errorsProp.TryGetProperty("Telefono", out _),
            $"'errors' must contain entry for 'telefono'. Body: {json}");
        Assert.True(errorsProp.TryGetProperty("email", out _) ||
                    errorsProp.TryGetProperty("Email", out _),
            $"'errors' must contain entry for 'email'. Body: {json}");

        // THEN: No stackTrace exposed (NFR6)
        Assert.False(
            doc.RootElement.TryGetProperty("stackTrace", out _),
            $"Response must NOT expose 'stackTrace' key. Body: {json}"
        );
        Assert.False(
            doc.RootElement.TryGetProperty("exception", out _),
            $"Response must NOT expose 'exception' key. Body: {json}"
        );
    }

    /// <summary>
    /// TC-E3-P1-19 variant — POST with only nombre present also returns 400.
    /// Given a body with only nombre present (cargo, telefono, email missing),
    /// When POST /api/v1/contactos is called,
    /// Then returns HTTP 400 with errors for the missing fields.
    /// </summary>
    [Fact]
    public async Task PostContacto_Returns400_WhenRequiredFieldsMissing_PartialPayload()
    {
        // GIVEN: A partial body with only nombre
        using var factory = new CreateContactoWebApplicationFactory();
        var client = factory.CreateClient();

        var partialPayload = new { nombre = "Solo Nombre" };
        var content = new StringContent(
            JsonSerializer.Serialize(partialPayload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: POST /api/v1/contactos is called
        var response = await client.PostAsync("/api/v1/contactos", content);

        // THEN: HTTP 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // THEN: Problem Details body has status: 400
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp));
        Assert.Equal(400, statusProp.GetInt32());
    }

    // ---------------------------------------------------------------------------
    // TC-E3-email-400: POST with invalid email format → 400 + Problem Details, no stackTrace
    // ---------------------------------------------------------------------------

    /// <summary>
    /// TC-E3-email-400 — Given a create-contact payload with an invalid email format,
    /// When POST /api/v1/contactos is called,
    /// Then returns HTTP 400 Bad Request with Problem Details RFC 7807 containing:
    ///   - status: 400
    ///   - errors.email entry with the email validation error
    ///   - NO stackTrace key
    /// </summary>
    [Fact]
    public async Task TC_E3_Email400_PostContacto_Returns400_WithEmailValidationError()
    {
        // GIVEN: A payload with all fields present but invalid email format
        using var factory = new CreateContactoWebApplicationFactory();
        var client = factory.CreateClient();

        var payload = new
        {
            nombre = "Ana García",
            cargo = "Directora",
            telefono = "3101234567",
            email = "no-es-un-email-valido"   // INVALID email format
        };

        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: POST /api/v1/contactos is called with invalid email
        var response = await client.PostAsync("/api/v1/contactos", content);

        // THEN: HTTP 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // THEN: Response body is Problem Details with status: 400
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            $"Problem Details must contain 'status' field. Body: {json}");
        Assert.Equal(400, statusProp.GetInt32());

        // THEN: errors object has an entry for the email field
        Assert.True(doc.RootElement.TryGetProperty("errors", out var errorsProp),
            $"Problem Details must contain 'errors' field. Body: {json}");
        Assert.True(
            errorsProp.TryGetProperty("email", out _) ||
            errorsProp.TryGetProperty("Email", out _),
            $"'errors' must contain entry for 'email'. Body: {json}"
        );

        // THEN: No stackTrace exposed (NFR6)
        Assert.False(
            doc.RootElement.TryGetProperty("stackTrace", out _),
            $"Response must NOT expose 'stackTrace' key. Body: {json}"
        );
        Assert.False(
            doc.RootElement.TryGetProperty("exception", out _),
            $"Response must NOT expose 'exception' key. Body: {json}"
        );
    }

    /// <summary>
    /// TC-E3-email-400 variant — Verifies that a valid payload with email containing
    /// no domain returns 400 (e.g. "user@" without TLD).
    /// </summary>
    [Fact]
    public async Task PostContacto_Returns400_WhenEmailHasNoDomain()
    {
        // GIVEN: A payload with email missing the domain
        using var factory = new CreateContactoWebApplicationFactory();
        var client = factory.CreateClient();

        var payload = new
        {
            nombre = "Ana García",
            cargo = "Directora",
            telefono = "3101234567",
            email = "ana@"  // no domain
        };

        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: POST /api/v1/contactos is called
        var response = await client.PostAsync("/api/v1/contactos", content);

        // THEN: HTTP 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // THEN: No stackTrace exposed
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.False(
            doc.RootElement.TryGetProperty("stackTrace", out _),
            $"Response must NOT expose 'stackTrace' key. Body: {json}"
        );
    }
}
