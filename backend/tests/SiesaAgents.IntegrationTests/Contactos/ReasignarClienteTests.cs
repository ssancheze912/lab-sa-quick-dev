/**
 * API Integration Tests — Reassign Contact to Different Client
 * Story 4.6 — Reassign Contact to Different Client (ATDD RED phase)
 *
 * Reuses the existing PUT /api/v1/contactos/{id}/cliente endpoint (Story 4.2).
 * These tests verify the OVERWRITE scenario: contact already has a non-null clienteId
 * and a different clienteId is provided.
 *
 * Acceptance Criteria covered:
 *   AC #9  Handler overwrites existing clienteId with new value — no 409 conflict
 *
 * Test IDs:
 *   TC-1  PUT with clienteB where contact has clienteA → 200 OK, clienteId == clienteB
 *   TC-2  Follow-up GET confirms the new clienteId persisted (overwrite is durable)
 *   TC-3  Multiple reassignments in sequence — each replaces the previous clienteId
 *   TC-4  Reassigning to the same clienteId (idempotent overwrite) → 200 OK, no error
 *   TC-5  Response body never exposes stackTrace or exception details (NFR6)
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
 * Reuses: AssignClienteWebApplicationFactory from AssignClienteEndpointTests.cs
 *
 * Expected RED phase note:
 *   If the handler has a guard that rejects overwrite (e.g., 409 Conflict when
 *   clienteId is already set), these tests will fail — which is the RED state
 *   for AC #9. Task 1 (verify/remove guard) will make them GREEN.
 *
 * Given-When-Then format per test method.
 */

using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Contactos;

/// <summary>
/// Integration tests for the reassign-contact scenario using the existing
/// PUT /api/v1/contactos/{id}/cliente endpoint.
/// </summary>
public sealed class ReasignarClienteTests
{
    // -------------------------------------------------------------------------
    // Helper: seed a ContactoEntity with an existing clienteId (already associated)
    // -------------------------------------------------------------------------

    private static async Task<Guid> SeedContactoWithClienteAsync(
        AssignClienteWebApplicationFactory factory,
        Guid clienteId,
        string nombre = "Carlos Reasignar Seed",
        string cargo = "Coordinador",
        string telefono = "3101112233",
        string email = "carlos.reasignar@siesa.com")
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var entity = ContactoEntity.Create(nombre, cargo, telefono, email, clienteId: clienteId);
        db.Contactos.Add(entity);
        await db.SaveChangesAsync();

