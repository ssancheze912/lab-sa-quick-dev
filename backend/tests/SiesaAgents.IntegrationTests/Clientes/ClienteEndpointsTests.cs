using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;
using Xunit;

// STORY 2.1 — Client List & Search
// ATDD Acceptance Tests — RED Phase (API Integration Level)
// These tests FAIL until the implementation is complete.
//
// AC Coverage:
//   AC1 — GET /api/v1/clientes returns HTTP 200 with all clients (TC-E2-P1-01)
//   AC1 — Empty DB returns HTTP 200 with [] — not 404 (TC-E2-P1-02)
//   AC1 — Response body fields match ClienteDto contract (id, nombre, nitRuc, telefono, ciudad, createdAt)
//   AC4 — Endpoint always returns 200, never 500 on empty DB

namespace SiesaAgents.IntegrationTests.Clientes;

/// <summary>
/// Integration tests for Story 2.1: Client List and Search — API endpoint layer.
/// Uses WebApplicationFactory + Testcontainers (PostgreSQL) for isolated DB per test class.
/// Framework: xUnit + WebApplicationFactory{Program} + Testcontainers.PostgreSql + FluentAssertions
/// </summary>
public class ClienteEndpointsTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithDatabase("siesa_agents_db_story_21")
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
    // TC-E2-P1-01: GET /api/v1/clientes — Returns 200 with all seeded clients
    // AC1: Endpoint exists, returns correct HTTP status and body shape
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: 3 clients seeded in the database
    /// WHEN:  GET /api/v1/clientes is called
    /// THEN:  HTTP 200 with an array of exactly 3 ClienteDto items
    /// RED:   Fails because GET /api/v1/clientes endpoint does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenThreeClientsSeeded_WhenGetClientes_ThenReturns200WithThreeItems()
    {
        // GIVEN: WebApplicationFactory with test DB, migrations applied, 3 clients seeded
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        // Apply migrations so clientes table exists
        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        // Seed 3 clients directly via domain factory
        var cliente1 = SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(
            "Empresa Alfa S.A.S.", "900111001-1", "3001111111", "Bogotá");
        var cliente2 = SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(
            "Empresa Beta Ltda.", "900222002-2", "3002222222", "Medellín");
        var cliente3 = SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(
            "Empresa Gamma Corp.", "900333003-3", "3003333333", "Cali");

        dbContext.Clientes.AddRange(cliente1, cliente2, cliente3);
        await dbContext.SaveChangesAsync();

        using var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Response body is a JSON array with 3 items
        var body = await response.Content.ReadFromJsonAsync<JsonElement[]>();
        Assert.NotNull(body);
        Assert.Equal(3, body!.Length);
    }

    /// <summary>
    /// GIVEN: 3 clients seeded in the database
    /// WHEN:  GET /api/v1/clientes is called
    /// THEN:  Each item in the array contains all required ClienteDto fields
    /// RED:   Fails because the endpoint and ClienteDto mapping do not exist yet
    /// </summary>
    [Fact]
    public async Task GivenClientsSeeded_WhenGetClientes_ThenResponseContainsAllRequiredFields()
    {
        // GIVEN: WebApplicationFactory with test DB, migrations applied, 1 client seeded
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var cliente = SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(
            "Empresa Contrato S.A.", "900555005-5", "3005555555", "Barranquilla");
        dbContext.Clientes.Add(cliente);
        await dbContext.SaveChangesAsync();

        using var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");
        var body = await response.Content.ReadFromJsonAsync<JsonElement[]>();
        Assert.NotNull(body);
        Assert.NotEmpty(body!);

        var item = body![0];

        // THEN: Required fields are present in each ClienteDto
        Assert.True(item.TryGetProperty("id", out _),
            "Missing field 'id' in ClienteDto");
        Assert.True(item.TryGetProperty("nombre", out var nombreProp),
            "Missing field 'nombre' in ClienteDto");
        Assert.True(item.TryGetProperty("nitRuc", out var nitRucProp),
            "Missing field 'nitRuc' in ClienteDto (must be camelCase nitRuc, not nit)");
        Assert.True(item.TryGetProperty("telefono", out _),
            "Missing field 'telefono' in ClienteDto");
        Assert.True(item.TryGetProperty("ciudad", out _),
            "Missing field 'ciudad' in ClienteDto");
        Assert.True(item.TryGetProperty("createdAt", out _),
            "Missing field 'createdAt' in ClienteDto");

        // THEN: Field values match what was seeded
        Assert.Equal("Empresa Contrato S.A.", nombreProp.GetString());
        Assert.Equal("900555005-5", nitRucProp.GetString());
    }

    /// <summary>
    /// GIVEN: 3 clients seeded in the database
    /// WHEN:  GET /api/v1/clientes is called
    /// THEN:  The 'id' field is a valid UUID string in each item
    /// RED:   Fails if endpoint does not exist or id field is missing/malformed
    /// </summary>
    [Fact]
    public async Task GivenClientsSeeded_WhenGetClientes_ThenEachItemHasValidUuidId()
    {
        // GIVEN: 1 client seeded
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var cliente = SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(
            "Empresa UUID Test", "900777007-7", "3007777777", "Cartagena");
        dbContext.Clientes.Add(cliente);
        await dbContext.SaveChangesAsync();

        using var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");
        var body = await response.Content.ReadFromJsonAsync<JsonElement[]>();
        Assert.NotNull(body);
        Assert.NotEmpty(body!);

        var idString = body![0].GetProperty("id").GetString();

        // THEN: id is a valid UUID (Guid.Parse will throw if malformed)
        Assert.True(Guid.TryParse(idString, out _),
            $"Expected a valid UUID for 'id', got: '{idString}'");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P1-02: GET /api/v1/clientes — Empty DB returns HTTP 200 with []
    // AC1: Endpoint must return 200 [] when no clients exist — NEVER 404
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: The database has no clients (empty table)
    /// WHEN:  GET /api/v1/clientes is called
    /// THEN:  HTTP 200 OK with an empty JSON array []
    ///        NOT HTTP 404 (critical anti-pattern)
    /// RED:   Fails because the endpoint does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenEmptyDatabase_WhenGetClientes_ThenReturns200WithEmptyArray()
    {
        // GIVEN: WebApplicationFactory with clean test DB — no clients seeded
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();
        // Explicitly ensure no clientes exist
        Assert.Empty(dbContext.Clientes.ToList());

        using var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes on empty DB
        var response = await client.GetAsync("/api/v1/clientes");

        // THEN: HTTP 200 (NOT 404 — critical anti-pattern)
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    /// <summary>
    /// GIVEN: The database has no clients (empty table)
    /// WHEN:  GET /api/v1/clientes is called
    /// THEN:  Response body is an empty JSON array []
    /// RED:   Fails because the endpoint does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenEmptyDatabase_WhenGetClientes_ThenResponseBodyIsEmptyArray()
    {
        // GIVEN: Clean test DB, no clients
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        using var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");
        var body = await response.Content.ReadFromJsonAsync<JsonElement[]>();

        // THEN: Body is an empty array (length == 0)
        Assert.NotNull(body);
        Assert.Empty(body!);
    }

    /// <summary>
    /// GIVEN: Empty database
    /// WHEN:  GET /api/v1/clientes is called
    /// THEN:  Content-Type is application/json
    /// RED:   Fails because endpoint does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenEmptyDatabase_WhenGetClientes_ThenContentTypeIsApplicationJson()
    {
        // GIVEN: Clean test DB, no clients
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        using var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");

        // THEN: Content-Type includes application/json
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.Contains("application/json", contentType);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STORY 2.2 — Client Detail View
    // TC-E2-P1-07: GET /api/v1/clientes/{id} — Returns 200 with correct client data
    // TC-E2-P2-08: GET /api/v1/clientes/{id} — Non-existent UUID → HTTP 404 Problem Details
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-P1-07 (backend portion):
    /// GIVEN: 1 client seeded in the database
    /// WHEN:  GET /api/v1/clientes/{id} is called with the seeded client's id
    /// THEN:  HTTP 200 with correct id, nombre, nitRuc, telefono, ciudad, createdAt
    /// </summary>
    [Fact]
    public async Task GivenClientSeeded_WhenGetClienteById_ThenReturns200WithCorrectFields()
    {
        // ARRANGE
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var cliente = SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(
            "Empresa Detail S.A.S.", "900100001-1", "3001000001", "Bogotá");
        dbContext.Clientes.Add(cliente);
        await dbContext.SaveChangesAsync();

        using var client = factory.CreateClient();

        // ACT
        var response = await client.GetAsync($"/api/v1/clientes/{cliente.Id}");

        // ASSERT
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.TryGetProperty("id", out var idProp), "Missing field 'id'");
        Assert.True(body.TryGetProperty("nombre", out var nombreProp), "Missing field 'nombre'");
        Assert.True(body.TryGetProperty("nitRuc", out var nitRucProp), "Missing field 'nitRuc'");
        Assert.True(body.TryGetProperty("telefono", out var telefonoProp), "Missing field 'telefono'");
        Assert.True(body.TryGetProperty("ciudad", out var ciudadProp), "Missing field 'ciudad'");
        Assert.True(body.TryGetProperty("createdAt", out _), "Missing field 'createdAt'");

        Assert.Equal(cliente.Id.ToString(), idProp.GetString());
        Assert.Equal("Empresa Detail S.A.S.", nombreProp.GetString());
        Assert.Equal("900100001-1", nitRucProp.GetString());
        Assert.Equal("3001000001", telefonoProp.GetString());
        Assert.Equal("Bogotá", ciudadProp.GetString());
    }

    /// <summary>
    /// TC-E2-P2-08:
    /// GIVEN: A non-existent UUID
    /// WHEN:  GET /api/v1/clientes/00000000-0000-0000-0000-000000000000 is called
    /// THEN:  HTTP 404 with Content-Type application/problem+json and status: 404
    /// </summary>
    [Fact]
    public async Task GivenNonExistentId_WhenGetClienteById_ThenReturns404ProblemDetails()
    {
        // ARRANGE
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        using var client = factory.CreateClient();

        // ACT
        var response = await client.GetAsync("/api/v1/clientes/00000000-0000-0000-0000-000000000000");

        // ASSERT
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.Contains("application/problem+json", contentType);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.TryGetProperty("status", out var statusProp), "Missing field 'status' in Problem Details");
        Assert.Equal(404, statusProp.GetInt32());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STORY 2.3 — Create Client
    // TC-E2-P0-01: POST /api/v1/clientes — Returns 201 with all fields
    // TC-E2-P0-02: POST duplicate NIT/RUC → 409 user-friendly, no stack trace
    // TC-E2-P0-03: POST empty body → 400 Problem Details with field-level errors
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-P0-01:
    /// GIVEN: A valid POST body with Nombre, NitRuc, Telefono, Ciudad
    /// WHEN:  POST /api/v1/clientes is called
    /// THEN:  HTTP 201 Created with UUID id, all fields, and createdAt in the body
    ///        AND Location header set to /api/v1/clientes/{id}
    /// </summary>
    [Fact]
    public async Task GivenValidPostBody_WhenPostCliente_ThenReturns201WithAllFields()
    {
        // ARRANGE
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        using var client = factory.CreateClient();

        var body = new
        {
            nombre = "Empresa Nueva S.A.S.",
            nitRuc = "900500001-1",
            telefono = "3005000001",
            ciudad = "Bogotá"
        };

        // ACT
        var response = await client.PostAsJsonAsync("/api/v1/clientes", body);

        // ASSERT
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var responseBody = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(responseBody.TryGetProperty("id", out var idProp), "Missing field 'id'");
        Assert.True(responseBody.TryGetProperty("nombre", out var nombreProp), "Missing field 'nombre'");
        Assert.True(responseBody.TryGetProperty("nitRuc", out var nitRucProp), "Missing field 'nitRuc'");
        Assert.True(responseBody.TryGetProperty("telefono", out _), "Missing field 'telefono'");
        Assert.True(responseBody.TryGetProperty("ciudad", out _), "Missing field 'ciudad'");
        Assert.True(responseBody.TryGetProperty("createdAt", out _), "Missing field 'createdAt'");

        Assert.True(Guid.TryParse(idProp.GetString(), out _), "id must be a valid UUID");
        Assert.Equal("Empresa Nueva S.A.S.", nombreProp.GetString());
        Assert.Equal("900500001-1", nitRucProp.GetString());
    }

    /// <summary>
    /// TC-E2-P0-02:
    /// GIVEN: A client with NIT "900600002-2" already exists
    /// WHEN:  POST /api/v1/clientes is called with the same NIT
    /// THEN:  HTTP 409 Conflict with Problem Details — detail contains "El NIT/RUC ya está registrado"
    ///        AND no stack trace exposed
    /// </summary>
    [Fact]
    public async Task GivenDuplicateNit_WhenPostCliente_ThenReturns409WithUserFriendlyMessage()
    {
        // ARRANGE
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        // Seed a client with the NIT that will be duplicated
        var existing = SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(
            "Empresa Existente", "900600002-2", "3006000002", "Cali");
        dbContext.Clientes.Add(existing);
        await dbContext.SaveChangesAsync();

        using var client = factory.CreateClient();

        var duplicateBody = new
        {
            nombre = "Empresa Duplicada",
            nitRuc = "900600002-2",
            telefono = "3006000003",
            ciudad = "Medellín"
        };

        // ACT
        var response = await client.PostAsJsonAsync("/api/v1/clientes", duplicateBody);

        // ASSERT — HTTP 409
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

        var responseBody = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(responseBody.TryGetProperty("detail", out var detailProp), "Missing 'detail' in Problem Details");
        Assert.Equal("El NIT/RUC ya está registrado", detailProp.GetString());

        // Assert no stack trace (body should not contain "StackTrace" or "stack")
        var bodyString = responseBody.GetRawText();
        Assert.DoesNotContain("StackTrace", bodyString, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// TC-E2-P0-03:
    /// GIVEN: A POST body with all fields empty
    /// WHEN:  POST /api/v1/clientes is called
    /// THEN:  HTTP 400 Bad Request with field-level validation errors in Problem Details
    /// </summary>
    [Fact]
    public async Task GivenEmptyPostBody_WhenPostCliente_ThenReturns400WithFieldErrors()
    {
        // ARRANGE
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        using var client = factory.CreateClient();

        var emptyBody = new
        {
            nombre = "",
            nitRuc = "",
            telefono = "",
            ciudad = ""
        };

        // ACT
        var response = await client.PostAsJsonAsync("/api/v1/clientes", emptyBody);

        // ASSERT — HTTP 400
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.Contains("application/problem+json", contentType);

        var responseBody = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(responseBody.TryGetProperty("errors", out _), "Missing 'errors' in Problem Details for validation failure");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STORY 2.4 — Edit Client
    // TC-E2-P2-07: PUT /api/v1/clientes/{id} — Returns 200 with updated fields
    // AC2: Changes are reflected immediately after successful PUT
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-P2-07:
    /// GIVEN: A client seeded via POST
    /// WHEN:  PUT /api/v1/clientes/{id} with modified nombre and ciudad
    /// THEN:  HTTP 200 with updated fields in the response body
    ///        AND GET /api/v1/clientes/{id} returns the updated values
    /// </summary>
    [Fact]
    public async Task GivenExistingClient_WhenPutWithUpdatedFields_ThenReturns200WithUpdatedData()
    {
        // ARRANGE
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var original = SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(
            "Empresa Original S.A.", "900200001-1", "3002000001", "Bogotá");
        dbContext.Clientes.Add(original);
        await dbContext.SaveChangesAsync();

        using var client = factory.CreateClient();

        var updateBody = new
        {
            nombre = "Empresa Actualizada S.A.",
            nitRuc = "900200001-1",
            telefono = "3002000001",
            ciudad = "Medellín"
        };

        // ACT — PUT with updated nombre and ciudad
        var putResponse = await client.PutAsJsonAsync($"/api/v1/clientes/{original.Id}", updateBody);

        // ASSERT — HTTP 200
        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

        var putBody = await putResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(putBody.TryGetProperty("nombre", out var nombreProp), "Missing 'nombre' in response");
        Assert.True(putBody.TryGetProperty("ciudad", out var ciudadProp), "Missing 'ciudad' in response");
        Assert.Equal("Empresa Actualizada S.A.", nombreProp.GetString());
        Assert.Equal("Medellín", ciudadProp.GetString());

        // ASSERT — GET returns updated values
        var getResponse = await client.GetAsync($"/api/v1/clientes/{original.Id}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var getBody = await getResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Empresa Actualizada S.A.", getBody.GetProperty("nombre").GetString());
        Assert.Equal("Medellín", getBody.GetProperty("ciudad").GetString());
    }

    /// <summary>
    /// TC-E2-P0-03 (edit variant):
    /// GIVEN: A PUT request with empty body fields
    /// WHEN:  PUT /api/v1/clientes/{id} is called with nombre = ""
    /// THEN:  HTTP 400 with Content-Type application/problem+json and field-level validation errors
    /// AC3: Form validation prevents empty required fields from being submitted
    /// </summary>
    [Fact]
    public async Task GivenEmptyBodyFields_WhenPutCliente_ThenReturns400WithValidationErrors()
    {
        // ARRANGE
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var original = SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(
            "Empresa Validacion S.A.", "900300001-1", "3003000001", "Cali");
        dbContext.Clientes.Add(original);
        await dbContext.SaveChangesAsync();

        using var client = factory.CreateClient();

        var invalidBody = new
        {
            nombre = "",
            nitRuc = "",
            telefono = "",
            ciudad = ""
        };

        // ACT
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{original.Id}", invalidBody);

        // ASSERT
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.Contains("application/problem+json", contentType);

        var responseBody = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(responseBody.TryGetProperty("errors", out _), "Missing 'errors' in Problem Details for validation failure");
    }
}
