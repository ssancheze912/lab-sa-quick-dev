/**
 * API Integration Tests — PUT /api/v1/contactos/{id}
 * Story 3.4 — Edit Contact (ATDD RED phase)
 *
 * Test IDs covered:
 *   TC-E3-P1-18    PUT valid payload to existing contact → 200 OK, updated ContactoDto,
 *                  cargo updated, updatedAt set (ISO 8601 with TZ), follow-up GET confirms persistence
 *   TC-E3-update-404  PUT valid payload to non-existent ID → 404 Not Found + Problem Details (no stackTrace)
 *   TC-E3-update-400  PUT {} (empty body) to valid ID → 400 Bad Request + Problem Details
 *                     with errors for nombre, cargo, telefono, email (no stackTrace)
 *   TC-E3-update-400-email  PUT body with invalid email format → 400 + Problem Details
 *                           with error on email (no stackTrace)
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
 *
 * Expected RED failures:
 *   - PUT /api/v1/contactos/{id} not yet registered → 404 Not Found or 405 Method Not Allowed
 *   - UpdateContactoCommandHandler not yet implemented
 *   - UpdateContactoRequestValidator not yet created
 *   - ContactoEntity.Update() method not yet added
 *
 * Given-When-Then format per test method.
 */

using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Contactos;

/// <summary>
/// Isolated WebApplicationFactory for Story 3.4 update endpoint tests.
/// Each test class instance gets a unique in-memory database name to prevent
/// cross-test data pollution.
/// </summary>
public sealed class UpdateContactoWebApplicationFactory : WebApplicationFactory<Program>
{
    public string DatabaseName { get; init; } = $"UpdateContactoTestDb_{Guid.NewGuid()}";

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
/// Integration tests for PUT /api/v1/contactos/{id} endpoint.
/// Each test that needs isolation creates its own factory with a unique DB name.
/// </summary>
public sealed class UpdateContactoEndpointTests
{
    // -------------------------------------------------------------------------
    // Helper: seed a ContactoEntity directly into the in-memory DB
    // -------------------------------------------------------------------------

    private static async Task<Guid> SeedContactoAsync(
        UpdateContactoWebApplicationFactory factory,
        string nombre = "Ana García Seed",
        string cargo = "Vendedora",
        string telefono = "3001234567",
        string email = "ana.garcia.seed@siesa.com")
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var entity = ContactoEntity.Create(nombre, cargo, telefono, email);
        db.Contactos.Add(entity);
        await db.SaveChangesAsync();

        return entity.Id;
    }

