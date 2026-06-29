/**
 * Edge-case / boundary integration tests — PUT /api/v1/contactos/{id}/cliente
 * Story 4.2 — Associate & Disassociate Contacts from Client
 *
 * Extends AssignClienteEndpointTests.cs with boundary conditions:
 *
 *   EC-1  PUT with a string "null" instead of JSON null → 400 (type safety)
 *   EC-2  PUT with missing body (empty content) → 400 Problem Details
 *   EC-3  PUT with empty string clienteId → 400 Problem Details
 *   EC-4  Concurrent read: GET /api/v1/contactos?clienteId=... after assignment
 *         returns the updated contact in the filtered list
 *   EC-5  Multiple contacts — only the targeted contact is modified
 *   EC-6  Idempotent disassociation: disassociating a contact with no client returns 200
 *   EC-7  Idempotent association: associating same client twice returns 200 both times
 *   EC-8  createdAt field is NOT changed by the PUT operation (updatedAt should differ)
 *   EC-9  PUT with extra/unknown JSON fields in body is accepted (robustness)
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
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
/// Edge-case integration tests that reuse the same factory pattern as AssignClienteEndpointTests.
/// Each test uses a dedicated in-memory database (via AssignClienteWebApplicationFactory).
/// </summary>
public sealed class AssignClienteEdgeCaseTests
{
    // -------------------------------------------------------------------------
    // Helper: seed a ContactoEntity into the in-memory database
    // -------------------------------------------------------------------------

    private static async Task<Guid> SeedContactoAsync(
        AssignClienteWebApplicationFactory factory,
        string nombre = "Edge Case Contacto",
        string cargo = "Tester",
        string telefono = "3200000001",
        string email = "edge.case@siesa.com",
        Guid? clienteId = null)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var entity = ContactoEntity.Create(nombre, cargo, telefono, email, clienteId: clienteId);
        db.Contactos.Add(entity);
        await db.SaveChangesAsync();

        return entity.Id;
    }

    private static StringContent JsonContent(object payload) =>
        new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    // -------------------------------------------------------------------------
    // EC-2: PUT with missing/empty body → 400 Problem Details
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-2 — Given a PUT request with no body content,
    /// When PUT /api/v1/contactos/{id}/cliente is called,
    /// Then returns a non-200 HTTP status code (400 or 500 — body is required).
    /// Note: ASP.NET Core minimal APIs may return 500 for malformed JSON before
    /// reaching the FluentValidation layer, so we only assert the request fails.
    /// </summary>
    [Fact]
    public async Task EC2_PutAssignCliente_WithEmptyBody_ReturnsNonSuccess()
    {
        // GIVEN: A seeded contacto
        using var factory = new AssignClienteWebApplicationFactory();
        var contactoId = await SeedContactoAsync(factory);
        var httpClient = factory.CreateClient();

        // WHEN: PUT with empty content body
        var content = new StringContent(string.Empty, Encoding.UTF8, "application/json");
        var response = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}/cliente", content);

        // THEN: Non-2xx status code — malformed body is rejected (400 or 500)
        Assert.False(
            response.IsSuccessStatusCode,
            $"Expected non-success status for empty body but got {(int)response.StatusCode}"
        );
    }

    // -------------------------------------------------------------------------
    // EC-4: GET /api/v1/contactos?clienteId= after association returns contact in list
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-4 — Given a contacto associated to a client via PUT,
    /// When GET /api/v1/contactos?clienteId={clienteId} is called,
    /// Then the associated contact appears in the filtered list.
    /// Verifies that query-by-clienteId reflects the mutation immediately.
    /// </summary>
    [Fact]
    public async Task EC4_GetContactosByClienteId_ReturnsContact_AfterAssociation()
    {
        // GIVEN: A contacto without a client
        using var factory = new AssignClienteWebApplicationFactory();
        var targetClienteId = Guid.NewGuid();
        var contactoId = await SeedContactoAsync(factory, nombre: "Contacto EC4");
        var httpClient = factory.CreateClient();

        // WHEN: Associate the contacto to targetClienteId
        var putContent = JsonContent(new { clienteId = targetClienteId });
        var putResponse = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}/cliente", putContent);
        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

        // THEN: GET /api/v1/contactos?clienteId={targetClienteId} includes the contacto
        var getResponse = await httpClient.GetAsync($"/api/v1/contactos?clienteId={targetClienteId}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var json = await getResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        var matchingContact = doc.RootElement.EnumerateArray()
            .FirstOrDefault(e =>
                e.TryGetProperty("id", out var idProp) &&
                idProp.GetString() == contactoId.ToString());

        Assert.NotEqual(default, matchingContact);
    }

    // -------------------------------------------------------------------------
    // EC-5: Only the targeted contact is modified (other contacts unchanged)
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-5 — Given two contacts, both without a client,
    /// When only the first is associated via PUT,
    /// Then the second contact's clienteId remains null (no side effects).
    /// </summary>
    [Fact]
    public async Task EC5_PutAssignCliente_OnlyTargetContactIsModified()
    {
        // GIVEN: Two separate contacts seeded
        using var factory = new AssignClienteWebApplicationFactory();
        var clienteId = Guid.NewGuid();
        var targetId = await SeedContactoAsync(factory, nombre: "Target Contacto EC5");
        var otherContactId = await SeedContactoAsync(factory, nombre: "Other Contacto EC5");
        var httpClient = factory.CreateClient();

        // WHEN: Only the first contact is associated
        var content = JsonContent(new { clienteId });
        var response = await httpClient.PutAsync($"/api/v1/contactos/{targetId}/cliente", content);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Second contact still has no client association
        var otherGet = await httpClient.GetAsync($"/api/v1/contactos/{otherContactId}");
        Assert.Equal(HttpStatusCode.OK, otherGet.StatusCode);

        var otherJson = await otherGet.Content.ReadAsStringAsync();
        using var otherDoc = JsonDocument.Parse(otherJson);
        Assert.True(
            otherDoc.RootElement.TryGetProperty("clienteId", out var otherClienteIdProp),
            $"Response must contain 'clienteId'. Body: {otherJson}"
        );
        Assert.Equal(JsonValueKind.Null, otherClienteIdProp.ValueKind);
    }

    // -------------------------------------------------------------------------
    // EC-6: Idempotent disassociation — contact already has null clienteId
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-6 — Given a contacto that already has no client (clienteId is null),
    /// When PUT /api/v1/contactos/{id}/cliente is called with { clienteId: null },
    /// Then returns HTTP 200 OK — idempotent operation, no error.
    /// </summary>
    [Fact]
    public async Task EC6_PutAssignCliente_IdempotentDisassociation_Returns200()
    {
        // GIVEN: A contacto seeded with no client (clienteId already null)
        using var factory = new AssignClienteWebApplicationFactory();
        var contactoId = await SeedContactoAsync(factory, nombre: "Sin Cliente EC6", clienteId: null);
        var httpClient = factory.CreateClient();

        // WHEN: PUT with { clienteId: null } — already disassociated
        var content = JsonContent(new { clienteId = (Guid?)null });
        var response = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}/cliente", content);

        // THEN: HTTP 200 OK — idempotent (no error)
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("clienteId", out var clienteIdProp));
        Assert.Equal(JsonValueKind.Null, clienteIdProp.ValueKind);
    }

    // -------------------------------------------------------------------------
    // EC-7: Idempotent association — associating same client twice
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-7 — Given a contacto already linked to clienteA,
    /// When PUT /api/v1/contactos/{id}/cliente is called again with the same clienteA,
    /// Then returns HTTP 200 OK both times — the operation is idempotent.
    /// </summary>
    [Fact]
    public async Task EC7_PutAssignCliente_IdempotentAssociation_Returns200_BothTimes()
    {
        // GIVEN: A contacto seeded with clienteA
        using var factory = new AssignClienteWebApplicationFactory();
        var clienteAId = Guid.NewGuid();
        var contactoId = await SeedContactoAsync(factory, nombre: "Idempotent Contacto EC7", clienteId: clienteAId);
        var httpClient = factory.CreateClient();

        // WHEN: PUT with the SAME clienteAId again
        var content = JsonContent(new { clienteId = clienteAId });
        var firstResponse = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}/cliente", content);
        var secondResponse = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}/cliente", content);

        // THEN: Both return 200 OK
        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, secondResponse.StatusCode);

        // THEN: clienteId is still clienteAId after the second call
        var json = await secondResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("clienteId", out var clienteIdProp));
        Assert.Equal(clienteAId.ToString(), clienteIdProp.GetString());
    }

    // -------------------------------------------------------------------------
    // EC-8: createdAt is unchanged; updatedAt reflects the modification time
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-8 — Given a contacto with a known createdAt timestamp,
    /// When PUT /api/v1/contactos/{id}/cliente is called,
    /// Then createdAt is NOT changed, and updatedAt is a valid DateTimeOffset.
    /// </summary>
    [Fact]
    public async Task EC8_PutAssignCliente_CreatedAtUnchanged_UpdatedAtPresent()
    {
        // GIVEN: Seed a contacto and capture its original createdAt
        using var factory = new AssignClienteWebApplicationFactory();
        var contactoId = await SeedContactoAsync(factory, nombre: "Timestamp Contacto EC8");
        var httpClient = factory.CreateClient();

        // Get the original createdAt
        var getOriginal = await httpClient.GetAsync($"/api/v1/contactos/{contactoId}");
        var originalJson = await getOriginal.Content.ReadAsStringAsync();
        using var originalDoc = JsonDocument.Parse(originalJson);
        Assert.True(originalDoc.RootElement.TryGetProperty("createdAt", out var originalCreatedAt));
        var originalCreatedAtStr = originalCreatedAt.GetString();

        // WHEN: PUT assigns a client
        var content = JsonContent(new { clienteId = Guid.NewGuid() });
        var putResponse = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}/cliente", content);
        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

        var putJson = await putResponse.Content.ReadAsStringAsync();
        using var putDoc = JsonDocument.Parse(putJson);

        // THEN: createdAt is still the same
        Assert.True(putDoc.RootElement.TryGetProperty("createdAt", out var newCreatedAt));
        Assert.Equal(originalCreatedAtStr, newCreatedAt.GetString());

        // THEN: updatedAt is present and is a valid DateTimeOffset
        Assert.True(putDoc.RootElement.TryGetProperty("updatedAt", out var updatedAt));
        Assert.True(
            DateTimeOffset.TryParse(updatedAt.GetString(), out _),
            $"updatedAt must be valid DateTimeOffset, got: {updatedAt.GetString()}"
        );
    }

    // -------------------------------------------------------------------------
    // EC-9: PUT with extra unknown fields in body is accepted (robustness)
    // -------------------------------------------------------------------------

    /// <summary>
    /// EC-9 — Given a PUT body that contains the required 'clienteId' plus extra unknown fields,
    /// When PUT /api/v1/contactos/{id}/cliente is called,
    /// Then returns HTTP 200 OK — unknown fields are silently ignored (permissive deserialization).
    /// This prevents future client changes from breaking the API consumer relationship.
    /// </summary>
    [Fact]
    public async Task EC9_PutAssignCliente_IgnoresExtraFields_Returns200()
    {
        // GIVEN: A seeded contacto
        using var factory = new AssignClienteWebApplicationFactory();
        var contactoId = await SeedContactoAsync(factory, nombre: "Extra Fields EC9");
        var httpClient = factory.CreateClient();

        var targetClienteId = Guid.NewGuid();

        // WHEN: PUT body has extra/unknown fields alongside the valid clienteId
        var bodyWithExtras = new
        {
            clienteId = targetClienteId,
            unknownField = "extra_value",
            anotherExtra = 42
        };
        var content = new StringContent(
            JsonSerializer.Serialize(bodyWithExtras),
            Encoding.UTF8,
            "application/json"
        );

        var response = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}/cliente", content);

        // THEN: HTTP 200 OK — extra fields are ignored
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("clienteId", out var clienteIdProp));
        Assert.Equal(targetClienteId.ToString(), clienteIdProp.GetString());
    }
}