        return entity.Id;
    }

    private static StringContent JsonContent(object payload) =>
        new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

    // -------------------------------------------------------------------------
    // TC-1: PUT clienteB over clienteA → 200 OK with new clienteId (AC #9)
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-1 — Given a contacto already associated with clienteA,
    /// When PUT /api/v1/contactos/{id}/cliente is called with { clienteId: clienteB },
    /// Then returns HTTP 200 OK with ContactoDto where clienteId == clienteB
    /// (no 409 Conflict — overwrite is always allowed per AC #9).
    /// </summary>
    [Fact]
    public async Task TC1_PutReasignarCliente_Returns200_WithNewClienteId_WhenContactAlreadyHasCliente()
    {
        // GIVEN: A contacto already associated with clienteA
        using var factory = new AssignClienteWebApplicationFactory();
        var clienteAId = Guid.NewGuid();
        var clienteBId = Guid.NewGuid();
        var contactoId = await SeedContactoWithClienteAsync(factory, clienteAId);
        var httpClient = factory.CreateClient();

        var payload = new { clienteId = clienteBId };

        // WHEN: PUT is called with clienteB (reassignment)
        var response = await httpClient.PutAsync(
            $"/api/v1/contactos/{contactoId}/cliente",
            JsonContent(payload)
        );

        // THEN: HTTP 200 OK — no 409 Conflict
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: ContactoDto.clienteId == clienteBId
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(
            doc.RootElement.TryGetProperty("clienteId", out var clienteIdProp),
            $"Response must contain 'clienteId' field. Body: {json}"
        );
        Assert.Equal(clienteBId.ToString(), clienteIdProp.GetString());
    }

    /// <summary>
    /// TC-1 variant — Response must contain the full ContactoDto fields after reassignment.
    /// </summary>
    [Fact]
    public async Task TC1_PutReasignarCliente_ResponseBodyIsFullContactoDto()
    {
        // GIVEN: A contacto with clienteA
        using var factory = new AssignClienteWebApplicationFactory();
        var clienteAId = Guid.NewGuid();
        var clienteBId = Guid.NewGuid();
        var contactoId = await SeedContactoWithClienteAsync(
            factory, clienteAId,
            nombre: "Lucia Gomez",
            cargo: "Jefe de Cuenta",
            telefono: "3109998877",
            email: "lucia.gomez@siesa.com"
        );
        var httpClient = factory.CreateClient();

        var payload = new { clienteId = clienteBId };

        // WHEN: PUT to reassign
        var response = await httpClient.PutAsync(
            $"/api/v1/contactos/{contactoId}/cliente",
            JsonContent(payload)
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: All ContactoDto fields are present
        Assert.True(doc.RootElement.TryGetProperty("id", out var idProp));
        Assert.Equal(contactoId.ToString(), idProp.GetString());

        Assert.True(doc.RootElement.TryGetProperty("nombre", out var nombreProp));
        Assert.Equal("Lucia Gomez", nombreProp.GetString());

        Assert.True(doc.RootElement.TryGetProperty("cargo", out var cargoProp));
        Assert.Equal("Jefe de Cuenta", cargoProp.GetString());

        Assert.True(doc.RootElement.TryGetProperty("telefono", out _));
        Assert.True(doc.RootElement.TryGetProperty("email", out _));
        Assert.True(doc.RootElement.TryGetProperty("createdAt", out _));
    }

    // -------------------------------------------------------------------------
    // TC-2: Follow-up GET confirms new clienteId persisted (AC #9)
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-2 — Given a contacto reassigned from clienteA to clienteB,
    /// When GET /api/v1/contactos/{id} is called after the PUT,
    /// Then the response contains clienteId == clienteB (overwrite is durable).
    /// </summary>
    [Fact]
    public async Task TC2_FollowUpGet_ReturnsNewClienteId_AfterReassignment()
    {
        // GIVEN: Contacto associated with clienteA
        using var factory = new AssignClienteWebApplicationFactory();
        var clienteAId = Guid.NewGuid();
        var clienteBId = Guid.NewGuid();
        var contactoId = await SeedContactoWithClienteAsync(factory, clienteAId);
        var httpClient = factory.CreateClient();

        // Reassign to clienteB
        var putResponse = await httpClient.PutAsync(
            $"/api/v1/contactos/{contactoId}/cliente",
            JsonContent(new { clienteId = clienteBId })
        );
        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

        // WHEN: Follow-up GET /api/v1/contactos/{id}
        var getResponse = await httpClient.GetAsync($"/api/v1/contactos/{contactoId}");

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        // THEN: clienteId is now clienteB (overwrite persisted)
        var getJson = await getResponse.Content.ReadAsStringAsync();
        using var getDoc = JsonDocument.Parse(getJson);

        Assert.True(
            getDoc.RootElement.TryGetProperty("clienteId", out var persistedId),
            $"GET response must contain 'clienteId'. Body: {getJson}"
        );
        Assert.Equal(clienteBId.ToString(), persistedId.GetString());

        // THEN: clienteA is no longer the owner
        Assert.NotEqual(clienteAId.ToString(), persistedId.GetString());
    }

    // -------------------------------------------------------------------------
    // TC-3: Multiple reassignments in sequence (AC #9)
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-3 — Given a contacto that is reassigned multiple times,
    /// When GET is called after the final reassignment,
    /// Then the contacto holds only the last clienteId (each PUT fully replaces).
    /// </summary>
    [Fact]
    public async Task TC3_MultipleReassignments_ContactHoldsOnlyLastClienteId()
    {
        // GIVEN: Contacto starts with clienteA
        using var factory = new AssignClienteWebApplicationFactory();
        var clienteAId = Guid.NewGuid();
        var clienteBId = Guid.NewGuid();
        var clienteCId = Guid.NewGuid();
        var contactoId = await SeedContactoWithClienteAsync(factory, clienteAId);
        var httpClient = factory.CreateClient();

        // WHEN: PUT to clienteB (first reassignment)
        var resp1 = await httpClient.PutAsync(
            $"/api/v1/contactos/{contactoId}/cliente",
            JsonContent(new { clienteId = clienteBId })
        );
        Assert.Equal(HttpStatusCode.OK, resp1.StatusCode);

        // WHEN: PUT to clienteC (second reassignment)
        var resp2 = await httpClient.PutAsync(
            $"/api/v1/contactos/{contactoId}/cliente",
            JsonContent(new { clienteId = clienteCId })
        );
        Assert.Equal(HttpStatusCode.OK, resp2.StatusCode);

        // THEN: GET returns clienteC (last assignment wins)
        var getResponse = await httpClient.GetAsync($"/api/v1/contactos/{contactoId}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var json = await getResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("clienteId", out var finalClienteId));
        Assert.Equal(clienteCId.ToString(), finalClienteId.GetString());
    }

    // -------------------------------------------------------------------------
    // TC-4: Idempotent reassignment — same clienteId twice (AC #9)
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-4 — Given a contacto already linked to clienteA,
    /// When PUT is called again with the same clienteA UUID,
    /// Then the response is HTTP 200 OK with clienteId == clienteA
    /// (no error — overwriting with the same value is allowed).
    /// </summary>
    [Fact]
    public async Task TC4_PutReasignarCliente_SameClienteId_Returns200_Idempotent()
    {
        // GIVEN: Contacto associated with clienteA
        using var factory = new AssignClienteWebApplicationFactory();
        var clienteAId = Guid.NewGuid();
        var contactoId = await SeedContactoWithClienteAsync(factory, clienteAId);
        var httpClient = factory.CreateClient();

        var payload = new { clienteId = clienteAId };

        // WHEN: PUT with the same clienteId (no-op reassignment)
        var response = await httpClient.PutAsync(
            $"/api/v1/contactos/{contactoId}/cliente",
            JsonContent(payload)
        );

        // THEN: HTTP 200 OK (no 409 or 400)
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: clienteId is still clienteA
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("clienteId", out var clienteIdProp));
        Assert.Equal(clienteAId.ToString(), clienteIdProp.GetString());
    }

    // -------------------------------------------------------------------------
    // TC-5: Response body does not expose stackTrace / exception details (NFR6)
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-5 — Given a successful reassignment,
    /// When PUT /api/v1/contactos/{id}/cliente returns 200 OK,
    /// Then the response body does NOT contain stackTrace, exception, or
    /// innerException keys (no internal detail leakage per NFR6).
    /// This is a sanity check for the success path — error paths are covered in Story 4.2.
    /// </summary>
    [Fact]
    public async Task TC5_PutReasignarCliente_SuccessResponse_DoesNotExposeInternalDetails()
    {
        // GIVEN: A contacto with clienteA, being reassigned to clienteB
        using var factory = new AssignClienteWebApplicationFactory();
        var clienteAId = Guid.NewGuid();
        var clienteBId = Guid.NewGuid();
        var contactoId = await SeedContactoWithClienteAsync(factory, clienteAId);
        var httpClient = factory.CreateClient();

        var payload = new { clienteId = clienteBId };

        // WHEN: PUT to reassign
        var response = await httpClient.PutAsync(
            $"/api/v1/contactos/{contactoId}/cliente",
            JsonContent(payload)
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: No technical error details are exposed in the 200 response
        Assert.False(
            doc.RootElement.TryGetProperty("stackTrace", out _),
            $"Success response must NOT expose 'stackTrace'. Body: {json}"
        );
        Assert.False(
            doc.RootElement.TryGetProperty("exception", out _),
            $"Success response must NOT expose 'exception'. Body: {json}"
        );
        Assert.False(
            doc.RootElement.TryGetProperty("innerException", out _),
            $"Success response must NOT expose 'innerException'. Body: {json}"
        );
    }
}