    // -------------------------------------------------------------------------
    // TC-E3-P1-18: PUT valid payload → 200 OK with updated ContactoDto
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-E3-P1-18 — Given a contact seeded with cargo "Vendedora",
    /// When PUT /api/v1/contactos/{id} is called with cargo "Gerente",
    /// Then returns HTTP 200 with updated ContactoDto containing cargo "Gerente"
    /// and updatedAt (ISO 8601 with TZ).
    /// And a follow-up GET confirms the change was persisted.
    /// </summary>
    [Fact]
    public async Task TC_E3_P1_18_PutContacto_Returns200_WithUpdatedDto_AndPersists()
    {
        // GIVEN: A contact is seeded with cargo "Vendedora"
        using var factory = new UpdateContactoWebApplicationFactory();
        var contactoId = await SeedContactoAsync(factory, cargo: "Vendedora");
        var httpClient = factory.CreateClient();

        var updatePayload = new
        {
            nombre = "Ana García Seed",
            cargo = "Gerente",
            telefono = "3001234567",
            email = "ana.garcia.seed@siesa.com"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(updatePayload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: PUT /api/v1/contactos/{id} is called with cargo "Gerente"
        var response = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}", content);

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Response body is a ContactoDto (direct object, no wrapper)
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: id matches the seeded contact
        Assert.True(doc.RootElement.TryGetProperty("id", out var idProp),
            $"Response must contain 'id' field. Body: {json}");
        Assert.Equal(contactoId.ToString(), idProp.GetString());

        // THEN: cargo has the updated value "Gerente"
        Assert.True(doc.RootElement.TryGetProperty("cargo", out var cargoProp),
            $"Response must contain 'cargo' field. Body: {json}");
        Assert.Equal("Gerente", cargoProp.GetString());

        // THEN: nombre is still present and unchanged
        Assert.True(doc.RootElement.TryGetProperty("nombre", out var nombreProp),
            $"Response must contain 'nombre' field. Body: {json}");
        Assert.Equal(updatePayload.nombre, nombreProp.GetString());

        // THEN: telefono is still present and unchanged
        Assert.True(doc.RootElement.TryGetProperty("telefono", out var telefonoProp),
            $"Response must contain 'telefono' field. Body: {json}");
        Assert.Equal(updatePayload.telefono, telefonoProp.GetString());

        // THEN: email is still present and unchanged
        Assert.True(doc.RootElement.TryGetProperty("email", out var emailProp),
            $"Response must contain 'email' field. Body: {json}");
        Assert.Equal(updatePayload.email, emailProp.GetString());

        // THEN: clienteId is not modified by this endpoint (null or existing value)
        Assert.True(doc.RootElement.TryGetProperty("clienteId", out _),
            $"Response must contain 'clienteId' field. Body: {json}");

        // THEN: updatedAt is present and is a valid DateTimeOffset ISO 8601 with TZ
        Assert.True(doc.RootElement.TryGetProperty("updatedAt", out var updatedAtProp),
            $"Response must contain 'updatedAt' field. Body: {json}");
        var updatedAtStr = updatedAtProp.GetString();
        Assert.False(string.IsNullOrEmpty(updatedAtStr), "'updatedAt' must not be empty");
        Assert.True(
            DateTimeOffset.TryParse(updatedAtStr, out _),
            $"'updatedAt' must be a valid DateTimeOffset ISO 8601 string but got: {updatedAtStr}"
        );
        Assert.True(
            updatedAtStr!.EndsWith('Z') || updatedAtStr.Contains('+') || updatedAtStr.Contains('-', StringComparison.Ordinal),
            $"'updatedAt' must include timezone information but got: {updatedAtStr}"
        );

        // THEN: createdAt is also present (DateTimeOffset)
        Assert.True(doc.RootElement.TryGetProperty("createdAt", out var createdAtProp),
            $"Response must contain 'createdAt' field. Body: {json}");
        var createdAtStr = createdAtProp.GetString();
        Assert.True(DateTimeOffset.TryParse(createdAtStr, out _),
            $"'createdAt' must be a valid DateTimeOffset ISO 8601 string but got: {createdAtStr}");

        // THEN: Follow-up GET /api/v1/contactos/{id} confirms persistence
        var getResponse = await httpClient.GetAsync($"/api/v1/contactos/{contactoId}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var getJson = await getResponse.Content.ReadAsStringAsync();
        using var getDoc = JsonDocument.Parse(getJson);

        Assert.True(getDoc.RootElement.TryGetProperty("cargo", out var persistedCargo),
            $"Follow-up GET response must contain 'cargo'. Body: {getJson}");
        Assert.Equal("Gerente", persistedCargo.GetString());
    }

    /// <summary>
    /// TC-E3-P1-18 variant — PUT updates nombre correctly.
    /// Given a seeded contact, When PUT is called with a different nombre,
    /// Then the response body has the updated nombre.
    /// </summary>
    [Fact]
    public async Task PutContacto_Returns200_WithUpdatedNombre()
    {
        // GIVEN: A contact is seeded
        using var factory = new UpdateContactoWebApplicationFactory();
        var contactoId = await SeedContactoAsync(factory, nombre: "Nombre Original");
        var httpClient = factory.CreateClient();

        var updatePayload = new
        {
            nombre = "Nombre Actualizado",
            cargo = "Vendedora",
            telefono = "3001234567",
            email = "ana.garcia.seed@siesa.com"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(updatePayload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: PUT /api/v1/contactos/{id} is called with updated nombre
        var response = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}", content);

        // THEN: HTTP 200 OK with updated nombre
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("nombre", out var nombreProp),
            $"Response must contain 'nombre'. Body: {json}");
        Assert.Equal("Nombre Actualizado", nombreProp.GetString());
    }

    /// <summary>
    /// TC-E3-P1-18 variant — Response Content-Type is application/json on 200.
    /// </summary>
    [Fact]
    public async Task PutContacto_Returns200_WithJsonContentType()
    {
        // GIVEN: A contact is seeded
        using var factory = new UpdateContactoWebApplicationFactory();
        var contactoId = await SeedContactoAsync(factory);
        var httpClient = factory.CreateClient();

        var updatePayload = new
        {
            nombre = "Ana García Seed",
            cargo = "Gerente",
            telefono = "3001234567",
            email = "ana.garcia.seed@siesa.com"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(updatePayload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: PUT /api/v1/contactos/{id}
        var response = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}", content);

        // THEN: HTTP 200 and Content-Type is application/json
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.Contains("application/json", contentType);
    }

    // -------------------------------------------------------------------------
    // TC-E3-update-404: PUT to non-existent ID → 404 Problem Details, no stackTrace
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-E3-update-404 — Given a UUID that does not exist in the database,
    /// When PUT /api/v1/contactos/{id} is called with a valid payload,
    /// Then returns HTTP 404 Not Found with Problem Details RFC 7807:
    ///   - status: 404
    ///   - Content-Type: application/problem+json
    ///   - NO stackTrace, NO exception keys
    /// </summary>
    [Fact]
    public async Task TC_E3_Update404_PutContacto_Returns404_WithProblemDetails_WhenNotFound()
    {
        // GIVEN: A UUID that has not been seeded
        using var factory = new UpdateContactoWebApplicationFactory();
        var httpClient = factory.CreateClient();
        var nonExistentId = Guid.Empty; // 00000000-0000-0000-0000-000000000000

        var updatePayload = new
        {
            nombre = "Does Not Matter",
            cargo = "Cargo",
            telefono = "3001234567",
            email = "doesnotmatter@siesa.com"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(updatePayload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: PUT /api/v1/contactos/{non-existent-id}
        var response = await httpClient.PutAsync($"/api/v1/contactos/{nonExistentId}", content);

        // THEN: HTTP 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: Content-Type is application/problem+json (RFC 7807)
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.True(contentType.Contains("problem+json"),
            $"Expected Content-Type to contain 'problem+json' but got: {contentType}");

        // THEN: Response body is Problem Details with status: 404
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            $"Problem Details must contain 'status' field. Body: {json}");
        Assert.Equal(404, statusProp.GetInt32());

        // THEN: No stackTrace or internal exception keys exposed (NFR6)
        Assert.False(
            doc.RootElement.TryGetProperty("stackTrace", out _),
            $"Response must NOT expose 'stackTrace' key. Body: {json}"
        );
        Assert.False(
            doc.RootElement.TryGetProperty("exception", out _),
            $"Response must NOT expose 'exception' key. Body: {json}"
        );
        Assert.False(
            doc.RootElement.TryGetProperty("innerException", out _),
            $"Response must NOT expose 'innerException' key. Body: {json}"
        );
    }

    // -------------------------------------------------------------------------
    // TC-E3-update-400: PUT empty body → 400 Bad Request + Problem Details
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-E3-update-400 — Given an existing contact ID and an empty JSON body ({}),
    /// When PUT /api/v1/contactos/{id} is called,
    /// Then returns HTTP 400 Bad Request with Problem Details RFC 7807 containing:
    ///   - status: 400
    ///   - errors object with entries for nombre, cargo, telefono, email
    ///   - NO stackTrace key
    /// </summary>
    [Fact]
    public async Task TC_E3_Update400_PutContacto_Returns400_WithProblemDetails_OnEmptyBody()
    {
        // GIVEN: A valid contact seeded in the database
        using var factory = new UpdateContactoWebApplicationFactory();
        var contactoId = await SeedContactoAsync(factory);
        var httpClient = factory.CreateClient();

        var content = new StringContent(
            "{}",
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: PUT /api/v1/contactos/{id} is called with empty body
        var response = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}", content);

        // THEN: HTTP 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // THEN: Response body is Problem Details
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: status: 400 present
        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            $"Problem Details must contain 'status' field. Body: {json}");
        Assert.Equal(400, statusProp.GetInt32());

        // THEN: errors object is present with validation failures for all 4 fields
        Assert.True(doc.RootElement.TryGetProperty("errors", out var errorsProp),
            $"Problem Details must contain 'errors' field. Body: {json}");
        Assert.Equal(JsonValueKind.Object, errorsProp.ValueKind);

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
    /// TC-E3-update-400 variant — PUT with only nombre present also returns 400.
    /// Given a body with only nombre present (cargo, telefono, email missing),
    /// When PUT /api/v1/contactos/{id} is called,
    /// Then returns HTTP 400 with errors for the missing fields.
    /// </summary>
    [Fact]
    public async Task PutContacto_Returns400_WhenRequiredFieldsMissing_PartialPayload()
    {
        // GIVEN: A contact is seeded
        using var factory = new UpdateContactoWebApplicationFactory();
        var contactoId = await SeedContactoAsync(factory);
        var httpClient = factory.CreateClient();

        var partialPayload = new { nombre = "Solo Nombre" };
        var content = new StringContent(
            JsonSerializer.Serialize(partialPayload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: PUT /api/v1/contactos/{id} with only nombre in the body
        var response = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}", content);

        // THEN: HTTP 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // THEN: Problem Details body has status: 400
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp));
        Assert.Equal(400, statusProp.GetInt32());
    }

    // -------------------------------------------------------------------------
    // TC-E3-update-400-email: PUT with invalid email format → 400 + Problem Details
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-E3-update-400-email — Given a contact update payload with an invalid email format,
    /// When PUT /api/v1/contactos/{id} is called,
    /// Then returns HTTP 400 Bad Request with Problem Details RFC 7807 containing:
    ///   - status: 400
    ///   - errors.email entry with the email validation error
    ///   - NO stackTrace key
    /// </summary>
    [Fact]
    public async Task TC_E3_Update400Email_PutContacto_Returns400_WithEmailValidationError()
    {
        // GIVEN: A contact is seeded; payload has all fields but invalid email format
        using var factory = new UpdateContactoWebApplicationFactory();
        var contactoId = await SeedContactoAsync(factory);
        var httpClient = factory.CreateClient();

        var payload = new
        {
            nombre = "Ana García",
            cargo = "Gerente",
            telefono = "3001234567",
            email = "no-es-un-email-valido"   // INVALID email format
        };

        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: PUT /api/v1/contactos/{id} is called with invalid email
        var response = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}", content);

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
    /// TC-E3-update-400-email variant — Verifies that a payload with email missing
    /// the domain (e.g. "user@") returns 400 (invalid email format).
    /// </summary>
    [Fact]
    public async Task PutContacto_Returns400_WhenEmailHasNoDomain()
    {
        // GIVEN: A contact is seeded; payload has email missing the domain
        using var factory = new UpdateContactoWebApplicationFactory();
        var contactoId = await SeedContactoAsync(factory);
        var httpClient = factory.CreateClient();

        var payload = new
        {
            nombre = "Ana García",
            cargo = "Gerente",
            telefono = "3001234567",
            email = "ana@"  // no domain
        };

        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: PUT /api/v1/contactos/{id} is called
        var response = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}", content);

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
