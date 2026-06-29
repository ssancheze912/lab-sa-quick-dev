/**
 * API Integration Tests — DELETE /api/v1/contactos/{id}
 * Story 3.5 — Delete Contact (ATDD RED phase)
 *
 * Test IDs covered:
 *   TC-E3-P0-delete-api-01  Seed 1 contact; DELETE /api/v1/contactos/{contactoId};
 *                           assert 204 No Content; follow-up GET /api/v1/contactos/{contactoId} → 404.
 *   TC-E3-P2-delete-api-02  DELETE /api/v1/contactos/00000000-0000-0000-0000-000000000000;
 *                           assert 404 Problem Details with status: 404; assert no stackTrace key.
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
 *
 * Expected RED failures:
 *   - DELETE /api/v1/contactos/{id} not yet registered → 404 or 405 Not Found/Method Not Allowed
 *   - DeleteContactoCommandHandler not yet implemented
 *   - IContactoRepository.DeleteAsync not yet defined
 *
 * Given-When-Then format per test method.
 */

using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Contactos;

/// <summary>
/// Isolated WebApplicationFactory for Story 3.5 delete endpoint tests.
/// Each test class instance gets a unique in-memory database name to prevent
/// cross-test data pollution.
/// </summary>
public sealed class DeleteContactoWebApplicationFactory : WebApplicationFactory<Program>
{
    public string DatabaseName { get; init; } = $"DeleteContactoTestDb_{Guid.NewGuid()}";

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
/// Integration tests for DELETE /api/v1/contactos/{id} endpoint.
/// Each test that needs isolation creates its own factory with a unique DB name.
/// </summary>
public sealed class DeleteContactoEndpointTests
{
    // -------------------------------------------------------------------------
    // Helper: seed a ContactoEntity directly into the in-memory DB
    // -------------------------------------------------------------------------

    private static async Task<Guid> SeedContactoAsync(
        DeleteContactoWebApplicationFactory factory,
        string nombre = "Contacto Para Eliminar",
        string cargo = "Cargo Test",
        string telefono = "3001234567",
        string email = "contacto.eliminar@test.com")
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var entity = ContactoEntity.Create(nombre, cargo, telefono, email);
        db.Contactos.Add(entity);
        await db.SaveChangesAsync();

        return entity.Id;
    }

