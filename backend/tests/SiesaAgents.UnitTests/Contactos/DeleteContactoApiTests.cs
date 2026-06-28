using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Contactos;

/// <summary>
/// ATDD integration tests — Story 3.5: Delete Contact
///
/// Test IDs covered:
///   TC-E3-3-5-API-1 (P1) — DELETE valid ID returns 204 No Content
///   TC-E3-3-5-API-2 (P1) — DELETE unknown UUID returns 404 + Problem Details RFC 7807
/// </summary>
public class DeleteContactoApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public DeleteContactoApiTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-5-API-1 (P1) — DELETE valid ID returns 204 No Content
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-5-API-1 (P1)
    /// GIVEN a contact exists with a known ID
    /// WHEN DELETE /api/v1/contactos/:id is called with that ID
    /// THEN the response is 204 No Content
    /// AND the contact is no longer retrievable via GET /api/v1/contactos/:id
    /// </summary>
    [Fact]
    public async Task DeleteContacto_WithValidId_Returns204NoContent()
    {
        // GIVEN: A contact is created via POST
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nombre = "Contacto Para Eliminar",
            cargo = "Analista",
            telefono = "3001234567",
            email = $"delete.test.{uniqueSuffix}@empresa.co"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/contactos", payload);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<ContactoDto>();
        Assert.NotNull(created);

        // WHEN: DELETE /api/v1/contactos/:id is called
        var deleteResponse = await _client.DeleteAsync($"/api/v1/contactos/{created!.Id}");

        // THEN: Response is 204 No Content (NOT 200 with empty body)
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // AND: Contact is no longer retrievable (GET returns 404)
        var getResponse = await _client.GetAsync($"/api/v1/contactos/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E3-3-5-API-2 (P1) — DELETE unknown UUID returns 404 + Problem Details
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E3-3-5-API-2 (P1)
    /// GIVEN no contact exists with the provided UUID
    /// WHEN DELETE /api/v1/contactos/{unknown-uuid} is called
    /// THEN the response is 404 Not Found
    /// AND the body contains Problem Details RFC 7807 (NOT empty body)
    /// AND no stack trace is exposed (NFR6)
    /// </summary>
    [Fact]
    public async Task DeleteContacto_WithUnknownId_Returns404WithProblemDetails()
    {
        // GIVEN: A UUID that certainly does not exist
        var unknownId = Guid.NewGuid();

        // WHEN: DELETE /api/v1/contactos/{unknownId} is called
        var response = await _client.DeleteAsync($"/api/v1/contactos/{unknownId}");

        // THEN: Response is 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // AND: Body is Problem Details RFC 7807 (NOT empty body — Results.Problem, NOT Results.NotFound())
        var body = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();
        Assert.NotNull(body);
        Assert.Equal(404, body!.Status);

        // AND: Title is "Contacto no encontrado"
        Assert.Equal("Contacto no encontrado", body.Title);

        // AND: Detail describes the missing resource
        Assert.NotNull(body.Detail);
        Assert.Contains("no fue encontrado", body.Detail, StringComparison.OrdinalIgnoreCase);

        // AND: No stack trace exposed (NFR6)
        Assert.DoesNotContain("StackTrace", body.Detail ?? "", StringComparison.OrdinalIgnoreCase);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Additional: Contact removed from list after deletion (FR27)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN a contact exists
    /// WHEN DELETE /api/v1/contactos/:id is called successfully
    /// THEN the contact is no longer returned in GET /api/v1/contactos list
    /// </summary>
    [Fact]
    public async Task DeleteContacto_ContactRemovedFromList_AfterDeletion()
    {
        // GIVEN: A contact is created
        var uniqueSuffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var payload = new
        {
            nombre = "Contacto Lista Eliminada",
            cargo = "Supervisor",
            telefono = "3009876543",
            email = $"lista.delete.{uniqueSuffix}@empresa.co"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/contactos", payload);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<ContactoDto>();
        Assert.NotNull(created);

        // WHEN: DELETE /api/v1/contactos/:id is called
        var deleteResponse = await _client.DeleteAsync($"/api/v1/contactos/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // THEN: Contact does not appear in GET /api/v1/contactos list
        var listResponse = await _client.GetAsync("/api/v1/contactos");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);

        var list = await listResponse.Content.ReadFromJsonAsync<ContactoDto[]>();
        Assert.NotNull(list);
        Assert.DoesNotContain(list!, c => c.Id == created.Id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response DTOs
    // ─────────────────────────────────────────────────────────────────────────

    private sealed record ContactoDto(
        Guid Id,
        string Nombre,
        string Cargo,
        string Telefono,
        string Email,
        string? ClienteId,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt
    );

    private sealed record ProblemDetailsResponse(
        int Status,
        string Title,
        string? Detail
    );
}
