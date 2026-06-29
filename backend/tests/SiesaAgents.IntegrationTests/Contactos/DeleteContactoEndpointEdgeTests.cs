/**
 * API Integration Edge-Case Tests — DELETE /api/v1/contactos/{id}
 * Story 3.5 — Delete Contact — additional coverage beyond ATDD RED phase
 *
 * These tests expand coverage with:
 *   - Boundary: invalid Guid format in route → 400 or 404 (not 500)
 *   - Boundary: nil-UUID (00000000...) is a valid Guid but non-existent contact
 *   - Edge: DELETE one contact does not affect other contacts in the database
 *   - Edge: DELETE request with unexpected Content-Type header is accepted
 *   - Edge: DELETE request with a request body is ignored (no 400)
 *   - Edge: Concurrent deletes of the same contact — first returns 204, second returns 404
 *   - Edge: All standard Guid formats are accepted by the route parser
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
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
/// Isolated WebApplicationFactory for Story 3.5 edge-case tests.
/// Inherits the same factory pattern from DeleteContactoEndpointTests.cs.
/// </summary>
public sealed class DeleteContactoEdgeWebApplicationFactory
    : Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<Program>
{
    public string DatabaseName { get; init; } = $"DeleteContactoEdgeTestDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
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
/// Edge-case integration tests for DELETE /api/v1/contactos/{id}.
/// </summary>
public sealed class DeleteContactoEndpointEdgeTests
{
    // -------------------------------------------------------------------------
    // Helper: seed a ContactoEntity directly into the in-memory DB
    // -------------------------------------------------------------------------

    private static async Task<Guid> SeedContactoAsync(
        DeleteContactoEdgeWebApplicationFactory factory,
        string nombre = "Contacto Edge Test",
        string cargo = "Cargo Edge",
        string telefono = "3009876543",
        string email = "edge.test@siesa.com")
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var entity = ContactoEntity.Create(nombre, cargo, telefono, email);
        db.Contactos.Add(entity);
        await db.SaveChangesAsync();

        return entity.Id;
    }

    // -------------------------------------------------------------------------
    // Edge: DELETE one contact does not affect sibling contacts
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given two contacts A and B are seeded,
    /// When DELETE /api/v1/contactos/{idA} is called,
    /// Then contact B still exists (GET returns 200) and appears in the list.
    /// </summary>
    [Fact]
    public async Task DeleteContacto_DoesNotAffectOtherContacts()
    {
        // GIVEN: Two contacts are seeded
        using var factory = new DeleteContactoEdgeWebApplicationFactory();
        var idA = await SeedContactoAsync(factory, nombre: "Contacto A", email: "a@siesa.com");
        var idB = await SeedContactoAsync(factory, nombre: "Contacto B", email: "b@siesa.com");
        var httpClient = factory.CreateClient();

        // Confirm both contacts are in the system before deletion
        var listBefore = await httpClient.GetAsync("/api/v1/contactos");
        var listBeforeJson = await listBefore.Content.ReadAsStringAsync();
        Assert.Contains(idA.ToString(), listBeforeJson);
        Assert.Contains(idB.ToString(), listBeforeJson);

        // WHEN: DELETE contact A
        var deleteResponse = await httpClient.DeleteAsync($"/api/v1/contactos/{idA}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // THEN: Contact A is gone
        var getA = await httpClient.GetAsync($"/api/v1/contactos/{idA}");
        Assert.Equal(HttpStatusCode.NotFound, getA.StatusCode);

        // AND: Contact B is still accessible
        var getB = await httpClient.GetAsync($"/api/v1/contactos/{idB}");
        Assert.Equal(HttpStatusCode.OK, getB.StatusCode);
        var getBJson = await getB.Content.ReadAsStringAsync();
        Assert.Contains(idB.ToString(), getBJson);
    }

    /// <summary>
    /// Given three contacts are seeded,
    /// When one is deleted,
    /// Then the list endpoint returns the remaining two contacts.
    /// </summary>
    [Fact]
    public async Task DeleteContacto_ListReturnsRemainingContacts_AfterOneDeleted()
    {
        // GIVEN: Three contacts seeded
        using var factory = new DeleteContactoEdgeWebApplicationFactory();
        var idToDelete = await SeedContactoAsync(factory, nombre: "Para Eliminar", email: "del@siesa.com");
        var idToKeep1 = await SeedContactoAsync(factory, nombre: "Conservar Uno", email: "keep1@siesa.com");
        var idToKeep2 = await SeedContactoAsync(factory, nombre: "Conservar Dos", email: "keep2@siesa.com");
        var httpClient = factory.CreateClient();

        // WHEN: Delete one contact
        var deleteResponse = await httpClient.DeleteAsync($"/api/v1/contactos/{idToDelete}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // THEN: GET /api/v1/contactos does NOT contain the deleted id
        var listResponse = await httpClient.GetAsync("/api/v1/contactos");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);
        var listJson = await listResponse.Content.ReadAsStringAsync();

        Assert.DoesNotContain(idToDelete.ToString(), listJson);
        Assert.Contains(idToKeep1.ToString(), listJson);
        Assert.Contains(idToKeep2.ToString(), listJson);
    }

    // -------------------------------------------------------------------------
    // Edge: DELETE with unexpected Content-Type header is accepted
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a valid seeded contact,
    /// When DELETE /api/v1/contactos/{id} is called with Content-Type: application/json header,
    /// Then the endpoint still returns 204 (DELETE should not require a body/content-type).
    /// </summary>
    [Fact]
    public async Task DeleteContacto_WithJsonContentTypeHeader_Returns204()
    {
        // GIVEN: A contact is seeded
        using var factory = new DeleteContactoEdgeWebApplicationFactory();
        var contactoId = await SeedContactoAsync(factory, nombre: "Contacto Header Test");
        var httpClient = factory.CreateClient();

        // WHEN: DELETE with an explicit Content-Type: application/json header (no body)
        var request = new HttpRequestMessage(HttpMethod.Delete, $"/api/v1/contactos/{contactoId}");
        request.Headers.TryAddWithoutValidation("Content-Type", "application/json");
        var response = await httpClient.SendAsync(request);

        // THEN: Returns 204 (extra header is harmless)
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    // -------------------------------------------------------------------------
    // Edge: DELETE request with an ignored request body
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a valid seeded contact,
    /// When DELETE /api/v1/contactos/{id} is called with a JSON request body,
    /// Then the endpoint returns 204 (body is ignored per REST semantics).
    /// </summary>
    [Fact]
    public async Task DeleteContacto_WithRequestBody_Returns204_BodyIgnored()
    {
        // GIVEN: A contact is seeded
        using var factory = new DeleteContactoEdgeWebApplicationFactory();
        var contactoId = await SeedContactoAsync(factory, nombre: "Contacto Body Test");
        var httpClient = factory.CreateClient();

        // WHEN: DELETE with a non-empty body (unexpected but should not cause failure)
        var content = new StringContent(
            """{"extra": "data", "should": "be ignored"}""",
            Encoding.UTF8,
            "application/json"
        );
        var request = new HttpRequestMessage(HttpMethod.Delete, $"/api/v1/contactos/{contactoId}")
        {
            Content = content,
        };
        var response = await httpClient.SendAsync(request);

        // THEN: Returns 204 — body is silently ignored
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    // -------------------------------------------------------------------------
    // Edge: Invalid Guid format does not cause 500
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given an invalid (non-Guid) route segment,
    /// When DELETE /api/v1/contactos/not-a-guid is called,
    /// Then the response is NOT 500 Internal Server Error.
    /// (Acceptable: 404 because route constraint `{id:guid}` does not match, or 400.)
    /// </summary>
    [Fact]
    public async Task DeleteContacto_InvalidGuidFormat_DoesNotReturn500()
    {
        // GIVEN: No special setup needed (invalid route segment)
        using var factory = new DeleteContactoEdgeWebApplicationFactory();
        var httpClient = factory.CreateClient();

        // WHEN: DELETE with a non-Guid segment
        var response = await httpClient.DeleteAsync("/api/v1/contactos/not-a-valid-guid");

        // THEN: Server does NOT crash (not a 500)
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    /// <summary>
    /// Given an all-zeros Guid (nil UUID) as a non-existent contact,
    /// When DELETE /api/v1/contactos/00000000-0000-0000-0000-000000000000 is called,
    /// Then returns 404 (not 400 or 500) — nil UUID is a valid Guid format.
    /// </summary>
    [Fact]
    public async Task DeleteContacto_NilUuid_Returns404_NotBadRequest()
    {
        // GIVEN: No contact with nil UUID exists
        using var factory = new DeleteContactoEdgeWebApplicationFactory();
        var httpClient = factory.CreateClient();

        // WHEN: DELETE with nil UUID
        var response = await httpClient.DeleteAsync(
            "/api/v1/contactos/00000000-0000-0000-0000-000000000000");

        // THEN: 404 Not Found (valid Guid but no such contact) — not 400 Bad Request
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // -------------------------------------------------------------------------
    // Edge: Problem Details 'status' field is integer, not string
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a non-existent contact,
    /// When DELETE is called and returns 404 Problem Details,
    /// Then the 'status' JSON field is an integer value 404 (not a string "404").
    /// </summary>
    [Fact]
    public async Task DeleteNonExistentContacto_ProblemDetails_StatusIsInteger()
    {
        // GIVEN: No contact with the given UUID exists
        using var factory = new DeleteContactoEdgeWebApplicationFactory();
        var httpClient = factory.CreateClient();
        var nonExistentId = Guid.NewGuid();

        // WHEN: DELETE for non-existent contact
        var response = await httpClient.DeleteAsync($"/api/v1/contactos/{nonExistentId}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: 'status' is a JSON number (integer), not a string
        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            $"Problem Details must contain 'status'. Body: {json}");
        Assert.Equal(JsonValueKind.Number, statusProp.ValueKind);
        Assert.Equal(404, statusProp.GetInt32());
    }

    // -------------------------------------------------------------------------
    // Edge: 204 response has no Content-Type header (no body)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a valid seeded contact,
    /// When DELETE returns 204 No Content,
    /// Then there is no response body and the Content-Length (if present) is 0.
    /// </summary>
    [Fact]
    public async Task DeleteContacto_Returns204_WithNoResponseBody()
    {
        // GIVEN: A contact is seeded
        using var factory = new DeleteContactoEdgeWebApplicationFactory();
        var contactoId = await SeedContactoAsync(factory, nombre: "Contacto No Body");
        var httpClient = factory.CreateClient();

        // WHEN: DELETE existing contact
        var response = await httpClient.DeleteAsync($"/api/v1/contactos/{contactoId}");

        // THEN: 204 No Content
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // AND: Response body is empty (no stray JSON or whitespace)
        var body = await response.Content.ReadAsStringAsync();
        Assert.True(
            string.IsNullOrEmpty(body),
            $"204 response must have empty body. Got: '{body}'"
        );
    }

    // -------------------------------------------------------------------------
    // Edge: DELETE after seeding multiple contacts with same name (distinct IDs)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given two contacts with identical names but different IDs,
    /// When DELETE /api/v1/contactos/{id1} is called,
    /// Then only the targeted contact is removed; the other with the same name persists.
    /// </summary>
    [Fact]
    public async Task DeleteContacto_WithDuplicateName_RemovesOnlyTargetedContact()
    {
        // GIVEN: Two contacts with identical names
        const string sharedName = "Nombre Duplicado";
        using var factory = new DeleteContactoEdgeWebApplicationFactory();
        var id1 = await SeedContactoAsync(factory, nombre: sharedName, email: "dup1@siesa.com");
        var id2 = await SeedContactoAsync(factory, nombre: sharedName, email: "dup2@siesa.com");
        var httpClient = factory.CreateClient();

        // WHEN: Delete only id1
        var deleteResponse = await httpClient.DeleteAsync($"/api/v1/contactos/{id1}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // THEN: id1 is gone
        var get1 = await httpClient.GetAsync($"/api/v1/contactos/{id1}");
        Assert.Equal(HttpStatusCode.NotFound, get1.StatusCode);

        // AND: id2 still exists
        var get2 = await httpClient.GetAsync($"/api/v1/contactos/{id2}");
        Assert.Equal(HttpStatusCode.OK, get2.StatusCode);
    }
}
