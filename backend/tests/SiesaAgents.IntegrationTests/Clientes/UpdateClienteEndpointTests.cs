/**
 * API Integration Tests — PUT /api/v1/clientes/{id}
 * Story 2.4 — Edit Client (ATDD RED phase)
 *
 * Test IDs covered:
 *   TC-E2-P1-18  PUT valid payload to existing client → 200 OK, updated ClienteDto, updatedAt set,
 *                follow-up GET confirms persistence
 *   (update-404) PUT valid payload to non-existent ID → 404 Not Found + Problem Details (no stackTrace)
 *   (update-400) PUT empty body to valid ID → 400 Bad Request + Problem Details with field errors (no stackTrace)
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
 *
 * Expected RED failures:
 *   - PUT /api/v1/clientes/{id} not yet registered → 404 or 405 Not Found/Method Not Allowed
 *   - UpdateClienteCommandHandler not yet implemented
 *   - UpdateClienteRequestValidator not yet created
 *   - ClienteEntity.Update() method not yet added
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

namespace SiesaAgents.IntegrationTests.Clientes;

/// <summary>
/// Isolated WebApplicationFactory for Story 2.4 update endpoint tests.
/// Each test class instance gets a unique in-memory database name to prevent
/// cross-test data pollution.
/// </summary>
public sealed class UpdateClienteWebApplicationFactory : WebApplicationFactory<Program>
{
    public string DatabaseName { get; init; } = $"UpdateClienteTestDb_{Guid.NewGuid()}";

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
/// Integration tests for PUT /api/v1/clientes/{id} endpoint.
/// Each test that needs isolation creates its own factory with a unique DB name.
/// </summary>
public sealed class UpdateClienteEndpointTests
{
    // -------------------------------------------------------------------------
    // Helper: seed a ClienteEntity directly into the in-memory DB
    // -------------------------------------------------------------------------

    private static async Task<Guid> SeedClienteAsync(
        UpdateClienteWebApplicationFactory factory,
        string nombre = "Empresa Inicial",
        string nit = "900001001-1",
        string telefono = "3001001001",
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
    // TC-E2-P1-18: PUT valid payload → 200 OK with updated ClienteDto
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-E2-P1-18 — Given a client seeded with ciudad "Bogotá",
    /// When PUT /api/v1/clientes/{id} is called with ciudad "Cali",
    /// Then returns HTTP 200 with updated ClienteDto containing ciudad "Cali"
    /// and updatedAt (ISO 8601 with TZ).
    /// And a follow-up GET confirms the change was persisted.
    /// </summary>
    [Fact]
    public async Task TC_E2_P1_18_PutCliente_Returns200_WithUpdatedDto_AndPersists()
    {
        // GIVEN: A client is seeded with ciudad "Bogotá"
        using var factory = new UpdateClienteWebApplicationFactory();
        var clienteId = await SeedClienteAsync(factory, ciudad: "Bogotá");
        var httpClient = factory.CreateClient();

        var updatePayload = new
        {
            nombre = "Empresa Inicial",
            nit = "900001001-1",
            telefono = "3001001001",
            ciudad = "Cali"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(updatePayload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: PUT /api/v1/clientes/{id} is called with ciudad "Cali"
        var response = await httpClient.PutAsync($"/api/v1/clientes/{clienteId}", content);

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Response body is a ClienteDto (direct object, no wrapper)
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: id matches the seeded client
        Assert.True(doc.RootElement.TryGetProperty("id", out var idProp),
            $"Response must contain 'id' field. Body: {json}");
        Assert.Equal(clienteId.ToString(), idProp.GetString());

        // THEN: ciudad has the updated value "Cali"
        Assert.True(doc.RootElement.TryGetProperty("ciudad", out var ciudadProp),
            $"Response must contain 'ciudad' field. Body: {json}");
        Assert.Equal("Cali", ciudadProp.GetString());

        // THEN: nombre is still present
        Assert.True(doc.RootElement.TryGetProperty("nombre", out var nombreProp),
            $"Response must contain 'nombre' field. Body: {json}");
        Assert.Equal(updatePayload.nombre, nombreProp.GetString());

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

        // THEN: Follow-up GET /api/v1/clientes/{id} confirms persistence
        var getResponse = await httpClient.GetAsync($"/api/v1/clientes/{clienteId}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var getJson = await getResponse.Content.ReadAsStringAsync();
        using var getDoc = JsonDocument.Parse(getJson);

        Assert.True(getDoc.RootElement.TryGetProperty("ciudad", out var persistedCiudad),
            $"Follow-up GET response must contain 'ciudad'. Body: {getJson}");
        Assert.Equal("Cali", persistedCiudad.GetString());
    }

    /// <summary>
    /// TC-E2-P1-18 variant — PUT updates nombre correctly.
    /// Given a seeded client, When PUT is called with a different nombre,
    /// Then the response body has the updated nombre.
    /// </summary>
    [Fact]
    public async Task PutCliente_Returns200_WithUpdatedNombre()
    {
        // GIVEN: A client is seeded
        using var factory = new UpdateClienteWebApplicationFactory();
        var clienteId = await SeedClienteAsync(factory, nombre: "Original Name");
        var httpClient = factory.CreateClient();

        var updatePayload = new
        {
            nombre = "Updated Name",
            nit = "900001001-1",
            telefono = "3001001001",
            ciudad = "Bogotá"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(updatePayload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: PUT /api/v1/clientes/{id} is called with updated nombre
        var response = await httpClient.PutAsync($"/api/v1/clientes/{clienteId}", content);

        // THEN: HTTP 200 OK with updated nombre
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("nombre", out var nombreProp),
            $"Response must contain 'nombre'. Body: {json}");
        Assert.Equal("Updated Name", nombreProp.GetString());
    }

    /// <summary>
    /// TC-E2-P1-18 variant — Response Content-Type is application/json on 200.
    /// </summary>
    [Fact]
    public async Task PutCliente_Returns200_WithJsonContentType()
    {
        // GIVEN: A client is seeded
        using var factory = new UpdateClienteWebApplicationFactory();
        var clienteId = await SeedClienteAsync(factory);
        var httpClient = factory.CreateClient();

        var updatePayload = new
        {
            nombre = "Empresa Content-Type Test",
            nit = "900001001-1",
            telefono = "3001001001",
            ciudad = "Medellín"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(updatePayload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: PUT /api/v1/clientes/{id}
        var response = await httpClient.PutAsync($"/api/v1/clientes/{clienteId}", content);

        // THEN: HTTP 200 and Content-Type is application/json
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.Contains("application/json", contentType);
    }

    // -------------------------------------------------------------------------
    // Update 404: PUT to non-existent ID → 404 Problem Details, no stackTrace
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a UUID that does not exist in the database,
    /// When PUT /api/v1/clientes/{id} is called with a valid payload,
    /// Then returns HTTP 404 Not Found with Problem Details RFC 7807:
    ///   - status: 404
    ///   - Content-Type: application/problem+json
    ///   - NO stackTrace, NO exception keys
    /// </summary>
    [Fact]
    public async Task PutCliente_Returns404_WithProblemDetails_WhenClientNotFound()
    {
        // GIVEN: A UUID that has not been seeded
        using var factory = new UpdateClienteWebApplicationFactory();
        var httpClient = factory.CreateClient();
        var nonExistentId = Guid.Empty; // 00000000-0000-0000-0000-000000000000

        var updatePayload = new
        {
            nombre = "Does Not Matter",
            nit = "900999888-7",
            telefono = "3009998887",
            ciudad = "Cali"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(updatePayload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: PUT /api/v1/clientes/{non-existent-id}
        var response = await httpClient.PutAsync($"/api/v1/clientes/{nonExistentId}", content);

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

        // THEN: No stackTrace or internal exception keys exposed (NFR6, R-E2-06)
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
    // Validation 400: PUT empty body → 400 Bad Request + Problem Details
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given an existing client ID and an empty JSON body ({}),
    /// When PUT /api/v1/clientes/{id} is called,
    /// Then returns HTTP 400 Bad Request with Problem Details RFC 7807 containing:
    ///   - status: 400
    ///   - errors object with entries for nombre, nit, telefono, ciudad
    ///   - NO stackTrace key
    /// </summary>
    [Fact]
    public async Task PutCliente_Returns400_WithProblemDetails_OnEmptyBody()
    {
        // GIVEN: A valid client seeded in the database
        using var factory = new UpdateClienteWebApplicationFactory();
        var clienteId = await SeedClienteAsync(factory);
        var httpClient = factory.CreateClient();

        var content = new StringContent(
            "{}",
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: PUT /api/v1/clientes/{id} is called with empty body
        var response = await httpClient.PutAsync($"/api/v1/clientes/{clienteId}", content);

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
        Assert.Equal(System.Text.Json.JsonValueKind.Object, errorsProp.ValueKind);

        Assert.True(errorsProp.TryGetProperty("nombre", out _) ||
                    errorsProp.TryGetProperty("Nombre", out _),
            $"'errors' must contain entry for 'nombre'. Body: {json}");
        Assert.True(errorsProp.TryGetProperty("nit", out _) ||
                    errorsProp.TryGetProperty("Nit", out _),
            $"'errors' must contain entry for 'nit'. Body: {json}");
        Assert.True(errorsProp.TryGetProperty("telefono", out _) ||
                    errorsProp.TryGetProperty("Telefono", out _),
            $"'errors' must contain entry for 'telefono'. Body: {json}");
        Assert.True(errorsProp.TryGetProperty("ciudad", out _) ||
                    errorsProp.TryGetProperty("Ciudad", out _),
            $"'errors' must contain entry for 'ciudad'. Body: {json}");

        // THEN: No stackTrace exposed (NFR6, R-E2-06)
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
    /// Given a valid client ID and a partial body (only nombre present),
    /// When PUT /api/v1/clientes/{id} is called,
    /// Then returns HTTP 400 with errors for the missing fields.
    /// </summary>
    [Fact]
    public async Task PutCliente_Returns400_WhenRequiredFieldsMissing_PartialPayload()
    {
        // GIVEN: A client is seeded
        using var factory = new UpdateClienteWebApplicationFactory();
        var clienteId = await SeedClienteAsync(factory);
        var httpClient = factory.CreateClient();

        var partialPayload = new { nombre = "Solo Nombre" };
        var content = new StringContent(
            JsonSerializer.Serialize(partialPayload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: PUT /api/v1/clientes/{id} with only nombre in the body
        var response = await httpClient.PutAsync($"/api/v1/clientes/{clienteId}", content);

        // THEN: HTTP 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // THEN: Problem Details body has status: 400
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp));
        Assert.Equal(400, statusProp.GetInt32());
    }
}
