/**
 * API Integration Tests — DELETE /api/v1/clientes/{id}
 * Story 2.5 — Delete Client (ATDD RED phase)
 *
 * Test IDs covered:
 *   TC-E2-P0-08  Seed 1 client; DELETE /api/v1/clientes/{clienteId}; assert 204 No Content;
 *                follow-up GET /api/v1/clientes/{clienteId} → 404.
 *                Note: orphan-contact FK cascade (SET NULL on contactos.cliente_id) will be
 *                verified when ContactoEntity is introduced in Epic 4.
 *   TC-E2-P2-10  DELETE /api/v1/clientes/00000000-0000-0000-0000-000000000000 →
 *                404 Problem Details with status: 404; no stackTrace key in response.
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
 *
 * Expected RED failures:
 *   - DELETE /api/v1/clientes/{id} not yet registered → 404 or 405 Not Found/Method Not Allowed
 *   - DeleteClienteCommandHandler not yet implemented
 *   - IClienteRepository.DeleteAsync not yet defined
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

namespace SiesaAgents.IntegrationTests.Clientes;

/// <summary>
/// Isolated WebApplicationFactory for Story 2.5 delete endpoint tests.
/// Each test class instance gets a unique in-memory database name to prevent
/// cross-test data pollution.
/// </summary>
public sealed class DeleteClienteWebApplicationFactory : WebApplicationFactory<Program>
{
    public string DatabaseName { get; init; } = $"DeleteClienteTestDb_{Guid.NewGuid()}";

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
/// Integration tests for DELETE /api/v1/clientes/{id} endpoint.
/// Each test that needs isolation creates its own factory with a unique DB name.
/// </summary>
public sealed class DeleteClienteEndpointTests
{
    // -------------------------------------------------------------------------
    // Helper: seed a ClienteEntity directly into the in-memory DB
    // -------------------------------------------------------------------------

    private static async Task<Guid> SeedClienteAsync(
        DeleteClienteWebApplicationFactory factory,
        string nombre = "Empresa Para Eliminar",
        string nit = "900002002-2",
        string telefono = "3002002002",
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
    // TC-E2-P0-08: DELETE existing client → 204 No Content + follow-up GET → 404
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-E2-P0-08 — Given a seeded client,
    /// When DELETE /api/v1/clientes/{id} is called,
    /// Then returns HTTP 204 No Content with no response body.
    /// And a follow-up GET /api/v1/clientes/{id} returns 404 (client is gone).
    /// </summary>
    [Fact]
    public async Task TC_E2_P0_08_DeleteCliente_Returns204_AndClientIsGone()
    {
        // GIVEN: A client is seeded in the database
        using var factory = new DeleteClienteWebApplicationFactory();
        var clienteId = await SeedClienteAsync(factory);
        var httpClient = factory.CreateClient();

        // WHEN: DELETE /api/v1/clientes/{id} is called
        var deleteResponse = await httpClient.DeleteAsync($"/api/v1/clientes/{clienteId}");

        // THEN: HTTP 204 No Content
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // THEN: Response body is empty (204 should have no body)
        var responseBody = await deleteResponse.Content.ReadAsStringAsync();
        Assert.True(
            string.IsNullOrEmpty(responseBody),
            $"Response body should be empty for 204 but got: {responseBody}"
        );

        // AND: Follow-up GET /api/v1/clientes/{id} returns 404 (client is gone)
        var getResponse = await httpClient.GetAsync($"/api/v1/clientes/{clienteId}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    /// <summary>
    /// TC-E2-P0-08 variant — Seeded client does NOT appear in GET /api/v1/clientes list
    /// after deletion.
    /// </summary>
    [Fact]
    public async Task DeleteCliente_RemovedFromList_AfterDeletion()
    {
        // GIVEN: A client is seeded
        using var factory = new DeleteClienteWebApplicationFactory();
        var clienteId = await SeedClienteAsync(factory, nombre: "Cliente A Eliminar Lista");
        var httpClient = factory.CreateClient();

        // Confirm client is in the list before deletion
        var listBefore = await httpClient.GetAsync("/api/v1/clientes");
        Assert.Equal(HttpStatusCode.OK, listBefore.StatusCode);
        var listBeforeJson = await listBefore.Content.ReadAsStringAsync();
        Assert.Contains(clienteId.ToString(), listBeforeJson);

        // WHEN: DELETE /api/v1/clientes/{id} is called
        var deleteResponse = await httpClient.DeleteAsync($"/api/v1/clientes/{clienteId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // THEN: GET /api/v1/clientes list does NOT contain the deleted client id
        var listAfter = await httpClient.GetAsync("/api/v1/clientes");
        Assert.Equal(HttpStatusCode.OK, listAfter.StatusCode);
        var listAfterJson = await listAfter.Content.ReadAsStringAsync();
        Assert.DoesNotContain(clienteId.ToString(), listAfterJson);
    }

    /// <summary>
    /// TC-E2-P0-08 variant — DELETE is idempotent (second DELETE on same id returns 404,
    /// not 500 or crash).
    /// </summary>
    [Fact]
    public async Task DeleteCliente_SecondDelete_Returns404_NotServerError()
    {
        // GIVEN: A client is seeded and then deleted once
        using var factory = new DeleteClienteWebApplicationFactory();
        var clienteId = await SeedClienteAsync(factory, nombre: "Empresa Doble Delete");
        var httpClient = factory.CreateClient();

        var firstDelete = await httpClient.DeleteAsync($"/api/v1/clientes/{clienteId}");
        Assert.Equal(HttpStatusCode.NoContent, firstDelete.StatusCode);

        // WHEN: DELETE /api/v1/clientes/{id} is called a second time
        var secondDelete = await httpClient.DeleteAsync($"/api/v1/clientes/{clienteId}");

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
    // TC-E2-P2-10: DELETE non-existent client → 404 Problem Details, no stackTrace
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-E2-P2-10 — Given no client with the nil UUID exists,
    /// When DELETE /api/v1/clientes/00000000-0000-0000-0000-000000000000 is called,
    /// Then returns HTTP 404 Not Found with Problem Details RFC 7807 body.
    /// And the response body does NOT contain 'stackTrace', 'exception', or 'innerException'.
    /// </summary>
    [Fact]
    public async Task TC_E2_P2_10_DeleteNonExistentCliente_Returns404ProblemDetails_WithNoStackTrace()
    {
        // GIVEN: No client with the nil UUID exists
        using var factory = new DeleteClienteWebApplicationFactory();
        var httpClient = factory.CreateClient();
        var nonExistentId = Guid.Empty; // 00000000-0000-0000-0000-000000000000

        // WHEN: DELETE /api/v1/clientes/{nonExistentId} is called
        var response = await httpClient.DeleteAsync($"/api/v1/clientes/{nonExistentId}");

        // THEN: HTTP 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: Response body is Problem Details with status: 404
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            $"Problem Details must contain 'status'. Body: {json}");
        Assert.Equal(404, statusProp.GetInt32());

        // THEN: No stackTrace key exposed (NFR6, R-E2-06)
        Assert.False(doc.RootElement.TryGetProperty("stackTrace", out _),
            $"Response must NOT expose 'stackTrace'. Body: {json}");
        Assert.False(doc.RootElement.TryGetProperty("exception", out _),
            $"Response must NOT expose 'exception'. Body: {json}");
        Assert.False(doc.RootElement.TryGetProperty("innerException", out _),
            $"Response must NOT expose 'innerException'. Body: {json}");
    }

    /// <summary>
    /// TC-E2-P2-10 variant — Problem Details Content-Type is application/problem+json on 404.
    /// </summary>
    [Fact]
    public async Task DeleteNonExistentCliente_Returns404WithProblemJsonContentType()
    {
        // GIVEN: No client with a random UUID exists
        using var factory = new DeleteClienteWebApplicationFactory();
        var httpClient = factory.CreateClient();
        var nonExistentId = Guid.NewGuid();

        // WHEN: DELETE /api/v1/clientes/{id} is called for a non-existent client
        var response = await httpClient.DeleteAsync($"/api/v1/clientes/{nonExistentId}");

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
    /// TC-E2-P2-10 variant — Problem Details has 'title' and 'detail' fields.
    /// </summary>
    [Fact]
    public async Task DeleteNonExistentCliente_Returns404WithTitleAndDetailFields()
    {
        // GIVEN: No client with the nil UUID exists
        using var factory = new DeleteClienteWebApplicationFactory();
        var httpClient = factory.CreateClient();
        var nonExistentId = Guid.Empty;

        // WHEN: DELETE /api/v1/clientes/{id} is called
        var response = await httpClient.DeleteAsync($"/api/v1/clientes/{nonExistentId}");

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
    /// Given a valid seeded client,
    /// When DELETE /api/v1/clientes/{validGuid} is called,
    /// Then does NOT return 405 Method Not Allowed.
    /// </summary>
    [Fact]
    public async Task DeleteCliente_EndpointAcceptsDelete_NotMethodNotAllowed()
    {
        // GIVEN: A client is seeded (valid UUID as route param)
        using var factory = new DeleteClienteWebApplicationFactory();
        var clienteId = await SeedClienteAsync(factory, nombre: "Empresa Para Verificar Método");
        var httpClient = factory.CreateClient();

        // WHEN: DELETE /api/v1/clientes/{id} is called
        var response = await httpClient.DeleteAsync($"/api/v1/clientes/{clienteId}");

        // THEN: Does NOT return 405 Method Not Allowed (endpoint is registered)
        Assert.NotEqual(HttpStatusCode.MethodNotAllowed, response.StatusCode);
    }
}
