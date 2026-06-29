/**
 * API Integration Tests — POST /api/v1/clientes
 * Story 2.3 — Create Client (ATDD RED phase)
 *
 * Test IDs covered:
 *   TC-E2-P0-07  POST valid payload → 201 Created with ClienteDto (id, nombre, nit, telefono, ciudad, createdAt ISO 8601 with TZ)
 *   TC-E2-P0-09  POST with duplicate NIT → 409 Conflict + Problem Details (no stackTrace)
 *   TC-E2-P1-19  POST empty body → 400 Bad Request + Problem Details with field-level errors (no stackTrace)
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
 *
 * Expected RED failures:
 *   - POST /api/v1/clientes not yet registered → 404 Not Found
 *   - CreateClienteCommandHandler not yet implemented
 *   - FluentValidation validator not yet created
 *   - ExceptionHandlingMiddleware not yet mapping 23505 → 409
 *
 * Given-When-Then format per test method.
 */

using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Clientes;

/// <summary>
/// Isolated WebApplicationFactory for Story 2.3 create endpoint tests.
/// Each test class instance gets a unique in-memory database name to prevent
/// cross-test data pollution, especially critical for NIT uniqueness tests.
/// </summary>
public sealed class CreateClienteWebApplicationFactory : WebApplicationFactory<Program>
{
    public string DatabaseName { get; init; } = $"CreateClienteTestDb_{Guid.NewGuid()}";

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
/// Integration tests for POST /api/v1/clientes endpoint.
/// Each test method that needs isolation creates its own factory with a unique DB name.
/// </summary>
public sealed class CreateClienteEndpointTests
{
    // ---------------------------------------------------------------------------
    // TC-E2-P0-07: POST valid payload → 201 Created with complete ClienteDto
    // ---------------------------------------------------------------------------

