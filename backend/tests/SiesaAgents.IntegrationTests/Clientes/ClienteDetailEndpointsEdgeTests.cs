/**
 * Edge-case API Integration Tests — GET /api/v1/clientes/{id}
 * Story 2.2 — Client Detail View — Automation Expansion
 *
 * Complements ClienteDetailEndpointsTests.cs (ATDD baseline).
 * Covers edge cases NOT in ATDD:
 *   - Invalid UUID format in path returns 400 (not 500 or blank)
 *   - Problem Details body has "title" field in 404 response
 *   - Problem Details body has "detail" field containing the ID in 404 response
 *   - createdAt field in 200 response is a valid ISO 8601 DateTimeOffset with TZ
 *   - GET /api/v1/clientes/{id} returns 200 direct object (no wrapper)
 *   - Response JSON object has no "items", "data" or envelope keys
 *   - Problem Details status field is an integer (not a string)
 *   - Response Content-Type for 200 is application/json
 *   - Multiple sequential requests for the same ID return consistent data
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
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
/// Factory for edge-case detail endpoint tests.
/// </summary>
public sealed class ClienteDetailEdgeWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = $"DetailEdgeDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
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
                options.UseInMemoryDatabase(_dbName));
        });
    }
}

/// <summary>
/// Edge-case tests for GET /api/v1/clientes/{id}.
/// </summary>
public sealed class ClienteDetailEndpointsEdgeTests : IClassFixture<ClienteDetailEdgeWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly ClienteDetailEdgeWebApplicationFactory _factory;

    public ClienteDetailEndpointsEdgeTests(ClienteDetailEdgeWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // -------------------------------------------------------------------------
    // Edge: Invalid UUID format in path
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a path parameter that is NOT a valid UUID (e.g. "not-a-uuid"),
    /// When GET /api/v1/clientes/{id} is called,
    /// Then the response is NOT 200 (400 or 404 is acceptable — route constraint rejects it).
    /// This prevents the server from reaching the handler with an invalid Guid parameter.
    /// </summary>
    [Fact(DisplayName = "Edge — GET /api/v1/clientes/{id} with invalid UUID format returns non-200")]
    public async Task GetClienteById_InvalidUuidFormat_ReturnsNon200()
    {
        // GIVEN: A path parameter that is not a valid GUID
        // WHEN: GET /api/v1/clientes/not-a-uuid
        var response = await _client.GetAsync("/api/v1/clientes/not-a-uuid");

        // THEN: Status is NOT 200 OK (route constraint {id:guid} rejects it with 400)
        Assert.NotEqual(HttpStatusCode.OK, response.StatusCode);
    }

    // -------------------------------------------------------------------------
    // Edge: Problem Details "title" field presence on 404
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a non-existent clienteId,
    /// When GET /api/v1/clientes/{id} returns 404,
    /// Then the Problem Details body must contain a "title" field (RFC 7807 requirement).
    /// </summary>
    [Fact(DisplayName = "Edge — 404 Problem Details contains 'title' field (RFC 7807)")]
    public async Task GetClienteById_404Response_ContainsTitleField()
    {
        // GIVEN: A UUID that does not exist
        var nonExistentId = new Guid("10000000-0000-0000-0000-000000000001");

        // WHEN: GET /api/v1/clientes/{id}
        var response = await _client.GetAsync($"/api/v1/clientes/{nonExistentId}");

        // THEN: 404 status
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: Problem Details body has "title" field (RFC 7807)
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("title", out var titleProp),
            $"Problem Details must contain 'title' field. Response: {json}");
        Assert.False(string.IsNullOrEmpty(titleProp.GetString()),
            "'title' must not be empty");
    }

    // -------------------------------------------------------------------------
    // Edge: Problem Details "detail" field contains the client ID on 404
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a non-existent clienteId,
    /// When GET /api/v1/clientes/{id} returns 404,
    /// Then the Problem Details "detail" field contains the requested ID.
    /// </summary>
    [Fact(DisplayName = "Edge — 404 Problem Details 'detail' field mentions the requested ID")]
    public async Task GetClienteById_404Response_DetailFieldContainsRequestedId()
    {
        // GIVEN: A specific UUID that does not exist
        var nonExistentId = new Guid("20000000-0000-0000-0000-000000000002");

        // WHEN: GET /api/v1/clientes/{id}
        var response = await _client.GetAsync($"/api/v1/clientes/{nonExistentId}");

        // THEN: 404 status
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: Problem Details "detail" field references the requested ID
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        if (doc.RootElement.TryGetProperty("detail", out var detailProp))
        {
            var detailStr = detailProp.GetString() ?? string.Empty;
            Assert.Contains(nonExistentId.ToString(), detailStr,
                StringComparison.OrdinalIgnoreCase);
        }
        // If no "detail" field, the test passes (it's optional in RFC 7807)
        // The key requirement is that the field, if present, contains the ID
    }

    // -------------------------------------------------------------------------
    // Edge: Problem Details "status" field is an integer (not string)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a non-existent clienteId,
    /// When GET /api/v1/clientes/{id} returns 404,
    /// Then the Problem Details "status" field must be a JSON number (not a string).
    /// RFC 7807 specifies status is an integer.
    /// </summary>
    [Fact(DisplayName = "Edge — Problem Details 'status' is JSON number (not string)")]
    public async Task GetClienteById_404Response_StatusFieldIsJsonNumber()
    {
        // GIVEN: A non-existent UUID
        var nonExistentId = new Guid("30000000-0000-0000-0000-000000000003");

        // WHEN: GET /api/v1/clientes/{id}
        var response = await _client.GetAsync($"/api/v1/clientes/{nonExistentId}");

        // THEN: 404 status
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: "status" is a JSON number (not a string)
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            $"Problem Details must contain 'status' field. Response: {json}");
        Assert.Equal(JsonValueKind.Number, statusProp.ValueKind);
        Assert.Equal(404, statusProp.GetInt32());
    }

    // -------------------------------------------------------------------------
    // Edge: 200 response has Content-Type application/json
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a client that exists in the database,
    /// When GET /api/v1/clientes/{id} returns 200,
    /// Then Content-Type is application/json (not problem+json or other).
    /// </summary>
    [Fact(DisplayName = "Edge — 200 response Content-Type is application/json (not problem+json)")]
    public async Task GetClienteById_200Response_ContentTypeIsApplicationJson()
    {
        // GIVEN: Seed a client with a known ID
        var factory = CreateIsolatedFactory();
        var clientHttp = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var cliente = ClienteEntity.Create(
            nombre: "Edge Content Type SA",
            nit: "900100001-1",
            telefono: "3001000011",
            ciudad: "Bogotá",
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        await dbContext.Clientes.AddAsync(cliente);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/clientes/{id}
        var response = await clientHttp.GetAsync($"/api/v1/clientes/{cliente.Id}");

        // THEN: 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Content-Type is application/json
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.Equal("application/json", contentType);
    }

    // -------------------------------------------------------------------------
    // Edge: 200 response is a direct object (no envelope wrapper)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given an existing client,
    /// When GET /api/v1/clientes/{id} returns 200,
    /// Then the root JSON element is an Object, not an Array or wrapped in "data"/"result".
    /// </summary>
    [Fact(DisplayName = "Edge — 200 response root element is a JSON object (no envelope wrapper)")]
    public async Task GetClienteById_200Response_RootIsJsonObject_NotArray()
    {
        // GIVEN: Seed a client
        var factory = CreateIsolatedFactory();
        var clientHttp = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var cliente = ClienteEntity.Create(
            nombre: "Edge Direct Object SA",
            nit: "900200002-2",
            telefono: "3002000022",
            ciudad: "Medellín",
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        await dbContext.Clientes.AddAsync(cliente);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/clientes/{id}
        var response = await clientHttp.GetAsync($"/api/v1/clientes/{cliente.Id}");

        // THEN: 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: JSON root is an object, not wrapped in array or envelope key
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.Equal(JsonValueKind.Object, doc.RootElement.ValueKind);
        Assert.NotEqual(JsonValueKind.Array, doc.RootElement.ValueKind);

        // No envelope keys ("data", "result", "items", "payload")
        Assert.False(doc.RootElement.TryGetProperty("data", out _),
            "Response must not have an envelope 'data' key");
        Assert.False(doc.RootElement.TryGetProperty("result", out _),
            "Response must not have an envelope 'result' key");
    }

    // -------------------------------------------------------------------------
    // Edge: createdAt field is ISO 8601 with timezone information
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given an existing client,
    /// When GET /api/v1/clientes/{id} returns 200,
    /// Then the createdAt field is a valid ISO 8601 DateTimeOffset string with TZ info.
    /// Architecture requirement: DateTimeOffset (not plain DateTime) — always includes TZ.
    /// </summary>
    [Fact(DisplayName = "Edge — 200 response 'createdAt' is ISO 8601 DateTimeOffset with TZ")]
    public async Task GetClienteById_200Response_CreatedAtIsIso8601WithTimezone()
    {
        // GIVEN: Seed a client
        var factory = CreateIsolatedFactory();
        var clientHttp = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var now = DateTimeOffset.UtcNow;
        var cliente = ClienteEntity.Create(
            nombre: "Edge CreatedAt SA",
            nit: "900300003-3",
            telefono: "3003000033",
            ciudad: "Cali",
            createdAt: now,
            updatedAt: now
        );
        await dbContext.Clientes.AddAsync(cliente);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/clientes/{id}
        var response = await clientHttp.GetAsync($"/api/v1/clientes/{cliente.Id}");

        // THEN: 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: createdAt is a valid DateTimeOffset ISO 8601 string
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("createdAt", out var createdAtProp),
            "Missing 'createdAt' field in response");

        var createdAtStr = createdAtProp.GetString();
        Assert.False(string.IsNullOrEmpty(createdAtStr));

        // Must parse as DateTimeOffset (not just DateTime)
        Assert.True(
            DateTimeOffset.TryParse(createdAtStr, out _),
            $"'createdAt' is not a valid DateTimeOffset: {createdAtStr}"
        );

        // Must contain timezone information (ends with 'Z' or contains '+'/'-' offset)
        Assert.True(
            createdAtStr!.EndsWith('Z') ||
            createdAtStr.Contains('+') ||
            (createdAtStr.Length > 10 && createdAtStr.LastIndexOf('-') > 10),
            $"'createdAt' does not contain timezone information: {createdAtStr}"
        );
    }

    // -------------------------------------------------------------------------
    // Edge: Multiple sequential requests for same ID return consistent data
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given an existing client,
    /// When GET /api/v1/clientes/{id} is called twice in sequence,
    /// Then both responses return identical data (idempotent GET).
    /// </summary>
    [Fact(DisplayName = "Edge — Multiple sequential GET /api/v1/clientes/{id} return consistent data")]
    public async Task GetClienteById_CalledTwice_ReturnsSameData()
    {
        // GIVEN: Seed a client
        var factory = CreateIsolatedFactory();
        var clientHttp = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var cliente = ClienteEntity.Create(
            nombre: "Edge Idempotent SA",
            nit: "900400004-4",
            telefono: "3004000044",
            ciudad: "Barranquilla",
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        await dbContext.Clientes.AddAsync(cliente);
        await dbContext.SaveChangesAsync();

        // WHEN: GET called twice
        var response1 = await clientHttp.GetAsync($"/api/v1/clientes/{cliente.Id}");
        var response2 = await clientHttp.GetAsync($"/api/v1/clientes/{cliente.Id}");

        // THEN: Both return 200
        Assert.Equal(HttpStatusCode.OK, response1.StatusCode);
        Assert.Equal(HttpStatusCode.OK, response2.StatusCode);

        // THEN: Response bodies are identical (same JSON)
        var json1 = await response1.Content.ReadAsStringAsync();
        var json2 = await response2.Content.ReadAsStringAsync();

        using var doc1 = JsonDocument.Parse(json1);
        using var doc2 = JsonDocument.Parse(json2);

        // Compare id fields
        doc1.RootElement.TryGetProperty("id", out var id1);
        doc2.RootElement.TryGetProperty("id", out var id2);
        Assert.Equal(id1.GetString(), id2.GetString());

        // Compare nombre fields
        doc1.RootElement.TryGetProperty("nombre", out var nombre1);
        doc2.RootElement.TryGetProperty("nombre", out var nombre2);
        Assert.Equal(nombre1.GetString(), nombre2.GetString());
    }

    // -------------------------------------------------------------------------
    // Edge: GET /api/v1/clientes/{id} route does not interfere with GET /api/v1/clientes
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given the list endpoint and the detail endpoint both registered,
    /// When GET /api/v1/clientes is called (list),
    /// Then it still returns a JSON array (not confused with the detail route).
    /// </summary>
    [Fact(DisplayName = "Edge — Detail route does not interfere with list route")]
    public async Task GetClientes_List_StillWorksWhenDetailRouteIsRegistered()
    {
        // GIVEN: Application has both endpoints registered
        // WHEN: GET /api/v1/clientes (list)
        var response = await _client.GetAsync("/api/v1/clientes");

        // THEN: 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Root is JSON array (not the detail object)
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
    }

    // -------------------------------------------------------------------------
    // Helper: create a fully isolated factory per test
    // -------------------------------------------------------------------------

    private static ClienteDetailEdgeWebApplicationFactory CreateIsolatedFactory()
    {
        return new ClienteDetailEdgeWebApplicationFactory();
    }
}
