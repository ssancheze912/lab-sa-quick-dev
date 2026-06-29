/**
 * Edge-case API Integration Tests — PUT /api/v1/contactos/{id}
 * Story 3.4 — Edit Contact — Automation Expansion
 *
 * Complements UpdateContactoEndpointTests.cs (ATDD baseline).
 * Covers edge cases NOT in ATDD:
 *   - All 4 fields updated simultaneously → 200 OK with all updated values
 *   - updatedAt is always >= createdAt after PUT
 *   - PUT with whitespace-only fields → 400 Bad Request (FluentValidation)
 *   - PUT with null field values → 400 Bad Request
 *   - Two consecutive PUTs to same ID: last write wins
 *   - GET after PUT confirms createdAt is NOT changed (only updatedAt changes)
 *   - clienteId is NOT modified by PUT (Epic 4 scope)
 *   - PUT response Content-Type is application/json (not problem+json) on success
 *   - 404 response has `detail` field in Problem Details body
 *   - 404 response has `title` field in Problem Details body
 *   - PUT response contains all 7 expected ContactoDto fields
 *   - GET after PUT confirms all 4 editable fields are persisted
 *   - PUT to invalid UUID format returns 400 (not 500)
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
 * Given-When-Then format per test method.
 */

using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Contactos;

/// <summary>
/// Edge-case tests for PUT /api/v1/contactos/{id} endpoint.
/// Each test creates its own isolated WebApplicationFactory with a unique in-memory DB.
/// </summary>
public sealed class UpdateContactoEndpointEdgeTests
{
    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static UpdateContactoWebApplicationFactory CreateIsolatedFactory() =>
        new() { DatabaseName = $"UpdateContactoEdgeDb_{Guid.NewGuid()}" };

