using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;
using Xunit;

// STORY 2.3 — Create Client
// ATDD Acceptance Tests — RED Phase (API Integration Level — xUnit)
// These tests FAIL until the implementation is complete.
//
// AC Coverage:
//   AC2 — POST /api/v1/clientes valid payload → HTTP 201 with UUID, all fields, createdAt (TC-E2-P0-01)
//   AC4 — POST /api/v1/clientes duplicate NIT/RUC → HTTP 409, user-friendly, no stack trace (TC-E2-P0-02)
//   AC3 — POST /api/v1/clientes empty body → HTTP 400 Problem Details with field-level errors (TC-E2-P0-03)

namespace SiesaAgents.IntegrationTests.Clientes;

/// <summary>
/// Integration tests for Story 2.3: Create Client — POST /api/v1/clientes endpoint.
/// Uses WebApplicationFactory + Testcontainers (PostgreSQL) for an isolated DB per test class.
/// Framework: xUnit + WebApplicationFactory{Program} + Testcontainers.PostgreSql
/// </summary>
public class CreateClienteEndpointTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithDatabase("siesa_agents_db_story_23")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public async Task InitializeAsync()
    {
        // GIVEN: A clean PostgreSQL container starts before all tests in this class
        await _postgres.StartAsync();
    }

    public async Task DisposeAsync()
    {
        await _postgres.DisposeAsync();
    }

    private WebApplicationFactory<Program> CreateFactory()
    {
        return new WebApplicationFactory<Program>()
            .WithWebHostBuilder(host =>
            {
                host.UseSetting(
                    "ConnectionStrings:DefaultConnection",
                    _postgres.GetConnectionString());
            });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P0-01: POST /api/v1/clientes — Create Client Successfully
    // AC2: Valid payload → HTTP 201 with UUID, nombre, nitRuc, telefono, ciudad, createdAt
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: Valid request body with nombre, nitRuc, telefono, ciudad
    /// WHEN:  POST /api/v1/clientes is called
    /// THEN:  HTTP 201 Created with response body containing all required ClienteDto fields
    /// RED:   Fails because POST /api/v1/clientes endpoint does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenValidPayload_WhenPostClientes_ThenReturns201WithAllRequiredFields()
    {
        // GIVEN: WebApplicationFactory with test DB, migrations applied
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        using var client = factory.CreateClient();

        var requestBody = new
        {
            nombre = "Empresa XYZ S.A.S.",
            nitRuc = "900123456-1",
            telefono = "3001234567",
            ciudad = "Bogotá"
        };

        // WHEN: POST /api/v1/clientes with valid payload
        var response = await client.PostAsJsonAsync("/api/v1/clientes", requestBody);

        // THEN: HTTP 201 Created
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        // THEN: Response body contains all required fields
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.TryGetProperty("id", out var idProp),
            "Missing field 'id' in response");
        Assert.True(body.TryGetProperty("nombre", out var nombreProp),
            "Missing field 'nombre' in response");
        Assert.True(body.TryGetProperty("nitRuc", out var nitRucProp),
            "Missing field 'nitRuc' in response");
        Assert.True(body.TryGetProperty("telefono", out var telefonoProp),
            "Missing field 'telefono' in response");
        Assert.True(body.TryGetProperty("ciudad", out var ciudadProp),
            "Missing field 'ciudad' in response");
        Assert.True(body.TryGetProperty("createdAt", out _),
            "Missing field 'createdAt' in response");

        // THEN: The id is a non-empty GUID
        Assert.True(Guid.TryParse(idProp.GetString(), out var parsedId), "id must be a valid UUID");
        Assert.NotEqual(Guid.Empty, parsedId);

        // THEN: The returned fields match the submitted values
        Assert.Equal("Empresa XYZ S.A.S.", nombreProp.GetString());
        Assert.Equal("900123456-1", nitRucProp.GetString());
        Assert.Equal("3001234567", telefonoProp.GetString());
        Assert.Equal("Bogotá", ciudadProp.GetString());
    }

    /// <summary>
    /// GIVEN: Valid payload submitted via POST /api/v1/clientes
    /// WHEN:  Subsequent GET /api/v1/clientes is called
    /// THEN:  The new client appears in the list (FR27)
    /// RED:   Fails because both endpoints do not exist yet
    /// </summary>
    [Fact]
    public async Task GivenValidPayload_WhenPostClientes_ThenClientAppearsInListViaGet()
    {
        // GIVEN: Clean DB with migrations applied
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        using var client = factory.CreateClient();

        var requestBody = new
        {
            nombre = "Empresa Listada S.A.",
            nitRuc = "900234567-2",
            telefono = "3002345678",
            ciudad = "Medellín"
        };

        // WHEN: Client is created via POST
        var postResponse = await client.PostAsJsonAsync("/api/v1/clientes", requestBody);
        Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

        var created = await postResponse.Content.ReadFromJsonAsync<JsonElement>();
        var createdId = created.GetProperty("id").GetString();

        // THEN: GET /api/v1/clientes returns the new client in the list
        var getResponse = await client.GetAsync("/api/v1/clientes");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var list = await getResponse.Content.ReadFromJsonAsync<JsonElement[]>();
        Assert.NotNull(list);
        var found = list!.Any(item =>
            item.TryGetProperty("id", out var idProp) && idProp.GetString() == createdId);
        Assert.True(found, $"Newly created client with id={createdId} not found in GET /api/v1/clientes response");
    }

    /// <summary>
    /// GIVEN: Valid payload submitted via POST /api/v1/clientes
    /// WHEN:  The response Location header is inspected
    /// THEN:  Location header points to /api/v1/clientes/{id}
    /// RED:   Fails because POST endpoint does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenValidPayload_WhenPostClientes_ThenLocationHeaderPointsToNewResource()
    {
        // GIVEN: Clean DB with migrations applied
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        using var client = factory.CreateClient();

        var requestBody = new
        {
            nombre = "Empresa Location Test Corp.",
            nitRuc = "900345678-3",
            telefono = "3003456789",
            ciudad = "Cali"
        };

        // WHEN: POST /api/v1/clientes
        var response = await client.PostAsJsonAsync("/api/v1/clientes", requestBody);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        // THEN: Location header is present and points to /api/v1/clientes/{id}
        Assert.NotNull(response.Headers.Location);
        var locationUri = response.Headers.Location!.ToString();
        Assert.Contains("/api/v1/clientes/", locationUri);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P0-02: POST /api/v1/clientes — Duplicate NIT/RUC → HTTP 409
    // AC4: Uniqueness conflict returns user-friendly message, no stack trace (NFR6)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: A client with nitRuc "900123456-1" already exists
    /// WHEN:  POST /api/v1/clientes with the same nitRuc is called
    /// THEN:  HTTP 409 Conflict with "El NIT/RUC ya está registrado" in detail field
    /// RED:   Fails because POST endpoint and uniqueness handling do not exist yet
    /// </summary>
    [Fact]
    public async Task GivenDuplicateNitRuc_WhenPostClientes_ThenReturns409WithUserFriendlyMessage()
    {
        // GIVEN: Client with nitRuc "900999001-1" already exists in the DB
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var existingCliente = SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(
            "Empresa Existente S.A.", "900999001-1", "3001111111", "Bogotá");
        dbContext.Clientes.Add(existingCliente);
        await dbContext.SaveChangesAsync();

        using var client = factory.CreateClient();

        var duplicateRequestBody = new
        {
            nombre = "Empresa Duplicada S.A.S.",
            nitRuc = "900999001-1",  // Same NIT/RUC as existing client
            telefono = "3002222222",
            ciudad = "Medellín"
        };

        // WHEN: POST /api/v1/clientes with duplicate NIT/RUC
        var response = await client.PostAsJsonAsync("/api/v1/clientes", duplicateRequestBody);

        // THEN: HTTP 409 Conflict
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

        // THEN: Content-Type is application/problem+json (RFC 7807)
        var contentType = response.Content.Headers.ContentType?.MediaType ?? "";
        Assert.Contains("application/problem+json", contentType);

        // THEN: Response body contains the user-friendly detail message (NFR6 compliance)
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.TryGetProperty("detail", out var detailProp),
            "Missing 'detail' field in 409 Problem Details response");
        var detail = detailProp.GetString() ?? "";
        Assert.Contains("NIT/RUC", detail,
            StringComparison.OrdinalIgnoreCase);
        Assert.Contains("registrado", detail,
            StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// GIVEN: A duplicate NIT/RUC request returns HTTP 409
    /// WHEN:  The response body is inspected
    /// THEN:  The body does NOT contain stack traces or technical details (NFR6)
    /// RED:   Fails because POST endpoint does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenDuplicateNitRuc_WhenPostClientes_ThenResponseBodyHasNoStackTrace()
    {
        // GIVEN: Client with nitRuc "900888001-1" already exists
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var existingCliente = SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(
            "Empresa Stack Trace Guard S.A.", "900888001-1", "3003333333", "Cali");
        dbContext.Clientes.Add(existingCliente);
        await dbContext.SaveChangesAsync();

        using var client = factory.CreateClient();

        var requestBody = new
        {
            nombre = "Empresa Stack Trace Test",
            nitRuc = "900888001-1",
            telefono = "3004444444",
            ciudad = "Barranquilla"
        };

        // WHEN: POST /api/v1/clientes with duplicate NIT/RUC
        var response = await client.PostAsJsonAsync("/api/v1/clientes", requestBody);
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

        // THEN: Response body does NOT expose stack traces or exception details (NFR6)
        var rawBody = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("stackTrace", rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("innerException", rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("at System.", rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Microsoft.EntityFrameworkCore", rawBody, StringComparison.OrdinalIgnoreCase);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P0-03: POST /api/v1/clientes — Required Fields Validation → HTTP 400
    // AC3: Empty body or missing fields triggers FluentValidation, returns Problem Details
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: Request body is an empty JSON object {}
    /// WHEN:  POST /api/v1/clientes is called
    /// THEN:  HTTP 400 Bad Request with Problem Details containing field-level errors
    /// RED:   Fails because POST endpoint and FluentValidation validator do not exist yet
    /// </summary>
    [Fact]
    public async Task GivenEmptyBody_WhenPostClientes_ThenReturns400WithFieldLevelErrors()
    {
        // GIVEN: Clean DB
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        using var client = factory.CreateClient();

        // WHEN: POST /api/v1/clientes with empty body
        var response = await client.PostAsJsonAsync("/api/v1/clientes", new { });

        // THEN: HTTP 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // THEN: Response body is Problem Details with field-level validation errors
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.TryGetProperty("errors", out var errorsProp) ||
                    body.TryGetProperty("title", out _),
            "Response should contain 'errors' or 'title' Problem Details property");
    }

    /// <summary>
    /// GIVEN: Request body contains only { "nombre": "Test" } (missing nitRuc, telefono, ciudad)
    /// WHEN:  POST /api/v1/clientes is called
    /// THEN:  HTTP 400 Bad Request — partial payload triggers validation errors for missing fields
    /// RED:   Fails because POST endpoint and FluentValidation validator do not exist yet
    /// </summary>
    [Fact]
    public async Task GivenPartialPayloadMissingRequiredFields_WhenPostClientes_ThenReturns400()
    {
        // GIVEN: Clean DB
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        using var client = factory.CreateClient();

        // WHEN: POST /api/v1/clientes with only nombre — missing nitRuc, telefono, ciudad
        var partialBody = new { nombre = "Solo Nombre S.A." };
        var response = await client.PostAsJsonAsync("/api/v1/clientes", partialBody);

        // THEN: HTTP 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    /// <summary>
    /// GIVEN: POST /api/v1/clientes returns HTTP 400 due to validation errors
    /// WHEN:  GET /api/v1/clientes is called afterwards
    /// THEN:  No client record was created (list count is unchanged)
    /// RED:   Fails because POST endpoint does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenInvalidPayload_WhenPostClientes_ThenNoClientRecordIsCreated()
    {
        // GIVEN: Clean DB with 0 clients
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        using var client = factory.CreateClient();

        // WHEN: POST with empty body (validation should reject)
        await client.PostAsJsonAsync("/api/v1/clientes", new { });

        // THEN: GET /api/v1/clientes returns empty array (no record created)
        var getResponse = await client.GetAsync("/api/v1/clientes");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var list = await getResponse.Content.ReadFromJsonAsync<JsonElement[]>();
        Assert.NotNull(list);
        Assert.Empty(list!);
    }
}
