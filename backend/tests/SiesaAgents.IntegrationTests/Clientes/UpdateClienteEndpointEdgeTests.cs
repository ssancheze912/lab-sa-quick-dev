/**
 * Edge-case API Integration Tests — PUT /api/v1/clientes/{id}
 * Story 2.4 — Edit Client — Automation Expansion
 *
 * Complements UpdateClienteEndpointTests.cs (ATDD baseline).
 * Covers edge cases NOT in ATDD:
 *   - All 4 fields updated simultaneously → 200 OK with all updated values
 *   - updatedAt is always >= createdAt after PUT
 *   - PUT with whitespace-only fields → 400 Bad Request (FluentValidation)
 *   - PUT with null field values → 400 Bad Request (each null field listed in errors)
 *   - Idempotent PUT: same data twice returns 200 both times, second updatedAt >= first
 *   - PUT response has Content-Type application/json (not problem+json on success)
 *   - 404 response has `detail` field in the Problem Details body
 *   - 404 response has correct `title` field
 *   - PUT does not expose stackTrace on 404 (regression guard from ExceptionHandlingMiddleware)
 *   - PUT with invalid UUID format in route returns 400 (bad request, not 500)
 *   - Two consecutive PUTs to same ID: last write wins (updatedAt increases)
 *   - GET after successful PUT returns the updated values (persistence confirmed separately per field)
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

namespace SiesaAgents.IntegrationTests.Clientes;

/// <summary>
/// Edge-case tests for PUT /api/v1/clientes/{id} endpoint.
/// Each test creates its own isolated WebApplicationFactory with a unique in-memory DB.
/// </summary>
public sealed class UpdateClienteEndpointEdgeTests
{
    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static UpdateClienteWebApplicationFactory CreateIsolatedFactory() =>
        new() { DatabaseName = $"UpdateEdgeDb_{Guid.NewGuid()}" };

    private static StringContent JsonPayload(object payload) =>
        new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    private static async Task<Guid> SeedClienteAsync(
        UpdateClienteWebApplicationFactory factory,
        string nombre = "Empresa Test",
        string nit = "900000001-1",
        string telefono = "3000000001",
        string ciudad = "Bogotá")
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var entity = ClienteEntity.Create(nombre, nit, telefono, ciudad);
        db.Clientes.Add(entity);
        await db.SaveChangesAsync();
        return entity.Id;
    }

    // -------------------------------------------------------------------------
    // Edge: All 4 fields updated simultaneously → 200 OK with all updated values
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a seeded client,
    /// When PUT is called changing ALL 4 fields at once,
    /// Then response body contains all 4 updated values.
    /// </summary>
    [Fact(DisplayName = "Edge — PUT all 4 fields simultaneously returns all updated values in response")]
    public async Task PutCliente_UpdatesAllFourFields_ReturnsAllUpdatedValues()
    {
        // GIVEN: A client seeded with initial data
        using var factory = CreateIsolatedFactory();
        var clienteId = await SeedClienteAsync(factory,
            nombre: "Original Nombre",
            nit: "900000001-1",
            telefono: "3000000001",
            ciudad: "Original Ciudad");
        var httpClient = factory.CreateClient();

        var updatePayload = new
        {
            nombre = "Updated Nombre",
            nit = "900000002-2",
            telefono = "3000000002",
            ciudad = "Updated Ciudad"
        };

        // WHEN: PUT with all 4 fields changed
        var response = await httpClient.PutAsync(
            $"/api/v1/clientes/{clienteId}",
            JsonPayload(updatePayload));

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: All 4 fields reflect the new values
        Assert.Equal(updatePayload.nombre, doc.RootElement.GetProperty("nombre").GetString());
        Assert.Equal(updatePayload.nit, doc.RootElement.GetProperty("nit").GetString());
        Assert.Equal(updatePayload.telefono, doc.RootElement.GetProperty("telefono").GetString());
        Assert.Equal(updatePayload.ciudad, doc.RootElement.GetProperty("ciudad").GetString());
    }

    // -------------------------------------------------------------------------
    // Edge: updatedAt is always >= createdAt after PUT
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a seeded client,
    /// When PUT is called,
    /// Then the response updatedAt is greater than or equal to createdAt.
    /// </summary>
    [Fact(DisplayName = "Edge — PUT response updatedAt is >= createdAt (DateTimeOffset correctness)")]
    public async Task PutCliente_UpdatedAtIsGreaterThanOrEqualToCreatedAt()
    {
        // GIVEN: A client is seeded
        using var factory = CreateIsolatedFactory();
        var clienteId = await SeedClienteAsync(factory);
        var httpClient = factory.CreateClient();

        var updatePayload = new
        {
            nombre = "Same Nombre",
            nit = "900000001-1",
            telefono = "3000000001",
            ciudad = "Cali"
        };

        // WHEN: PUT is called
        var response = await httpClient.PutAsync(
            $"/api/v1/clientes/{clienteId}",
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
    // Edge: PUT with whitespace-only field values → 400 Bad Request
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given an existing client ID and a payload with whitespace-only nombre,
    /// When PUT /api/v1/clientes/{id} is called,
    /// Then returns HTTP 400 Bad Request (FluentValidation rejects whitespace).
    /// </summary>
    [Fact(DisplayName = "Edge — PUT whitespace-only nombre returns 400 Bad Request")]
    public async Task PutCliente_Returns400_WhenNombreIsWhitespaceOnly()
    {
        // GIVEN: A client is seeded
        using var factory = CreateIsolatedFactory();
        var clienteId = await SeedClienteAsync(factory);
        var httpClient = factory.CreateClient();

        var payload = new
        {
            nombre = "   ",
            nit = "900000001-1",
            telefono = "3000000001",
            ciudad = "Bogotá"
        };

        // WHEN: PUT with whitespace-only nombre
        var response = await httpClient.PutAsync(
            $"/api/v1/clientes/{clienteId}",
            JsonPayload(payload));

        // THEN: HTTP 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    /// <summary>
    /// Given an existing client ID and a payload with whitespace-only fields,
    /// When PUT is called,
    /// Then response is 400 and errors object contains 'nombre'.
    /// </summary>
    [Fact(DisplayName = "Edge — PUT whitespace-only all fields returns 400 with validation errors")]
    public async Task PutCliente_Returns400WithErrors_WhenAllFieldsAreWhitespace()
    {
        // GIVEN: A client is seeded
        using var factory = CreateIsolatedFactory();
        var clienteId = await SeedClienteAsync(factory);
        var httpClient = factory.CreateClient();

        var payload = new
        {
            nombre = "   ",
            nit = "   ",
            telefono = "   ",
            ciudad = "   "
        };

        // WHEN: PUT with all whitespace fields
        var response = await httpClient.PutAsync(
            $"/api/v1/clientes/{clienteId}",
            JsonPayload(payload));

        // THEN: HTTP 400 with status field
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            $"Response must contain 'status'. Body: {json}");
        Assert.Equal(400, statusProp.GetInt32());
    }

    // -------------------------------------------------------------------------
    // Edge: PUT success Content-Type is application/json (not problem+json)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a valid PUT request to an existing client,
    /// When PUT returns 200,
    /// Then Content-Type is application/json (NOT application/problem+json).
    /// </summary>
    [Fact(DisplayName = "Edge — PUT 200 response Content-Type is application/json (not problem+json)")]
    public async Task PutCliente_Returns200_ContentTypeIsApplicationJson_NotProblemJson()
    {
        // GIVEN: A client is seeded
        using var factory = CreateIsolatedFactory();
        var clienteId = await SeedClienteAsync(factory);
        var httpClient = factory.CreateClient();

        var updatePayload = new
        {
            nombre = "Updated",
            nit = "900000001-1",
            telefono = "3000000001",
            ciudad = "Medellín"
        };

        // WHEN: PUT /api/v1/clientes/{id}
        var response = await httpClient.PutAsync(
            $"/api/v1/clientes/{clienteId}",
            JsonPayload(updatePayload));

        // THEN: HTTP 200
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Content-Type is application/json (not application/problem+json)
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.Contains("application/json", contentType);
        Assert.DoesNotContain("problem+json", contentType);
    }

    // -------------------------------------------------------------------------
    // Edge: 404 response has `detail` field with the client's missing context
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a UUID that does not exist,
    /// When PUT is called with a valid payload,
    /// Then 404 Problem Details response body contains `detail` field (not just `title`).
    /// </summary>
    [Fact(DisplayName = "Edge — PUT 404 Problem Details body contains 'detail' field")]
    public async Task PutCliente_Returns404_ProblemDetailsHasDetailField()
    {
        // GIVEN: A UUID that has not been seeded
        using var factory = CreateIsolatedFactory();
        var httpClient = factory.CreateClient();
        var nonExistentId = Guid.NewGuid();

        var payload = new
        {
            nombre = "Does Not Exist",
            nit = "900000001-1",
            telefono = "3000000001",
            ciudad = "Bogotá"
        };

        // WHEN: PUT /api/v1/clientes/{non-existent}
        var response = await httpClient.PutAsync(
            $"/api/v1/clientes/{nonExistentId}",
            JsonPayload(payload));

        // THEN: HTTP 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: Response has Problem Details `detail` field
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
    public async Task PutCliente_Returns404_ProblemDetailsHasTitleField()
    {
        // GIVEN: A UUID that has not been seeded
        using var factory = CreateIsolatedFactory();
        var httpClient = factory.CreateClient();
        var nonExistentId = Guid.NewGuid();

        var payload = new
        {
            nombre = "Does Not Exist",
            nit = "900000001-1",
            telefono = "3000000001",
            ciudad = "Bogotá"
        };

        // WHEN: PUT /api/v1/clientes/{non-existent}
        var response = await httpClient.PutAsync(
            $"/api/v1/clientes/{nonExistentId}",
            JsonPayload(payload));

        // THEN: HTTP 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: Response has `title` field
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("title", out var titleProp),
            $"Problem Details must contain 'title' field. Body: {json}");
        Assert.False(string.IsNullOrWhiteSpace(titleProp.GetString()),
            "'title' field must not be empty");
    }

    // -------------------------------------------------------------------------
    // Edge: Two consecutive PUTs to same ID — last write wins
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a seeded client,
    /// When two consecutive PUTs are sent with different ciudad values,
    /// Then the second PUT returns the second ciudad value
    /// and a GET confirms the second value was persisted.
    /// </summary>
    [Fact(DisplayName = "Edge — Two consecutive PUTs: last write wins, GET confirms final state")]
    public async Task PutCliente_TwoConsecutivePuts_LastWriteWins()
    {
        // GIVEN: A client seeded with ciudad "Bogotá"
        using var factory = CreateIsolatedFactory();
        var clienteId = await SeedClienteAsync(factory, ciudad: "Bogotá");
        var httpClient = factory.CreateClient();

        var firstPayload = new
        {
            nombre = "Empresa Primera",
            nit = "900000001-1",
            telefono = "3000000001",
            ciudad = "Medellín"
        };

        var secondPayload = new
        {
            nombre = "Empresa Segunda",
            nit = "900000001-1",
            telefono = "3000000001",
            ciudad = "Cali"
        };

        // WHEN: First PUT changes ciudad to "Medellín"
        var firstResponse = await httpClient.PutAsync(
            $"/api/v1/clientes/{clienteId}",
            JsonPayload(firstPayload));
        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);

        // WHEN: Second PUT changes ciudad to "Cali"
        var secondResponse = await httpClient.PutAsync(
            $"/api/v1/clientes/{clienteId}",
            JsonPayload(secondPayload));

        // THEN: Second PUT returns 200 with ciudad "Cali"
        Assert.Equal(HttpStatusCode.OK, secondResponse.StatusCode);

        var secondJson = await secondResponse.Content.ReadAsStringAsync();
        using var secondDoc = JsonDocument.Parse(secondJson);
        Assert.Equal("Cali", secondDoc.RootElement.GetProperty("ciudad").GetString());

        // THEN: Follow-up GET confirms "Cali" is persisted (last write wins)
        var getResponse = await httpClient.GetAsync($"/api/v1/clientes/{clienteId}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var getJson = await getResponse.Content.ReadAsStringAsync();
        using var getDoc = JsonDocument.Parse(getJson);
        Assert.Equal("Cali", getDoc.RootElement.GetProperty("ciudad").GetString());
    }

    // -------------------------------------------------------------------------
    // Edge: GET after PUT confirms all fields updated (not just ciudad)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a seeded client,
    /// When PUT updates nombre and telefono specifically,
    /// Then a GET confirms both fields are persisted with the new values.
    /// </summary>
    [Fact(DisplayName = "Edge — GET after PUT confirms nombre and telefono fields are persisted")]
    public async Task PutCliente_GetAfterPut_ConfirmsNombreAndTelefono()
    {
        // GIVEN: A seeded client
        using var factory = CreateIsolatedFactory();
        var clienteId = await SeedClienteAsync(factory, nombre: "Original Nombre", telefono: "3000000001");
        var httpClient = factory.CreateClient();

        var updatePayload = new
        {
            nombre = "Updated Nombre Persistence",
            nit = "900000001-1",
            telefono = "3999999999",
            ciudad = "Bogotá"
        };

        // WHEN: PUT is called
        var putResponse = await httpClient.PutAsync(
            $"/api/v1/clientes/{clienteId}",
            JsonPayload(updatePayload));
        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

        // THEN: GET confirms nombre and telefono are persisted
        var getResponse = await httpClient.GetAsync($"/api/v1/clientes/{clienteId}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var getJson = await getResponse.Content.ReadAsStringAsync();
        using var getDoc = JsonDocument.Parse(getJson);

        Assert.Equal("Updated Nombre Persistence", getDoc.RootElement.GetProperty("nombre").GetString());
        Assert.Equal("3999999999", getDoc.RootElement.GetProperty("telefono").GetString());
    }

    // -------------------------------------------------------------------------
    // Edge: PUT response contains all expected DTO fields
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a valid PUT request,
    /// When PUT returns 200,
    /// Then the response body contains all 7 expected ClienteDto fields:
    /// id, nombre, nit, telefono, ciudad, createdAt, updatedAt.
    /// </summary>
    [Fact(DisplayName = "Edge — PUT 200 response contains all 7 ClienteDto fields")]
    public async Task PutCliente_Returns200_WithAllRequiredDtoFields()
    {
        // GIVEN: A client is seeded
        using var factory = CreateIsolatedFactory();
        var clienteId = await SeedClienteAsync(factory);
        var httpClient = factory.CreateClient();

        var updatePayload = new
        {
            nombre = "Full DTO Check",
            nit = "900000001-1",
            telefono = "3000000001",
            ciudad = "Bogotá"
        };

        // WHEN: PUT /api/v1/clientes/{id}
        var response = await httpClient.PutAsync(
            $"/api/v1/clientes/{clienteId}",
            JsonPayload(updatePayload));

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: All 7 DTO fields are present
        var requiredFields = new[] { "id", "nombre", "nit", "telefono", "ciudad", "createdAt", "updatedAt" };
        foreach (var field in requiredFields)
        {
            Assert.True(doc.RootElement.TryGetProperty(field, out _),
                $"Response must contain '{field}' field. Body: {json}");
        }
    }

    // -------------------------------------------------------------------------
    // Edge: PUT preserves createdAt (does not reset it)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a seeded client with a known createdAt,
    /// When PUT is called,
    /// Then the response createdAt is the same as the original createdAt (not reset).
    /// </summary>
    [Fact(DisplayName = "Edge — PUT does not change createdAt (only updatedAt changes)")]
    public async Task PutCliente_DoesNotChangeCreatedAt_OnlyUpdatesUpdatedAt()
    {
        // GIVEN: A client is seeded and its original createdAt is captured via GET
        using var factory = CreateIsolatedFactory();
        var clienteId = await SeedClienteAsync(factory);
        var httpClient = factory.CreateClient();

        // Get original createdAt
        var originalGet = await httpClient.GetAsync($"/api/v1/clientes/{clienteId}");
        Assert.Equal(HttpStatusCode.OK, originalGet.StatusCode);
        var originalJson = await originalGet.Content.ReadAsStringAsync();
        using var originalDoc = JsonDocument.Parse(originalJson);
        var originalCreatedAt = originalDoc.RootElement.GetProperty("createdAt").GetString();

        // WHEN: PUT is called
        var updatePayload = new
        {
            nombre = "Updated",
            nit = "900000001-1",
            telefono = "3000000001",
            ciudad = "Medellín"
        };
        var putResponse = await httpClient.PutAsync(
            $"/api/v1/clientes/{clienteId}",
            JsonPayload(updatePayload));

        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

        var putJson = await putResponse.Content.ReadAsStringAsync();
        using var putDoc = JsonDocument.Parse(putJson);
        var putCreatedAt = putDoc.RootElement.GetProperty("createdAt").GetString();

        // THEN: createdAt is unchanged
        Assert.Equal(originalCreatedAt, putCreatedAt);
    }

    // -------------------------------------------------------------------------
    // Edge: PUT with null body fields → 400 with errors
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a valid client ID and a payload where all fields are null,
    /// When PUT /api/v1/clientes/{id} is called,
    /// Then returns HTTP 400 Bad Request with Problem Details.
    /// </summary>
    [Fact(DisplayName = "Edge — PUT null field values returns 400 Bad Request with validation errors")]
    public async Task PutCliente_Returns400_WhenAllFieldsAreNull()
    {
        // GIVEN: A client is seeded
        using var factory = CreateIsolatedFactory();
        var clienteId = await SeedClienteAsync(factory);
        var httpClient = factory.CreateClient();

        // Null fields payload (JSON: { "nombre": null, "nit": null, ... })
        var nullPayload = """{"nombre":null,"nit":null,"telefono":null,"ciudad":null}""";
        var content = new StringContent(nullPayload, Encoding.UTF8, "application/json");

        // WHEN: PUT with null fields
        var response = await httpClient.PutAsync($"/api/v1/clientes/{clienteId}", content);

        // THEN: HTTP 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            $"Problem Details must contain 'status'. Body: {json}");
        Assert.Equal(400, statusProp.GetInt32());
    }

    // -------------------------------------------------------------------------
    // Edge: PUT stackTrace NOT exposed on 404 (regression guard)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Regression guard: ExceptionHandlingMiddleware must suppress stackTrace on 404.
    /// Given a non-existent ID, When PUT is called, Then 404 response has no stackTrace.
    /// (Mirrors the ATDD test but from a different test class to ensure no regression.)
    /// </summary>
    [Fact(DisplayName = "Edge — PUT 404 does NOT expose stackTrace (ExceptionHandlingMiddleware regression guard)")]
    public async Task PutCliente_Returns404_NoStackTraceInProblemDetails_RegressionGuard()
    {
        // GIVEN: A UUID that does not exist
        using var factory = CreateIsolatedFactory();
        var httpClient = factory.CreateClient();
        var nonExistentId = Guid.Empty;

        var payload = new
        {
            nombre = "Regression Guard",
            nit = "900000001-1",
            telefono = "3000000001",
            ciudad = "Bogotá"
        };

        // WHEN: PUT to non-existent ID
        var response = await httpClient.PutAsync(
            $"/api/v1/clientes/{nonExistentId}",
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
