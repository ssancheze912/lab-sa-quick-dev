using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;
using Xunit;

// STORY 2.2 — Client Detail View
// ATDD Acceptance Tests — RED Phase (API Integration Level — xUnit)
// These tests FAIL until the implementation is complete.
//
// AC Coverage:
//   AC1, AC2 — GET /api/v1/clientes/{id} returns HTTP 200 with correct ClienteDto fields (TC-E2-P1-07 backend)
//   AC3       — GET /api/v1/clientes/{id} with non-existent UUID returns HTTP 404 Problem Details (TC-E2-P2-08)

namespace SiesaAgents.IntegrationTests.Clientes;

/// <summary>
/// Integration tests for Story 2.2: Client Detail View — API endpoint layer.
/// Tests the GET /api/v1/clientes/{id} endpoint.
/// Uses WebApplicationFactory + Testcontainers (PostgreSQL) for isolated DB per test class.
/// Framework: xUnit + WebApplicationFactory{Program} + Testcontainers.PostgreSql
/// </summary>
public class ClienteGetByIdTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithDatabase("siesa_agents_db_story_22")
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
    // TC-E2-P1-07 (backend portion): GET /api/v1/clientes/{id} — Happy path
    // AC1, AC2: Seed 1 client → GET by ID → HTTP 200 with correct fields
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: 1 client seeded in the database
    /// WHEN:  GET /api/v1/clientes/{id} is called with the seeded client's ID
    /// THEN:  HTTP 200 OK is returned
    /// RED:   Fails because GET /api/v1/clientes/{id} endpoint does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenOneClientSeeded_WhenGetClienteById_ThenReturns200()
    {
        // GIVEN: 1 client seeded in the database
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var cliente = SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(
            "Empresa GetById S.A.S.", "900600006-6", "3006000006", "Bogotá");
        dbContext.Clientes.Add(cliente);
        await dbContext.SaveChangesAsync();

        using var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes/{id}
        var response = await client.GetAsync($"/api/v1/clientes/{cliente.Id}");

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    /// <summary>
    /// GIVEN: 1 client seeded in the database
    /// WHEN:  GET /api/v1/clientes/{id} is called with the seeded client's ID
    /// THEN:  Response body contains the correct 'id' field matching the seeded UUID
    /// RED:   Fails because the endpoint does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenOneClientSeeded_WhenGetClienteById_ThenResponseBodyContainsCorrectId()
    {
        // GIVEN: 1 client seeded
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var cliente = SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(
            "Empresa ID Check Ltda.", "900700007-7", "3007000007", "Medellín");
        dbContext.Clientes.Add(cliente);
        await dbContext.SaveChangesAsync();

        using var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes/{id}
        var response = await client.GetAsync($"/api/v1/clientes/{cliente.Id}");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        // THEN: The 'id' field matches the seeded client's UUID
        Assert.True(body.TryGetProperty("id", out var idProp),
            "Missing 'id' field in response body");
        var returnedId = idProp.GetString();
        Assert.Equal(cliente.Id.ToString(), returnedId, ignoreCase: true);
    }

    /// <summary>
    /// GIVEN: 1 client seeded with specific Nombre
    /// WHEN:  GET /api/v1/clientes/{id} is called
    /// THEN:  Response body contains the correct 'nombre' field value
    /// RED:   Fails because the endpoint does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenOneClientSeeded_WhenGetClienteById_ThenResponseBodyContainsCorrectNombre()
    {
        // GIVEN: 1 client seeded with known Nombre
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var cliente = SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(
            "Empresa Nombre Correcto S.A.", "900800008-8", "3008000008", "Cali");
        dbContext.Clientes.Add(cliente);
        await dbContext.SaveChangesAsync();

        using var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes/{id}
        var response = await client.GetAsync($"/api/v1/clientes/{cliente.Id}");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        // THEN: 'nombre' field has the correct value
        Assert.True(body.TryGetProperty("nombre", out var nombreProp),
            "Missing 'nombre' field in response body");
        Assert.Equal("Empresa Nombre Correcto S.A.", nombreProp.GetString());
    }

    /// <summary>
    /// GIVEN: 1 client seeded with a specific NIT/RUC
    /// WHEN:  GET /api/v1/clientes/{id} is called
    /// THEN:  Response body contains the correct 'nitRuc' field (camelCase)
    /// RED:   Fails because the endpoint does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenOneClientSeeded_WhenGetClienteById_ThenResponseBodyContainsCorrectNitRuc()
    {
        // GIVEN: 1 client seeded with known NIT/RUC
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var cliente = SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(
            "Empresa NIT Check Corp.", "900900009-9", "3009000009", "Barranquilla");
        dbContext.Clientes.Add(cliente);
        await dbContext.SaveChangesAsync();

        using var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes/{id}
        var response = await client.GetAsync($"/api/v1/clientes/{cliente.Id}");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        // THEN: 'nitRuc' field (camelCase — NOT 'nit') has the correct value
        Assert.True(body.TryGetProperty("nitRuc", out var nitRucProp),
            "Missing 'nitRuc' field in response body — must be camelCase 'nitRuc', NOT 'nit'");
        Assert.Equal("900900009-9", nitRucProp.GetString());
    }

    /// <summary>
    /// GIVEN: 1 client seeded with a specific Teléfono
    /// WHEN:  GET /api/v1/clientes/{id} is called
    /// THEN:  Response body contains the correct 'telefono' field value
    /// RED:   Fails because the endpoint does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenOneClientSeeded_WhenGetClienteById_ThenResponseBodyContainsCorrectTelefono()
    {
        // GIVEN: 1 client seeded with known Teléfono
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var cliente = SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(
            "Empresa Tel Check S.A.", "900100100-1", "3101001001", "Cartagena");
        dbContext.Clientes.Add(cliente);
        await dbContext.SaveChangesAsync();

        using var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes/{id}
        var response = await client.GetAsync($"/api/v1/clientes/{cliente.Id}");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        // THEN: 'telefono' field has the correct value
        Assert.True(body.TryGetProperty("telefono", out var telefonoProp),
            "Missing 'telefono' field in response body");
        Assert.Equal("3101001001", telefonoProp.GetString());
    }

    /// <summary>
    /// GIVEN: 1 client seeded with a specific Ciudad
    /// WHEN:  GET /api/v1/clientes/{id} is called
    /// THEN:  Response body contains the correct 'ciudad' field value
    /// RED:   Fails because the endpoint does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenOneClientSeeded_WhenGetClienteById_ThenResponseBodyContainsCorrectCiudad()
    {
        // GIVEN: 1 client seeded with known Ciudad
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var cliente = SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(
            "Empresa Ciudad Check Corp.", "900200200-2", "3202002002", "Pereira");
        dbContext.Clientes.Add(cliente);
        await dbContext.SaveChangesAsync();

        using var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes/{id}
        var response = await client.GetAsync($"/api/v1/clientes/{cliente.Id}");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        // THEN: 'ciudad' field has the correct value
        Assert.True(body.TryGetProperty("ciudad", out var ciudadProp),
            "Missing 'ciudad' field in response body");
        Assert.Equal("Pereira", ciudadProp.GetString());
    }

    /// <summary>
    /// GIVEN: 1 client seeded
    /// WHEN:  GET /api/v1/clientes/{id} is called
    /// THEN:  Response body contains the 'createdAt' field as a valid ISO-8601 DateTimeOffset string
    /// RED:   Fails because the endpoint does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenOneClientSeeded_WhenGetClienteById_ThenResponseBodyContainsCreatedAt()
    {
        // GIVEN: 1 client seeded
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var cliente = SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(
            "Empresa CreatedAt Check S.A.", "900300300-3", "3303003003", "Bucaramanga");
        dbContext.Clientes.Add(cliente);
        await dbContext.SaveChangesAsync();

        using var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes/{id}
        var response = await client.GetAsync($"/api/v1/clientes/{cliente.Id}");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        // THEN: 'createdAt' field is present and parseable as DateTimeOffset (ISO-8601)
        Assert.True(body.TryGetProperty("createdAt", out var createdAtProp),
            "Missing 'createdAt' field in response body");
        var createdAtStr = createdAtProp.GetString();
        Assert.NotNull(createdAtStr);
        Assert.True(DateTimeOffset.TryParse(createdAtStr, out _),
            $"'createdAt' is not a valid ISO-8601 DateTimeOffset string: '{createdAtStr}'");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P2-08: GET /api/v1/clientes/{id} with non-existent UUID — HTTP 404
    // AC3: Non-existent clienteId must return Problem Details RFC 7807
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GIVEN: The database has no client with the queried UUID (all-zeros UUID)
    /// WHEN:  GET /api/v1/clientes/00000000-0000-0000-0000-000000000000 is called
    /// THEN:  HTTP 404 Not Found is returned
    /// RED:   Fails because the endpoint does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenNonExistentClienteId_WhenGetClienteById_ThenReturns404()
    {
        // GIVEN: Clean DB — no client with the all-zeros UUID exists
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var nonExistentId = Guid.Empty; // 00000000-0000-0000-0000-000000000000

        using var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes/00000000-0000-0000-0000-000000000000
        var response = await client.GetAsync($"/api/v1/clientes/{nonExistentId}");

        // THEN: HTTP 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    /// <summary>
    /// GIVEN: The database has no client with the queried UUID
    /// WHEN:  GET /api/v1/clientes/{nonExistentId} is called
    /// THEN:  Content-Type is application/problem+json (RFC 7807 Problem Details)
    /// RED:   Fails because the endpoint does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenNonExistentClienteId_WhenGetClienteById_ThenContentTypeIsProblemJson()
    {
        // GIVEN: No client with this UUID
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        using var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes/00000000-0000-0000-0000-000000000000
        var response = await client.GetAsync($"/api/v1/clientes/{Guid.Empty}");

        // THEN: Content-Type is application/problem+json (RFC 7807 Problem Details — NOT text/plain or application/json)
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.Contains("problem+json", contentType);
    }

    /// <summary>
    /// GIVEN: The database has no client with the queried UUID
    /// WHEN:  GET /api/v1/clientes/{nonExistentId} is called
    /// THEN:  Response body contains a Problem Details object with 'status: 404'
    /// RED:   Fails because the endpoint does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenNonExistentClienteId_WhenGetClienteById_ThenResponseBodyContainsProblemDetailsStatus404()
    {
        // GIVEN: No client with this UUID
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        using var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes/00000000-0000-0000-0000-000000000000
        var response = await client.GetAsync($"/api/v1/clientes/{Guid.Empty}");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        // THEN: Problem Details body contains 'status: 404'
        Assert.True(body.TryGetProperty("status", out var statusProp),
            "Missing 'status' field in Problem Details response body");
        Assert.Equal(404, statusProp.GetInt32());
    }

    /// <summary>
    /// GIVEN: The database has no client with the queried UUID
    /// WHEN:  GET /api/v1/clientes/{nonExistentId} is called
    /// THEN:  Response body contains 'title: "Cliente no encontrado"' (Problem Details RFC 7807)
    /// RED:   Fails because the endpoint does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenNonExistentClienteId_WhenGetClienteById_ThenResponseBodyContainsProblemDetailsTitle()
    {
        // GIVEN: No client with this UUID
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        using var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes/00000000-0000-0000-0000-000000000000
        var response = await client.GetAsync($"/api/v1/clientes/{Guid.Empty}");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        // THEN: Problem Details body contains the expected 'title' field
        Assert.True(body.TryGetProperty("title", out var titleProp),
            "Missing 'title' field in Problem Details response body");
        Assert.Equal("Cliente no encontrado", titleProp.GetString());
    }

    /// <summary>
    /// GIVEN: The endpoint receives a random non-existent UUID (not just all-zeros)
    /// WHEN:  GET /api/v1/clientes/{randomNonExistentId} is called
    /// THEN:  HTTP 404 is returned for any non-existent UUID — not only for Guid.Empty
    /// RED:   Fails because the endpoint does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenRandomNonExistentClienteId_WhenGetClienteById_ThenReturns404()
    {
        // GIVEN: A random UUID that does not correspond to any seeded client
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var randomNonExistentId = Guid.NewGuid();

        using var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes/{randomNonExistentId}
        var response = await client.GetAsync($"/api/v1/clientes/{randomNonExistentId}");

        // THEN: HTTP 404 Not Found (the endpoint handles any non-existent UUID, not just Guid.Empty)
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    /// <summary>
    /// GIVEN: Client A and Client B are seeded in the database
    /// WHEN:  GET /api/v1/clientes/{idA} is called
    /// THEN:  Only Client A's data is returned — not Client B's
    /// RED:   Fails because the endpoint does not exist yet
    /// </summary>
    [Fact]
    public async Task GivenTwoClientsSeeded_WhenGetClienteByFirstId_ThenReturnsOnlyFirstClientData()
    {
        // GIVEN: Two clients seeded
        await using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<SiesaAgents.Infrastructure.Data.AppDbContext>();
        await dbContext.Database.MigrateAsync();

        var clienteA = SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(
            "Empresa Target A S.A.S.", "900400400-4", "3404004004", "Pereira");
        var clienteB = SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(
            "Empresa Not Target B Ltda.", "900500500-5", "3505005005", "Armenia");
        dbContext.Clientes.AddRange(clienteA, clienteB);
        await dbContext.SaveChangesAsync();

        using var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes/{clienteA.Id}
        var response = await client.GetAsync($"/api/v1/clientes/{clienteA.Id}");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        // THEN: The response contains Client A's nombre — NOT Client B's
        var nombre = body.GetProperty("nombre").GetString();
        Assert.Equal("Empresa Target A S.A.S.", nombre);
        Assert.NotEqual("Empresa Not Target B Ltda.", nombre);
    }
}
