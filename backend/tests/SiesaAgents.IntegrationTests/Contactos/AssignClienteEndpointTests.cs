/**
 * API Integration Tests — PUT /api/v1/contactos/{id}/cliente
 * Story 4.2 — Associate & Disassociate Contacts from Client (ATDD RED phase)
 *
 * Test IDs covered:
 *   TC-1  PUT /api/v1/contactos/{existingId}/cliente with { clienteId: validUuid }
 *         → 200 OK with updated ContactoDto containing new clienteId (AC #2)
 *   TC-2  PUT /api/v1/contactos/{existingId}/cliente with { clienteId: null }
 *         → 200 OK, ContactoDto.clienteId is null (AC #5)
 *   TC-3  PUT /api/v1/contactos/{unknownId}/cliente with valid body
 *         → 404 Problem Details, no stackTrace (AC #2 / error path)
 *   TC-4  PUT /api/v1/contactos/{existingId}/cliente with invalid body (empty Guid path param)
 *         → 400 Problem Details, no stackTrace (AC #2 / validation)
 *   TC-5  Contact with clienteId set to null still accessible via GET /api/v1/contactos/{id}
 *         → 200 OK with clienteId: null (AC #5 — contact not deleted)
 *   TC-6  PUT twice in sequence: associate then disassociate → final clienteId is null (AC #5, #6)
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
 *
 * Expected RED failures (missing implementation):
 *   - PUT /api/v1/contactos/{id}/cliente not yet registered → 404 or 405
 *   - AssignClienteCommandHandler not yet created
 *   - AssignClienteCommandValidator not yet created
 *   - ContactoEntity.AssignCliente() not yet added
 *
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
/// Isolated WebApplicationFactory for Story 4.2 assign-cliente endpoint tests.
/// Each test class instance uses a unique in-memory database to prevent cross-test pollution.
/// </summary>
public sealed class AssignClienteWebApplicationFactory : WebApplicationFactory<Program>
{
    public string DatabaseName { get; init; } = $"AssignClienteTestDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove all EF Core configuration services for AppDbContext to avoid
            // "dual provider" errors when swapping to InMemoryDatabase.
            var dbContextOptionsConfigType =
                typeof(Microsoft.EntityFrameworkCore.Infrastructure.IDbContextOptionsConfiguration<AppDbContext>);

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
/// Integration tests for PUT /api/v1/contactos/{id}/cliente endpoint.
/// </summary>
public sealed class AssignClienteEndpointTests
{
    // -------------------------------------------------------------------------
    // Helper: seed a ContactoEntity directly into the in-memory DB
    // -------------------------------------------------------------------------

    private static async Task<Guid> SeedContactoAsync(
        AssignClienteWebApplicationFactory factory,
        string nombre = "Carlos Ruiz Seed",
        string cargo = "Analista",
        string telefono = "3109876543",
        string email = "carlos.ruiz.seed@siesa.com",
        Guid? clienteId = null)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Use the factory method with optional clienteId parameter
        var entity = ContactoEntity.Create(nombre, cargo, telefono, email, clienteId: clienteId);

        db.Contactos.Add(entity);
        await db.SaveChangesAsync();

        return entity.Id;
    }

    // -------------------------------------------------------------------------
    // TC-1: PUT with valid clienteId → 200 OK, ContactoDto with new clienteId
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-1 — Given a contacto without a client association,
    /// When PUT /api/v1/contactos/{id}/cliente is called with a valid clienteId UUID,
    /// Then returns HTTP 200 OK with an updated ContactoDto where clienteId matches
    /// the provided UUID, and a follow-up GET confirms the association persists.
    /// </summary>
    [Fact]
    public async Task TC1_PutAssignCliente_Returns200_WithUpdatedClienteId_WhenValid()
    {
        // GIVEN: A contacto seeded without a client association
        using var factory = new AssignClienteWebApplicationFactory();
        var contactoId = await SeedContactoAsync(factory);
        var httpClient = factory.CreateClient();

        var newClienteId = Guid.NewGuid();
        var payload = new { clienteId = newClienteId };

        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: PUT /api/v1/contactos/{id}/cliente is called with a valid clienteId
        var response = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}/cliente", content);

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Response body is a ContactoDto (direct object, no wrapper)
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: id matches the seeded contacto
        Assert.True(doc.RootElement.TryGetProperty("id", out var idProp),
            $"Response must contain 'id' field. Body: {json}");
        Assert.Equal(contactoId.ToString(), idProp.GetString());

        // THEN: clienteId is now the provided UUID
        Assert.True(doc.RootElement.TryGetProperty("clienteId", out var clienteIdProp),
            $"Response must contain 'clienteId' field. Body: {json}");
        Assert.Equal(newClienteId.ToString(), clienteIdProp.GetString());

        // THEN: nombre, cargo, telefono, email remain unchanged
        Assert.True(doc.RootElement.TryGetProperty("nombre", out _),
            $"Response must contain 'nombre' field. Body: {json}");
        Assert.True(doc.RootElement.TryGetProperty("cargo", out _),
            $"Response must contain 'cargo' field. Body: {json}");
        Assert.True(doc.RootElement.TryGetProperty("telefono", out _),
            $"Response must contain 'telefono' field. Body: {json}");
        Assert.True(doc.RootElement.TryGetProperty("email", out _),
            $"Response must contain 'email' field. Body: {json}");

        // THEN: updatedAt is present with timezone info (DateTimeOffset ISO 8601 with TZ)
        Assert.True(doc.RootElement.TryGetProperty("updatedAt", out var updatedAtProp),
            $"Response must contain 'updatedAt' field. Body: {json}");
        var updatedAtStr = updatedAtProp.GetString();
        Assert.False(string.IsNullOrEmpty(updatedAtStr), "'updatedAt' must not be empty");
        Assert.True(
            DateTimeOffset.TryParse(updatedAtStr, out _),
            $"'updatedAt' must be valid DateTimeOffset ISO 8601 but got: {updatedAtStr}"
        );

        // THEN: Follow-up GET /api/v1/contactos/{id} confirms clienteId persisted
        var getResponse = await httpClient.GetAsync($"/api/v1/contactos/{contactoId}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var getJson = await getResponse.Content.ReadAsStringAsync();
        using var getDoc = JsonDocument.Parse(getJson);
        Assert.True(getDoc.RootElement.TryGetProperty("clienteId", out var persistedClienteId),
            $"Follow-up GET response must contain 'clienteId'. Body: {getJson}");
        Assert.Equal(newClienteId.ToString(), persistedClienteId.GetString());
    }

    /// <summary>
    /// TC-1 variant — Content-Type of 200 response is application/json.
    /// </summary>
    [Fact]
    public async Task PutAssignCliente_Returns200_WithJsonContentType()
    {
        // GIVEN: A contacto seeded without a client
        using var factory = new AssignClienteWebApplicationFactory();
        var contactoId = await SeedContactoAsync(factory);
        var httpClient = factory.CreateClient();

        var payload = new { clienteId = Guid.NewGuid() };
        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: PUT /api/v1/contactos/{id}/cliente
        var response = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}/cliente", content);

        // THEN: HTTP 200 and Content-Type is application/json
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.Contains("application/json", contentType);
    }

    // -------------------------------------------------------------------------
    // TC-2: PUT with clienteId: null → 200 OK, ContactoDto.clienteId is null
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-2 — Given a contacto already linked to a client,
    /// When PUT /api/v1/contactos/{id}/cliente is called with { clienteId: null },
    /// Then returns HTTP 200 OK with ContactoDto where clienteId is null (disassociation).
    /// </summary>
    [Fact]
    public async Task TC2_PutAssignCliente_WithNullClienteId_Returns200_WithNullClienteId()
    {
        // GIVEN: A contacto seeded with a linked clienteId
        using var factory = new AssignClienteWebApplicationFactory();
        var existingClienteId = Guid.NewGuid();
        var contactoId = await SeedContactoAsync(factory, clienteId: existingClienteId);
        var httpClient = factory.CreateClient();

        // Payload with null clienteId = disassociate
        var payload = new { clienteId = (Guid?)null };
        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: PUT /api/v1/contactos/{id}/cliente with { clienteId: null }
        var response = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}/cliente", content);

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: ContactoDto.clienteId is null (disassociated)
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("clienteId", out var clienteIdProp),
            $"Response must contain 'clienteId' field. Body: {json}");
        Assert.Equal(JsonValueKind.Null, clienteIdProp.ValueKind);
    }

    /// <summary>
    /// TC-2 variant — After disassociation, follow-up GET confirms clienteId is null.
    /// </summary>
    [Fact]
    public async Task PutAssignCliente_WithNullClienteId_PersistsNull_OnFollowUpGet()
    {
        // GIVEN: A contacto with a linked client
        using var factory = new AssignClienteWebApplicationFactory();
        var existingClienteId = Guid.NewGuid();
        var contactoId = await SeedContactoAsync(factory, clienteId: existingClienteId);
        var httpClient = factory.CreateClient();

        var payload = new { clienteId = (Guid?)null };
        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: PUT with null clienteId
        var response = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}/cliente", content);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Follow-up GET confirms clienteId is null (contact still exists)
        var getResponse = await httpClient.GetAsync($"/api/v1/contactos/{contactoId}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var getJson = await getResponse.Content.ReadAsStringAsync();
        using var getDoc = JsonDocument.Parse(getJson);

        Assert.True(getDoc.RootElement.TryGetProperty("clienteId", out var persistedClienteId),
            $"Follow-up GET response must contain 'clienteId'. Body: {getJson}");
        Assert.Equal(JsonValueKind.Null, persistedClienteId.ValueKind);
    }

    // -------------------------------------------------------------------------
    // TC-3: PUT to unknown contactoId → 404 Problem Details, no stackTrace
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-3 — Given a contacto UUID that does not exist in the database,
    /// When PUT /api/v1/contactos/{unknownId}/cliente is called with a valid payload,
    /// Then returns HTTP 404 Not Found with Problem Details RFC 7807:
    ///   - status: 404
    ///   - Content-Type: application/problem+json
    ///   - NO stackTrace key
    /// </summary>
    [Fact]
    public async Task TC3_PutAssignCliente_Returns404_WithProblemDetails_WhenContactoNotFound()
    {
        // GIVEN: A UUID that has not been seeded
        using var factory = new AssignClienteWebApplicationFactory();
        var httpClient = factory.CreateClient();
        var nonExistentId = Guid.NewGuid();

        var payload = new { clienteId = Guid.NewGuid() };
        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: PUT /api/v1/contactos/{non-existent-id}/cliente
        var response = await httpClient.PutAsync($"/api/v1/contactos/{nonExistentId}/cliente", content);

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

        // THEN: No stackTrace, exception, or innerException keys exposed (NFR6)
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
    // TC-4: PUT with invalid path param (empty Guid) → 400 Problem Details
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-4 — Given an invalid/empty Guid as the path parameter (Guid.Empty),
    /// When PUT /api/v1/contactos/{invalidId}/cliente is called,
    /// Then returns HTTP 400 Bad Request with Problem Details RFC 7807:
    ///   - status: 400
    ///   - Content-Type: application/problem+json
    ///   - NO stackTrace key
    /// </summary>
    [Fact]
    public async Task TC4_PutAssignCliente_Returns400_WithProblemDetails_WhenContactoIdIsEmptyGuid()
    {
        // GIVEN: Guid.Empty as the contacto ID (invalid per business rule)
        using var factory = new AssignClienteWebApplicationFactory();
        var httpClient = factory.CreateClient();

        var payload = new { clienteId = Guid.NewGuid() };
        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: PUT /api/v1/contactos/{Guid.Empty}/cliente
        var response = await httpClient.PutAsync($"/api/v1/contactos/{Guid.Empty}/cliente", content);

        // THEN: HTTP 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // THEN: Response body is Problem Details
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            $"Problem Details must contain 'status' field. Body: {json}");
        Assert.Equal(400, statusProp.GetInt32());

        // THEN: No stackTrace exposed (NFR6)
        Assert.False(
            doc.RootElement.TryGetProperty("stackTrace", out _),
            $"Response must NOT expose 'stackTrace' key. Body: {json}"
        );
    }

    // -------------------------------------------------------------------------
    // TC-5: Contact accessible after disassociation via GET — not deleted
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-5 — Given a contacto that is disassociated (clienteId set to null),
    /// When GET /api/v1/contactos/{id} is called,
    /// Then returns HTTP 200 OK with clienteId: null — the contact record still exists.
    /// This verifies AC #5: disassociation does NOT delete the contact.
    /// </summary>
    [Fact]
    public async Task TC5_GetContacto_Returns200_WithNullClienteId_AfterDisassociation()
    {
        // GIVEN: A contacto seeded with a linked cliente, then disassociated
        using var factory = new AssignClienteWebApplicationFactory();
        var existingClienteId = Guid.NewGuid();
        var contactoId = await SeedContactoAsync(factory, clienteId: existingClienteId);
        var httpClient = factory.CreateClient();

        // Disassociate the contact
        var disassociatePayload = new { clienteId = (Guid?)null };
        var disassociateContent = new StringContent(
            JsonSerializer.Serialize(disassociatePayload),
            Encoding.UTF8,
            "application/json"
        );

        var putResponse = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}/cliente", disassociateContent);
        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

        // WHEN: GET /api/v1/contactos/{id} is called after disassociation
        var getResponse = await httpClient.GetAsync($"/api/v1/contactos/{contactoId}");

        // THEN: HTTP 200 OK — contact still exists
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        // THEN: clienteId is null (disassociated, not deleted)
        var getJson = await getResponse.Content.ReadAsStringAsync();
        using var getDoc = JsonDocument.Parse(getJson);

        Assert.True(getDoc.RootElement.TryGetProperty("id", out var idProp),
            $"GET response must contain 'id'. Body: {getJson}");
        Assert.Equal(contactoId.ToString(), idProp.GetString());

        Assert.True(getDoc.RootElement.TryGetProperty("clienteId", out var clienteIdProp),
            $"GET response must contain 'clienteId'. Body: {getJson}");
        Assert.Equal(JsonValueKind.Null, clienteIdProp.ValueKind);
    }

    // -------------------------------------------------------------------------
    // TC-6: Associate then disassociate — final state is null (idempotency check)
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-6 — Given a contacto with no client,
    /// When it is first associated and then disassociated,
    /// Then the final clienteId is null (correct sequential state transitions).
    /// Verifies both AC #2 (associate) and AC #5 (disassociate).
    /// </summary>
    [Fact]
    public async Task TC6_PutAssignCliente_SequentialAssociateThenDisassociate_FinalClienteIdIsNull()
    {
        // GIVEN: A contacto without any client association
        using var factory = new AssignClienteWebApplicationFactory();
        var contactoId = await SeedContactoAsync(factory);
        var httpClient = factory.CreateClient();

        var targetClienteId = Guid.NewGuid();

        // STEP 1: Associate the contacto to a client
        var associatePayload = new { clienteId = targetClienteId };
        var associateContent = new StringContent(
            JsonSerializer.Serialize(associatePayload),
            Encoding.UTF8,
            "application/json"
        );

        var associateResponse = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}/cliente", associateContent);
        Assert.Equal(HttpStatusCode.OK, associateResponse.StatusCode);

        // Verify clienteId is set
        var associateJson = await associateResponse.Content.ReadAsStringAsync();
        using var associateDoc = JsonDocument.Parse(associateJson);
        Assert.True(associateDoc.RootElement.TryGetProperty("clienteId", out var associatedClienteId));
        Assert.Equal(targetClienteId.ToString(), associatedClienteId.GetString());

        // STEP 2: Disassociate the contacto
        var disassociatePayload = new { clienteId = (Guid?)null };
        var disassociateContent = new StringContent(
            JsonSerializer.Serialize(disassociatePayload),
            Encoding.UTF8,
            "application/json"
        );

        var disassociateResponse = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}/cliente", disassociateContent);

        // THEN: HTTP 200 OK and final clienteId is null
        Assert.Equal(HttpStatusCode.OK, disassociateResponse.StatusCode);

        var disassociateJson = await disassociateResponse.Content.ReadAsStringAsync();
        using var disassociateDoc = JsonDocument.Parse(disassociateJson);

        Assert.True(disassociateDoc.RootElement.TryGetProperty("clienteId", out var finalClienteId),
            $"Response must contain 'clienteId'. Body: {disassociateJson}");
        Assert.Equal(JsonValueKind.Null, finalClienteId.ValueKind);
    }

    /// <summary>
    /// TC-6 variant — Reassigning a contacto from one client to another.
    /// Given a contacto linked to clienteA,
    /// When PUT is called with clienteB's ID,
    /// Then the contacto is now linked to clienteB.
    /// </summary>
    [Fact]
    public async Task PutAssignCliente_ReassignFromOneClientToAnother_UpdatesClienteId()
    {
        // GIVEN: A contacto linked to clienteA
        using var factory = new AssignClienteWebApplicationFactory();
        var clienteAId = Guid.NewGuid();
        var clienteBId = Guid.NewGuid();
        var contactoId = await SeedContactoAsync(factory, clienteId: clienteAId);
        var httpClient = factory.CreateClient();

        // WHEN: PUT with clienteBId
        var payload = new { clienteId = clienteBId };
        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        var response = await httpClient.PutAsync($"/api/v1/contactos/{contactoId}/cliente", content);

        // THEN: HTTP 200 OK and clienteId is now clienteBId
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("clienteId", out var clienteIdProp),
            $"Response must contain 'clienteId'. Body: {json}");
        Assert.Equal(clienteBId.ToString(), clienteIdProp.GetString());
    }
}