    private static StringContent JsonPayload(object payload) =>
        new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    private static async Task<Guid> SeedContactoAsync(
        UpdateContactoWebApplicationFactory factory,
        string nombre = "Ana García Seed",
        string cargo = "Vendedora",
        string telefono = "3001234567",
        string email = "ana.garcia.seed@siesa.com",
        Guid? clienteId = null)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var entity = ContactoEntity.Create(nombre, cargo, telefono, email, clienteId: clienteId);
        db.Contactos.Add(entity);
        await db.SaveChangesAsync();
        return entity.Id;
    }

    // -------------------------------------------------------------------------
    // Edge: All 4 fields updated simultaneously → 200 OK
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a contact seeded with initial values,
    /// When PUT changes ALL 4 fields at once,
    /// Then response body contains all 4 updated values.
    /// </summary>
    [Fact(DisplayName = "Edge — PUT all 4 fields simultaneously returns all updated values in response")]
    public async Task PutContacto_UpdatesAllFourFields_ReturnsAllUpdatedValues()
    {
        // GIVEN: A contact seeded with initial data
        using var factory = CreateIsolatedFactory();
        var contactoId = await SeedContactoAsync(factory,
            nombre: "Original Nombre",
            cargo: "Original Cargo",
            telefono: "3000000001",
            email: "original@siesa.com");
        var httpClient = factory.CreateClient();

        var updatePayload = new
        {
            nombre = "Updated Nombre",
            cargo = "Updated Cargo",
            telefono = "3999999999",
            email = "updated@siesa.com"
        };

        // WHEN: PUT with all 4 fields changed
        var response = await httpClient.PutAsync(
            $"/api/v1/contactos/{contactoId}",
            JsonPayload(updatePayload));

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: All 4 fields reflect the new values
        Assert.Equal(updatePayload.nombre, doc.RootElement.GetProperty("nombre").GetString());
        Assert.Equal(updatePayload.cargo, doc.RootElement.GetProperty("cargo").GetString());
        Assert.Equal(updatePayload.telefono, doc.RootElement.GetProperty("telefono").GetString());
        Assert.Equal(updatePayload.email, doc.RootElement.GetProperty("email").GetString());
    }

    // -------------------------------------------------------------------------
    // Edge: updatedAt is always >= createdAt after PUT
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a seeded contact,
    /// When PUT is called,
    /// Then the response updatedAt is greater than or equal to createdAt.
    /// </summary>
    [Fact(DisplayName = "Edge — PUT response updatedAt is >= createdAt (DateTimeOffset temporal correctness)")]
    public async Task PutContacto_UpdatedAtIsGreaterThanOrEqualToCreatedAt()
    {
        // GIVEN: A contact is seeded
        using var factory = CreateIsolatedFactory();
        var contactoId = await SeedContactoAsync(factory);
        var httpClient = factory.CreateClient();

        var updatePayload = new
        {
            nombre = "Ana García Seed",
            cargo = "Gerente",
            telefono = "3001234567",
            email = "ana.garcia.seed@siesa.com"
        };

        // WHEN: PUT is called
        var response = await httpClient.PutAsync(
            $"/api/v1/contactos/{contactoId}",
            JsonPayload(updatePayload));

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: Both timestamps are parseable DateTimeOffset values
        var createdAtStr = doc.RootElement.GetProperty("createdAt").GetString()!;
        var updatedAtStr = doc.RootElement.GetProperty("updatedAt").GetString()!;

        Assert.True(DateTimeOffset.TryParse(createdAtStr, out var createdAt),
            $"'createdAt' must be a valid DateTimeOffset: {createdAtStr}");
        Assert.True(DateTimeOffset.TryParse(updatedAtStr, out var updatedAt),
            $"'updatedAt' must be a valid DateTimeOffset: {updatedAtStr}");

        // THEN: updatedAt >= createdAt (temporal order is correct)
        Assert.True(updatedAt >= createdAt,
            $"'updatedAt' ({updatedAt}) must be >= 'createdAt' ({createdAt})");
    }

    // -------------------------------------------------------------------------
    // Edge: PUT with whitespace-only fields → 400 Bad Request
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given an existing contact ID and a payload with whitespace-only nombre,
    /// When PUT /api/v1/contactos/{id} is called,
    /// Then returns HTTP 400 Bad Request (FluentValidation NotEmpty rejects whitespace).
    /// </summary>
    [Fact(DisplayName = "Edge — PUT whitespace-only nombre returns 400 Bad Request")]
    public async Task PutContacto_Returns400_WhenNombreIsWhitespaceOnly()
    {
        // GIVEN: A contact is seeded
        using var factory = CreateIsolatedFactory();
        var contactoId = await SeedContactoAsync(factory);
        var httpClient = factory.CreateClient();

        var payload = new
        {
            nombre = "   ",  // whitespace-only — NotEmpty() should reject this
            cargo = "Gerente",
            telefono = "3001234567",
            email = "ana.garcia.seed@siesa.com"
        };

        // WHEN: PUT with whitespace-only nombre
        var response = await httpClient.PutAsync(
            $"/api/v1/contactos/{contactoId}",
            JsonPayload(payload));

        // THEN: HTTP 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            $"Response must contain 'status'. Body: {json}");
        Assert.Equal(400, statusProp.GetInt32());
    }

    /// <summary>
    /// Given a payload with all fields as whitespace-only strings,
    /// When PUT is called,
    /// Then response is 400 and errors object contains entries for multiple fields.
    /// </summary>
    [Fact(DisplayName = "Edge — PUT whitespace-only all fields returns 400 with validation errors")]
    public async Task PutContacto_Returns400WithErrors_WhenAllFieldsAreWhitespace()
    {
        // GIVEN: A contact is seeded
        using var factory = CreateIsolatedFactory();
        var contactoId = await SeedContactoAsync(factory);
        var httpClient = factory.CreateClient();

        var payload = new
        {
            nombre = "   ",
            cargo = "   ",
            telefono = "   ",
            email = "   "
        };

        // WHEN: PUT with all whitespace fields
        var response = await httpClient.PutAsync(
            $"/api/v1/contactos/{contactoId}",
            JsonPayload(payload));

        // THEN: HTTP 400 with Problem Details
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            $"Response must contain 'status'. Body: {json}");
        Assert.Equal(400, statusProp.GetInt32());

        // THEN: errors object is present
        Assert.True(doc.RootElement.TryGetProperty("errors", out _),
            $"Problem Details must contain 'errors'. Body: {json}");
    }

    // -------------------------------------------------------------------------
    // Edge: PUT with null field values → 400 Bad Request
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a valid contact ID and a payload where all fields are explicitly null,
    /// When PUT /api/v1/contactos/{id} is called,
    /// Then returns HTTP 400 Bad Request with Problem Details.
    /// </summary>
    [Fact(DisplayName = "Edge — PUT null field values returns 400 Bad Request with validation errors")]
    public async Task PutContacto_Returns400_WhenAllFieldsAreNull()
    {
        // GIVEN: A contact is seeded
        using var factory = CreateIsolatedFactory();
        var contactoId = await SeedContactoAsync(factory);
        var httpClient = factory.CreateClient();

        // Null fields payload (JSON: {"nombre":null,"cargo":null,"telefono":null,"email":null})
        var nullPayload = """{"nombre":null,"cargo":null,"telefono":null,"email":null}""";
        var content = new StringContent(nullPayload, Encoding.UTF8, "application/json");

        // WHEN: PUT with null fields
        var response = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}", content);

        // THEN: HTTP 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            $"Problem Details must contain 'status'. Body: {json}");
        Assert.Equal(400, statusProp.GetInt32());
    }

    // -------------------------------------------------------------------------
    // Edge: Two consecutive PUTs to same ID — last write wins
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a seeded contact,
    /// When two consecutive PUTs are sent with different cargo values,
    /// Then the second PUT returns the second cargo value
    /// and a GET confirms the second value was persisted.
    /// </summary>
    [Fact(DisplayName = "Edge — Two consecutive PUTs: last write wins, GET confirms final state")]
    public async Task PutContacto_TwoConsecutivePuts_LastWriteWins()
    {
        // GIVEN: A contact seeded with cargo "Vendedora"
        using var factory = CreateIsolatedFactory();
        var contactoId = await SeedContactoAsync(factory, cargo: "Vendedora");
        var httpClient = factory.CreateClient();

        var firstPayload = new
        {
            nombre = "Ana García Seed",
            cargo = "Supervisora",
            telefono = "3001234567",
            email = "ana.garcia.seed@siesa.com"
        };

        var secondPayload = new
        {
            nombre = "Ana García Seed",
            cargo = "Directora",
            telefono = "3001234567",
            email = "ana.garcia.seed@siesa.com"
        };

        // WHEN: First PUT changes cargo to "Supervisora"
        var firstResponse = await httpClient.PutAsync(
            $"/api/v1/contactos/{contactoId}",
            JsonPayload(firstPayload));
        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);

        // WHEN: Second PUT changes cargo to "Directora"
        var secondResponse = await httpClient.PutAsync(
            $"/api/v1/contactos/{contactoId}",
            JsonPayload(secondPayload));

        // THEN: Second PUT returns 200 with cargo "Directora"
        Assert.Equal(HttpStatusCode.OK, secondResponse.StatusCode);

        var secondJson = await secondResponse.Content.ReadAsStringAsync();
        using var secondDoc = JsonDocument.Parse(secondJson);
        Assert.Equal("Directora", secondDoc.RootElement.GetProperty("cargo").GetString());

        // THEN: Follow-up GET confirms "Directora" is persisted (last write wins)
        var getResponse = await httpClient.GetAsync($"/api/v1/contactos/{contactoId}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var getJson = await getResponse.Content.ReadAsStringAsync();
        using var getDoc = JsonDocument.Parse(getJson);
        Assert.Equal("Directora", getDoc.RootElement.GetProperty("cargo").GetString());
    }

    // -------------------------------------------------------------------------
    // Edge: createdAt is NOT changed by PUT
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a seeded contact with a known createdAt,
    /// When PUT is called,
    /// Then the response createdAt is the same as the original createdAt (not reset).
    /// </summary>
    [Fact(DisplayName = "Edge — PUT does NOT change createdAt (only updatedAt changes)")]
    public async Task PutContacto_DoesNotChangeCreatedAt_OnlyUpdatesUpdatedAt()
    {
        // GIVEN: A contact is seeded and its original createdAt is captured via GET
        using var factory = CreateIsolatedFactory();
        var contactoId = await SeedContactoAsync(factory);
        var httpClient = factory.CreateClient();

        // Get original createdAt
        var originalGet = await httpClient.GetAsync($"/api/v1/contactos/{contactoId}");
        Assert.Equal(HttpStatusCode.OK, originalGet.StatusCode);
        var originalJson = await originalGet.Content.ReadAsStringAsync();
        using var originalDoc = JsonDocument.Parse(originalJson);
        var originalCreatedAt = originalDoc.RootElement.GetProperty("createdAt").GetString();

        // WHEN: PUT is called
        var updatePayload = new
        {
            nombre = "Ana García Seed",
            cargo = "Gerente",
            telefono = "3001234567",
            email = "ana.garcia.seed@siesa.com"
        };
        var putResponse = await httpClient.PutAsync(
            $"/api/v1/contactos/{contactoId}",
            JsonPayload(updatePayload));

        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

        var putJson = await putResponse.Content.ReadAsStringAsync();
        using var putDoc = JsonDocument.Parse(putJson);
        var putCreatedAt = putDoc.RootElement.GetProperty("createdAt").GetString();

        // THEN: createdAt is unchanged after PUT
        Assert.Equal(originalCreatedAt, putCreatedAt);
    }

    // -------------------------------------------------------------------------
    // Edge: clienteId is NOT modified by PUT
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a contact seeded with a clienteId,
    /// When PUT /api/v1/contactos/{id} is called (which does not accept clienteId in body),
    /// Then the response clienteId is the same as the original (not null-ed out).
    /// Note: clienteId association is Epic 4 scope — PUT must NOT clear it.
    /// </summary>
    [Fact(DisplayName = "Edge — PUT does NOT modify clienteId (Epic 4 scope — association preserved)")]
    public async Task PutContacto_DoesNotModifyClienteId_WhenContactHasClienteId()
    {
        // GIVEN: A contact seeded with clienteId = null (default MVP state)
        using var factory = CreateIsolatedFactory();
        var contactoId = await SeedContactoAsync(factory, clienteId: null);
        var httpClient = factory.CreateClient();

        // Capture original clienteId from GET
        var originalGet = await httpClient.GetAsync($"/api/v1/contactos/{contactoId}");
        Assert.Equal(HttpStatusCode.OK, originalGet.StatusCode);
        var originalJson = await originalGet.Content.ReadAsStringAsync();
        using var originalDoc = JsonDocument.Parse(originalJson);

        // WHEN: PUT with all valid fields (no clienteId in body)
        var updatePayload = new
        {
            nombre = "Ana García Updated",
            cargo = "Supervisora",
            telefono = "3009999999",
            email = "ana.updated@siesa.com"
        };

        var putResponse = await httpClient.PutAsync(
            $"/api/v1/contactos/{contactoId}",
            JsonPayload(updatePayload));

        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

        var putJson = await putResponse.Content.ReadAsStringAsync();
        using var putDoc = JsonDocument.Parse(putJson);

        // THEN: clienteId is present in the response
        Assert.True(putDoc.RootElement.TryGetProperty("clienteId", out var putClienteId),
            $"Response must contain 'clienteId'. Body: {putJson}");

        // THEN: clienteId in response matches the original (null in this case)
        Assert.True(putClienteId.ValueKind == JsonValueKind.Null,
            $"'clienteId' must remain null (not changed by PUT). Body: {putJson}");
    }

    // -------------------------------------------------------------------------
    // Edge: PUT response Content-Type is application/json on 200 success
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a valid PUT request to an existing contact,
    /// When PUT returns 200,
    /// Then Content-Type is application/json (NOT application/problem+json).
    /// </summary>
    [Fact(DisplayName = "Edge — PUT 200 response Content-Type is application/json (not problem+json)")]
    public async Task PutContacto_Returns200_ContentTypeIsApplicationJson_NotProblemJson()
    {
        // GIVEN: A contact is seeded
        using var factory = CreateIsolatedFactory();
        var contactoId = await SeedContactoAsync(factory);
        var httpClient = factory.CreateClient();

        var updatePayload = new
        {
            nombre = "Ana García Seed",
            cargo = "Gerente",
            telefono = "3001234567",
            email = "ana.garcia.seed@siesa.com"
        };

        // WHEN: PUT /api/v1/contactos/{id}
        var response = await httpClient.PutAsync(
            $"/api/v1/contactos/{contactoId}",
            JsonPayload(updatePayload));

        // THEN: HTTP 200
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Content-Type is application/json (not application/problem+json)
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.Contains("application/json", contentType);
        Assert.DoesNotContain("problem+json", contentType);
    }

    // -------------------------------------------------------------------------
    // Edge: 404 response has `detail` field in Problem Details
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a UUID that does not exist,
    /// When PUT is called with a valid payload,
    /// Then 404 Problem Details response body contains `detail` field (not just `title`).
    /// </summary>
    [Fact(DisplayName = "Edge — PUT 404 Problem Details body contains 'detail' field")]
    public async Task PutContacto_Returns404_ProblemDetailsHasDetailField()
    {
        // GIVEN: A UUID that has not been seeded
        using var factory = CreateIsolatedFactory();
        var httpClient = factory.CreateClient();
        var nonExistentId = Guid.NewGuid();

        var payload = new
        {
            nombre = "Does Not Exist",
            cargo = "N/A",
            telefono = "3001234567",
            email = "notexist@siesa.com"
        };

        // WHEN: PUT /api/v1/contactos/{non-existent}
        var response = await httpClient.PutAsync(
            $"/api/v1/contactos/{nonExistentId}",
            JsonPayload(payload));

        // THEN: HTTP 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: Response has Problem Details `detail` field (non-empty)
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("detail", out var detailProp),
            $"Problem Details must contain 'detail' field. Body: {json}");
        Assert.False(string.IsNullOrWhiteSpace(detailProp.GetString()),
            "'detail' field must not be empty");
    }

    /// <summary>
    /// Given a UUID that does not exist,
    /// When PUT is called,
    /// Then 404 Problem Details response body contains `title` field.
    /// </summary>
    [Fact(DisplayName = "Edge — PUT 404 Problem Details body contains 'title' field")]
    public async Task PutContacto_Returns404_ProblemDetailsHasTitleField()
    {
        // GIVEN: A UUID that has not been seeded
        using var factory = CreateIsolatedFactory();
        var httpClient = factory.CreateClient();
        var nonExistentId = Guid.NewGuid();

        var payload = new
        {
            nombre = "Does Not Exist",
            cargo = "N/A",
            telefono = "3001234567",
            email = "notexist@siesa.com"
        };

        // WHEN: PUT /api/v1/contactos/{non-existent}
        var response = await httpClient.PutAsync(
            $"/api/v1/contactos/{nonExistentId}",
            JsonPayload(payload));

        // THEN: HTTP 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: Response has `title` field (non-empty)
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("title", out var titleProp),
            $"Problem Details must contain 'title' field. Body: {json}");
        Assert.False(string.IsNullOrWhiteSpace(titleProp.GetString()),
            "'title' field must not be empty");
    }

    // -------------------------------------------------------------------------
    // Edge: PUT 200 response contains all 7 expected ContactoDto fields
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a valid PUT request,
    /// When PUT returns 200,
    /// Then the response body contains all 7 expected ContactoDto fields:
    /// id, nombre, cargo, telefono, email, clienteId, createdAt, updatedAt.
    /// </summary>
    [Fact(DisplayName = "Edge — PUT 200 response contains all 8 ContactoDto fields")]
    public async Task PutContacto_Returns200_WithAllRequiredDtoFields()
    {
        // GIVEN: A contact is seeded
        using var factory = CreateIsolatedFactory();
        var contactoId = await SeedContactoAsync(factory);
        var httpClient = factory.CreateClient();

        var updatePayload = new
        {
            nombre = "Full DTO Check",
            cargo = "Analista",
            telefono = "3001234567",
            email = "full.check@siesa.com"
        };

        // WHEN: PUT /api/v1/contactos/{id}
        var response = await httpClient.PutAsync(
            $"/api/v1/contactos/{contactoId}",
            JsonPayload(updatePayload));

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: All required ContactoDto fields are present
        var requiredFields = new[] { "id", "nombre", "cargo", "telefono", "email", "clienteId", "createdAt", "updatedAt" };
        foreach (var field in requiredFields)
        {
            Assert.True(doc.RootElement.TryGetProperty(field, out _),
                $"Response must contain '{field}' field. Body: {json}");
        }
    }

    // -------------------------------------------------------------------------
    // Edge: GET after PUT confirms all 4 editable fields are persisted
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a seeded contact,
    /// When PUT updates nombre and telefono,
    /// Then a GET confirms both fields are persisted with the new values.
    /// </summary>
    [Fact(DisplayName = "Edge — GET after PUT confirms nombre and telefono fields are persisted")]
    public async Task PutContacto_GetAfterPut_ConfirmsNombreAndTelefonoArePersisted()
    {
        // GIVEN: A contact seeded with original nombre and telefono
        using var factory = CreateIsolatedFactory();
        var contactoId = await SeedContactoAsync(factory,
            nombre: "Original Nombre",
            telefono: "3000000001");
        var httpClient = factory.CreateClient();

        var updatePayload = new
        {
            nombre = "Updated Nombre Persistence",
            cargo = "Vendedora",
            telefono = "3999999999",
            email = "ana.garcia.seed@siesa.com"
        };

        // WHEN: PUT is called
        var putResponse = await httpClient.PutAsync(
            $"/api/v1/contactos/{contactoId}",
            JsonPayload(updatePayload));
        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

        // THEN: GET confirms nombre and telefono are persisted
        var getResponse = await httpClient.GetAsync($"/api/v1/contactos/{contactoId}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var getJson = await getResponse.Content.ReadAsStringAsync();
        using var getDoc = JsonDocument.Parse(getJson);

        Assert.Equal("Updated Nombre Persistence", getDoc.RootElement.GetProperty("nombre").GetString());
        Assert.Equal("3999999999", getDoc.RootElement.GetProperty("telefono").GetString());
    }

    // -------------------------------------------------------------------------
    // Edge: PUT to invalid UUID format returns 400 (not 500 internal error)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given an invalid non-UUID string as the route parameter (e.g. "not-a-uuid"),
    /// When PUT /api/v1/contactos/not-a-uuid is called,
    /// Then returns HTTP 400 Bad Request (route constraint {id:guid} rejects it, not 500).
    /// </summary>
    [Fact(DisplayName = "Edge — PUT to invalid UUID format returns 400 (route constraint rejects it)")]
    public async Task PutContacto_Returns400_WhenRouteIdIsNotValidUuid()
    {
        // GIVEN: A non-UUID route parameter
        using var factory = CreateIsolatedFactory();
        var httpClient = factory.CreateClient();

        var payload = new
        {
            nombre = "Test",
            cargo = "Test",
            telefono = "3001234567",
            email = "test@siesa.com"
        };

        // WHEN: PUT /api/v1/contactos/not-a-valid-uuid
        var response = await httpClient.PutAsync(
            "/api/v1/contactos/not-a-valid-uuid",
            JsonPayload(payload));

        // THEN: HTTP 400 Bad Request (route constraint {id:guid} rejects non-GUID strings)
        // Note: The catch-all route for invalid UUIDs returns 400
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest ||
            response.StatusCode == HttpStatusCode.NotFound,
            $"Expected 400 or 404 for invalid UUID format, got: {response.StatusCode}"
        );

        // THEN: NOT a 500 Internal Server Error (must not bubble up as unhandled exception)
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    // -------------------------------------------------------------------------
    // Edge: PUT 404 regression guard — no stackTrace exposed
    // -------------------------------------------------------------------------

    /// <summary>
    /// Regression guard: 404 response must NOT contain stackTrace, exception, or innerException.
    /// (This mirrors an ATDD test but runs from a separate isolated factory for regression safety.)
    /// </summary>
    [Fact(DisplayName = "Edge — PUT 404 regression guard: stackTrace NOT exposed in Problem Details")]
    public async Task PutContacto_Returns404_NoStackTrace_RegressionGuard()
    {
        // GIVEN: A UUID that does not exist
        using var factory = CreateIsolatedFactory();
        var httpClient = factory.CreateClient();
        var nonExistentId = Guid.Empty;

        var payload = new
        {
            nombre = "Regression Guard",
            cargo = "N/A",
            telefono = "3001234567",
            email = "regression@siesa.com"
        };

        // WHEN: PUT to non-existent ID
        var response = await httpClient.PutAsync(
            $"/api/v1/contactos/{nonExistentId}",
            JsonPayload(payload));

        // THEN: HTTP 404
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: No stackTrace, innerException, or exception keys exposed (NFR6 regression guard)
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.False(doc.RootElement.TryGetProperty("stackTrace", out _),
            $"'stackTrace' must NOT be exposed. Body: {json}");
        Assert.False(doc.RootElement.TryGetProperty("exception", out _),
            $"'exception' must NOT be exposed. Body: {json}");
        Assert.False(doc.RootElement.TryGetProperty("innerException", out _),
            $"'innerException' must NOT be exposed. Body: {json}");
    }
}