    // -------------------------------------------------------------------------
    // TC-E3-P0-delete-api-01: DELETE existing contact → 204 No Content + follow-up GET → 404
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-E3-P0-delete-api-01 — Given a seeded contact,
    /// When DELETE /api/v1/contactos/{id} is called,
    /// Then returns HTTP 204 No Content with no response body.
    /// And a follow-up GET /api/v1/contactos/{id} returns 404 (contact is gone).
    /// </summary>
    [Fact]
    public async Task TC_E3_P0_DeleteApi_01_DeleteContacto_Returns204_AndContactIsGone()
    {
        // GIVEN: A contact is seeded in the database
        using var factory = new DeleteContactoWebApplicationFactory();
        var contactoId = await SeedContactoAsync(factory);
        var httpClient = factory.CreateClient();

        // WHEN: DELETE /api/v1/contactos/{id} is called
        var deleteResponse = await httpClient.DeleteAsync($"/api/v1/contactos/{contactoId}");

        // THEN: HTTP 204 No Content
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // THEN: Response body is empty (204 should have no body)
        var responseBody = await deleteResponse.Content.ReadAsStringAsync();
        Assert.True(
            string.IsNullOrEmpty(responseBody),
            $"Response body should be empty for 204 but got: {responseBody}"
        );

        // AND: Follow-up GET /api/v1/contactos/{id} returns 404 (contact is gone)
        var getResponse = await httpClient.GetAsync($"/api/v1/contactos/{contactoId}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    /// <summary>
    /// TC-E3-P0-delete-api-01 variant — Seeded contact does NOT appear in GET /api/v1/contactos
    /// list after deletion.
    /// </summary>
    [Fact]
    public async Task DeleteContacto_RemovedFromList_AfterDeletion()
    {
        // GIVEN: A contact is seeded
        using var factory = new DeleteContactoWebApplicationFactory();
        var contactoId = await SeedContactoAsync(factory, nombre: "Contacto A Eliminar Lista");
        var httpClient = factory.CreateClient();

        // Confirm contact is in the list before deletion
        var listBefore = await httpClient.GetAsync("/api/v1/contactos");
        Assert.Equal(HttpStatusCode.OK, listBefore.StatusCode);
        var listBeforeJson = await listBefore.Content.ReadAsStringAsync();
        Assert.Contains(contactoId.ToString(), listBeforeJson);

        // WHEN: DELETE /api/v1/contactos/{id} is called
        var deleteResponse = await httpClient.DeleteAsync($"/api/v1/contactos/{contactoId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // THEN: GET /api/v1/contactos list does NOT contain the deleted contact id
        var listAfter = await httpClient.GetAsync("/api/v1/contactos");
        Assert.Equal(HttpStatusCode.OK, listAfter.StatusCode);
        var listAfterJson = await listAfter.Content.ReadAsStringAsync();
        Assert.DoesNotContain(contactoId.ToString(), listAfterJson);
    }

    /// <summary>
    /// TC-E3-P0-delete-api-01 variant — Second DELETE on the same ID returns 404,
    /// not 500 or crash (idempotent 404 behavior).
    /// </summary>
    [Fact]
    public async Task DeleteContacto_SecondDelete_Returns404_NotServerError()
    {
        // GIVEN: A contact is seeded and then deleted once
        using var factory = new DeleteContactoWebApplicationFactory();
        var contactoId = await SeedContactoAsync(factory, nombre: "Contacto Doble Delete");
        var httpClient = factory.CreateClient();

        var firstDelete = await httpClient.DeleteAsync($"/api/v1/contactos/{contactoId}");
        Assert.Equal(HttpStatusCode.NoContent, firstDelete.StatusCode);

        // WHEN: DELETE /api/v1/contactos/{id} is called a second time
        var secondDelete = await httpClient.DeleteAsync($"/api/v1/contactos/{contactoId}");

        // THEN: Returns 404 Not Found with Problem Details, not 500
        Assert.Equal(HttpStatusCode.NotFound, secondDelete.StatusCode);

        var json = await secondDelete.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            $"Problem Details must contain 'status'. Body: {json}");
        Assert.Equal(404, statusProp.GetInt32());

        // AND: No stackTrace key exposed (NFR6)
        Assert.False(doc.RootElement.TryGetProperty("stackTrace", out _),
            $"Response must NOT expose 'stackTrace'. Body: {json}");
        Assert.False(doc.RootElement.TryGetProperty("exception", out _),
            $"Response must NOT expose 'exception'. Body: {json}");
        Assert.False(doc.RootElement.TryGetProperty("innerException", out _),
            $"Response must NOT expose 'innerException'. Body: {json}");
    }

    // -------------------------------------------------------------------------
    // TC-E3-P2-delete-api-02: DELETE non-existent contact → 404 Problem Details, no stackTrace
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-E3-P2-delete-api-02 — Given no contact with the nil UUID exists,
    /// When DELETE /api/v1/contactos/00000000-0000-0000-0000-000000000000 is called,
    /// Then returns HTTP 404 Not Found with Problem Details RFC 7807 body.
    /// And the response body does NOT contain 'stackTrace', 'exception', or 'innerException'.
    /// </summary>
    [Fact]
    public async Task TC_E3_P2_DeleteApi_02_DeleteNonExistentContacto_Returns404ProblemDetails_WithNoStackTrace()
    {
        // GIVEN: No contact with the nil UUID exists
        using var factory = new DeleteContactoWebApplicationFactory();
        var httpClient = factory.CreateClient();
        var nonExistentId = Guid.Empty; // 00000000-0000-0000-0000-000000000000

        // WHEN: DELETE /api/v1/contactos/{nonExistentId} is called
        var response = await httpClient.DeleteAsync($"/api/v1/contactos/{nonExistentId}");

        // THEN: HTTP 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: Response body is Problem Details with status: 404
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            $"Problem Details must contain 'status'. Body: {json}");
        Assert.Equal(404, statusProp.GetInt32());

        // THEN: No stackTrace key exposed (NFR6)
        Assert.False(doc.RootElement.TryGetProperty("stackTrace", out _),
            $"Response must NOT expose 'stackTrace'. Body: {json}");
        Assert.False(doc.RootElement.TryGetProperty("exception", out _),
            $"Response must NOT expose 'exception'. Body: {json}");
        Assert.False(doc.RootElement.TryGetProperty("innerException", out _),
            $"Response must NOT expose 'innerException'. Body: {json}");
    }

    /// <summary>
    /// TC-E3-P2-delete-api-02 variant — Problem Details Content-Type is application/problem+json on 404.
    /// </summary>
    [Fact]
    public async Task DeleteNonExistentContacto_Returns404WithProblemJsonContentType()
    {
        // GIVEN: No contact with a random UUID exists
        using var factory = new DeleteContactoWebApplicationFactory();
        var httpClient = factory.CreateClient();
        var nonExistentId = Guid.NewGuid();

        // WHEN: DELETE /api/v1/contactos/{id} is called for a non-existent contact
        var response = await httpClient.DeleteAsync($"/api/v1/contactos/{nonExistentId}");

        // THEN: HTTP 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: Content-Type is application/problem+json
        var contentType = response.Content.Headers.ContentType?.MediaType;
        Assert.True(
            contentType?.StartsWith("application/problem+json", StringComparison.OrdinalIgnoreCase) == true,
            $"Content-Type must be 'application/problem+json' but got: '{contentType}'"
        );
    }

    /// <summary>
    /// TC-E3-P2-delete-api-02 variant — Problem Details has 'title' and 'detail' fields.
    /// </summary>
    [Fact]
    public async Task DeleteNonExistentContacto_Returns404WithTitleAndDetailFields()
    {
        // GIVEN: No contact with the nil UUID exists
        using var factory = new DeleteContactoWebApplicationFactory();
        var httpClient = factory.CreateClient();
        var nonExistentId = Guid.Empty;

        // WHEN: DELETE /api/v1/contactos/{id} is called
        var response = await httpClient.DeleteAsync($"/api/v1/contactos/{nonExistentId}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: 'title' field is present
        Assert.True(doc.RootElement.TryGetProperty("title", out _),
            $"Problem Details must contain 'title'. Body: {json}");

        // THEN: 'detail' field contains meaningful description
        Assert.True(doc.RootElement.TryGetProperty("detail", out var detailProp),
            $"Problem Details must contain 'detail'. Body: {json}");
        var detailValue = detailProp.GetString();
        Assert.False(string.IsNullOrEmpty(detailValue),
            $"'detail' must not be empty. Body: {json}");
    }

    // -------------------------------------------------------------------------
    // Route-level: DELETE endpoint accepts valid Guid route parameter
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a valid seeded contact,
    /// When DELETE /api/v1/contactos/{validGuid} is called,
    /// Then does NOT return 405 Method Not Allowed (endpoint is registered).
    /// </summary>
    [Fact]
    public async Task DeleteContacto_EndpointAcceptsDelete_NotMethodNotAllowed()
    {
        // GIVEN: A contact is seeded (valid UUID as route param)
        using var factory = new DeleteContactoWebApplicationFactory();
        var contactoId = await SeedContactoAsync(factory, nombre: "Contacto Para Verificar Método");
        var httpClient = factory.CreateClient();

        // WHEN: DELETE /api/v1/contactos/{id} is called
        var response = await httpClient.DeleteAsync($"/api/v1/contactos/{contactoId}");

        // THEN: Does NOT return 405 Method Not Allowed (endpoint is registered)
        Assert.NotEqual(HttpStatusCode.MethodNotAllowed, response.StatusCode);
    }
}