    /// <summary>
    /// TC-E2-P0-07 — Given a valid create-client request body,
    /// When POST /api/v1/clientes is called,
    /// Then returns HTTP 201 Created with a ClienteDto body containing:
    /// id (UUID), nombre, nit, telefono, ciudad, createdAt (ISO 8601 with TZ).
    /// And a follow-up GET confirms the record was persisted.
    /// </summary>
    [Fact]
    public async Task TC_E2_P0_07_PostCliente_Returns201_WithCompleteDtoAndPersists()
    {
        // GIVEN: A valid create-client payload (all 4 required fields present)
        using var factory = new CreateClienteWebApplicationFactory();
        var client = factory.CreateClient();

        var payload = new
        {
            nombre = "Acme Corp Integration",
            nit = "900100200-3",
            telefono = "3001002003",
            ciudad = "Bogotá"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: POST /api/v1/clientes is called
        var response = await client.PostAsync("/api/v1/clientes", content);

        // THEN: HTTP 201 Created
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        // THEN: Response body is a ClienteDto (not wrapped)
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: id must be a valid UUID
        Assert.True(doc.RootElement.TryGetProperty("id", out var idProp),
            $"Response must contain 'id' field. Body: {json}");
        Assert.True(Guid.TryParse(idProp.GetString(), out _),
            $"'id' must be a valid UUID but got: {idProp.GetString()}");

        // THEN: nombre matches what was sent
        Assert.True(doc.RootElement.TryGetProperty("nombre", out var nombreProp),
            "Response must contain 'nombre' field");
        Assert.Equal(payload.nombre, nombreProp.GetString());

        // THEN: nit matches
        Assert.True(doc.RootElement.TryGetProperty("nit", out var nitProp),
            "Response must contain 'nit' field");
        Assert.Equal(payload.nit, nitProp.GetString());

        // THEN: telefono matches
        Assert.True(doc.RootElement.TryGetProperty("telefono", out var telefonoProp),
            "Response must contain 'telefono' field");
        Assert.Equal(payload.telefono, telefonoProp.GetString());

        // THEN: ciudad matches
        Assert.True(doc.RootElement.TryGetProperty("ciudad", out var ciudadProp),
            "Response must contain 'ciudad' field");
        Assert.Equal(payload.ciudad, ciudadProp.GetString());

        // THEN: createdAt is present as ISO 8601 with timezone (DateTimeOffset)
        Assert.True(doc.RootElement.TryGetProperty("createdAt", out var createdAtProp),
            "Response must contain 'createdAt' field");
        var createdAtStr = createdAtProp.GetString();
        Assert.False(string.IsNullOrEmpty(createdAtStr), "'createdAt' must not be empty");
        Assert.True(
            DateTimeOffset.TryParse(createdAtStr, out _),
            $"'createdAt' must be a valid DateTimeOffset ISO 8601 string but got: {createdAtStr}"
        );
        Assert.True(
            createdAtStr!.EndsWith('Z') || createdAtStr.Contains('+') || createdAtStr.Contains('-', StringComparison.Ordinal),
            $"'createdAt' must include timezone information but got: {createdAtStr}"
        );

        // THEN: Location header points to the new resource
        Assert.NotNull(response.Headers.Location);
        var location = response.Headers.Location.ToString();
        Assert.Contains("/api/v1/clientes/", location);

        // THEN: Follow-up GET confirms the record is persisted
        var createdId = idProp.GetString();
        var getResponse = await client.GetAsync($"/api/v1/clientes/{createdId}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
    }

    /// <summary>
    /// TC-E2-P0-07 variant — Verifies Content-Type is application/json on 201 response.
    /// </summary>
    [Fact]
    public async Task PostCliente_Returns201_WithJsonContentType()
    {
        // GIVEN: A valid create-client payload
        using var factory = new CreateClienteWebApplicationFactory();
        var client = factory.CreateClient();

        var payload = new
        {
            nombre = "Beta SA Content-Type",
            nit = "900200300-4",
            telefono = "3002003004",
            ciudad = "Medellín"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: POST /api/v1/clientes is called
        var response = await client.PostAsync("/api/v1/clientes", content);

        // THEN: HTTP 201 Created
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        // THEN: Content-Type is application/json
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.Contains("application/json", contentType);
    }

    // ---------------------------------------------------------------------------
    // TC-E2-P0-09: POST with duplicate NIT → 409 Conflict + Problem Details, no stackTrace
    // ---------------------------------------------------------------------------

    /// <summary>
    /// TC-E2-P0-09 — Given a client already created with a specific NIT,
    /// When POST /api/v1/clientes is called with the same NIT (different nombre),
    /// Then returns HTTP 409 Conflict with Problem Details RFC 7807 containing:
    ///   - status: 409
    ///   - detail: contains "NIT/RUC ya está registrado"
    ///   - Content-Type: application/problem+json
    ///   - NO stackTrace, NO exception keys
    /// </summary>
    [Fact]
    public async Task TC_E2_P0_09_PostCliente_Returns409_WithProblemDetails_OnDuplicateNit()
    {
        // GIVEN: A client is created with NIT "900300400-5"
        using var factory = new CreateClienteWebApplicationFactory();
        var client = factory.CreateClient();

        var firstPayload = new
        {
            nombre = "Primera Empresa",
            nit = "900300400-5",
            telefono = "3003004005",
            ciudad = "Cali"
        };

        var firstContent = new StringContent(
            JsonSerializer.Serialize(firstPayload),
            Encoding.UTF8,
            "application/json"
        );

        var firstResponse = await client.PostAsync("/api/v1/clientes", firstContent);
        // Ensure first creation succeeded
        Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);

        // WHEN: POST /api/v1/clientes is called with the same NIT (different nombre)
        var duplicatePayload = new
        {
            nombre = "Segunda Empresa (NIT duplicado)",
            nit = "900300400-5", // same NIT
            telefono = "3103004006",
            ciudad = "Barranquilla"
        };

        var duplicateContent = new StringContent(
            JsonSerializer.Serialize(duplicatePayload),
            Encoding.UTF8,
            "application/json"
        );

        var duplicateResponse = await client.PostAsync("/api/v1/clientes", duplicateContent);

        // THEN: HTTP 409 Conflict
        Assert.Equal(HttpStatusCode.Conflict, duplicateResponse.StatusCode);

        // THEN: Content-Type is application/problem+json (RFC 7807)
        var contentType = duplicateResponse.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.True(contentType.Contains("problem+json"),
            $"Expected Content-Type to contain 'problem+json' but got: {contentType}");

        // THEN: Response body is Problem Details with status: 409
        var json = await duplicateResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            $"Problem Details must contain 'status' field. Body: {json}");
        Assert.Equal(409, statusProp.GetInt32());

        // THEN: detail contains the user-facing message about NIT/RUC duplication
        Assert.True(doc.RootElement.TryGetProperty("detail", out var detailProp),
            $"Problem Details must contain 'detail' field. Body: {json}");
        Assert.Contains("NIT/RUC ya está registrado", detailProp.GetString() ?? string.Empty,
            StringComparison.OrdinalIgnoreCase);

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

    // ---------------------------------------------------------------------------
    // TC-E2-P1-19: POST empty body → 400 Bad Request + Problem Details with field errors
    // ---------------------------------------------------------------------------

    /// <summary>
    /// TC-E2-P1-19 — Given an empty JSON body ({}),
    /// When POST /api/v1/clientes is called,
    /// Then returns HTTP 400 Bad Request with Problem Details RFC 7807 containing:
    ///   - status: 400
    ///   - errors object with entries for nombre, nit, telefono, ciudad
    ///   - NO stackTrace key
    /// </summary>
    [Fact]
    public async Task TC_E2_P1_19_PostCliente_Returns400_WithProblemDetails_OnEmptyBody()
    {
        // GIVEN: An empty JSON body
        using var factory = new CreateClienteWebApplicationFactory();
        var client = factory.CreateClient();

        var content = new StringContent(
            "{}",
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: POST /api/v1/clientes is called with empty body
        var response = await client.PostAsync("/api/v1/clientes", content);

        // THEN: HTTP 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // THEN: Response body is Problem Details
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: status: 400 present
        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            $"Problem Details must contain 'status' field. Body: {json}");
        Assert.Equal(400, statusProp.GetInt32());

        // THEN: errors object is present with validation failures
        Assert.True(doc.RootElement.TryGetProperty("errors", out var errorsProp),
            $"Problem Details must contain 'errors' field. Body: {json}");
        Assert.Equal(JsonValueKind.Object, errorsProp.ValueKind);

        // THEN: errors object contains entries for all 4 required fields
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
    /// TC-E2-P1-19 variant — POST with missing individual fields also returns 400.
    /// Given a body with only nombre present (nit, telefono, ciudad missing),
    /// When POST /api/v1/clientes is called,
    /// Then returns HTTP 400 with errors for the missing fields.
    /// </summary>
    [Fact]
    public async Task PostCliente_Returns400_WhenRequiredFieldsMissing_PartialPayload()
    {
        // GIVEN: A partial body with only nombre
        using var factory = new CreateClienteWebApplicationFactory();
        var client = factory.CreateClient();

        var partialPayload = new { nombre = "Solo Nombre" };
        var content = new StringContent(
            JsonSerializer.Serialize(partialPayload),
            Encoding.UTF8,
            "application/json"
        );

        // WHEN: POST /api/v1/clientes is called
        var response = await client.PostAsync("/api/v1/clientes", content);

        // THEN: HTTP 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // THEN: Problem Details body has status: 400
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp));
        Assert.Equal(400, statusProp.GetInt32());
    }
}
