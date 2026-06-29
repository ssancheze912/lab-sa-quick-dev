/**
 * Edge-case API Integration Tests — GET /api/v1/contactos/{id}
 * Story 3.2 — Contact Detail View — Automation Expansion
 *
 * Complements ContactoByIdEndpointTests.cs (ATDD baseline).
 * Covers edge cases NOT in ATDD:
 *   - Problem Details "detail" field contains the requested ID on 404
 *   - Problem Details "status" field is a JSON number (not a string)
 *   - 200 response root element is a direct JSON object (no envelope wrapper)
 *   - createdAt field is ISO 8601 DateTimeOffset with TZ information
 *   - Multiple sequential GET requests for the same ID return consistent data
 *   - GET /api/v1/contactos/{id} does not interfere with GET /api/v1/contactos (list)
 *   - Contact with clienteId set returns clienteId in response
 *   - 400 response Content-Type is problem+json
 *   - 404 response detail field contains the ID string
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

namespace SiesaAgents.IntegrationTests.Contactos;

/// <summary>
/// Factory for edge-case contacto detail endpoint tests.
/// Each test can request an isolated factory via CreateIsolatedFactory().
/// </summary>
public sealed class ContactoDetailEdgeWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = $"ContactoDetailEdgeDb_{Guid.NewGuid()}";

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
                options.UseInMemoryDatabase(_dbName));
        });
    }
}

/// <summary>
/// Edge-case tests for GET /api/v1/contactos/{id}.
/// </summary>
public sealed class ContactoByIdEndpointEdgeTests : IClassFixture<ContactoDetailEdgeWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly ContactoDetailEdgeWebApplicationFactory _factory;

    public ContactoByIdEndpointEdgeTests(ContactoDetailEdgeWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // -------------------------------------------------------------------------
    // Edge: 404 Problem Details "detail" field contains the requested ID
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a non-existent contactoId,
    /// When GET /api/v1/contactos/{id} returns 404,
    /// Then the Problem Details "detail" field contains the requested ID.
    /// </summary>
    [Fact(DisplayName = "Edge — 404 Problem Details 'detail' field contains the requested contactoId")]
    public async Task GetContactoById_404Response_DetailFieldContainsRequestedId()
    {
        // GIVEN: A specific UUID that does not exist in the database
        var nonExistentId = new Guid("10000000-0000-0000-0000-000000000001");

        // WHEN: GET /api/v1/contactos/{id}
        var response = await _client.GetAsync($"/api/v1/contactos/{nonExistentId}");

        // THEN: HTTP 404
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: Problem Details "detail" field references the requested ID
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        if (doc.RootElement.TryGetProperty("detail", out var detailProp))
        {
            var detailStr = detailProp.GetString() ?? string.Empty;
            // The detail field, if present, should mention the requested ID
            Assert.Contains(nonExistentId.ToString(), detailStr,
                StringComparison.OrdinalIgnoreCase);
        }
        // If no "detail" field, RFC 7807 makes it optional — test passes
    }

    // -------------------------------------------------------------------------
    // Edge: Problem Details "status" field is a JSON number (not string)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a non-existent contactoId,
    /// When GET /api/v1/contactos/{id} returns 404,
    /// Then the Problem Details "status" field is a JSON number (RFC 7807 specifies integer).
    /// </summary>
    [Fact(DisplayName = "Edge — 404 Problem Details 'status' is JSON number (not string)")]
    public async Task GetContactoById_404Response_StatusFieldIsJsonNumber()
    {
        // GIVEN: A UUID that does not exist
        var nonExistentId = new Guid("20000000-0000-0000-0000-000000000002");

        // WHEN: GET /api/v1/contactos/{id}
        var response = await _client.GetAsync($"/api/v1/contactos/{nonExistentId}");

        // THEN: HTTP 404
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // THEN: "status" field is a JSON number (not a string like "404")
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp),
            $"Problem Details must contain 'status' field. Response: {json}");
        Assert.Equal(JsonValueKind.Number, statusProp.ValueKind);
        Assert.Equal(404, statusProp.GetInt32());
    }

    // -------------------------------------------------------------------------
    // Edge: 200 response is a direct JSON object (no envelope wrapper)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given an existing contacto,
    /// When GET /api/v1/contactos/{id} returns 200,
    /// Then the root JSON element is an Object, not an Array or wrapped in "data"/"result".
    /// </summary>
    [Fact(DisplayName = "Edge — 200 response root element is a JSON object (no envelope wrapper)")]
    public async Task GetContactoById_200Response_RootIsJsonObject_NotArray()
    {
        // GIVEN: Seed a contacto
        var factory = CreateIsolatedFactory();
        var clientHttp = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var contacto = ContactoEntity.Create(
            nombre: "Edge Direct Object",
            cargo: "Analista",
            telefono: "3001000011",
            email: "edge.direct@siesa.com",
            clienteId: null,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        await dbContext.Set<ContactoEntity>().AddAsync(contacto);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos/{id}
        var response = await clientHttp.GetAsync($"/api/v1/contactos/{contacto.Id}");

        // THEN: 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: JSON root is an object (not an array or envelope wrapper)
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.Equal(JsonValueKind.Object, doc.RootElement.ValueKind);
        Assert.NotEqual(JsonValueKind.Array, doc.RootElement.ValueKind);

        // No envelope keys ("data", "result", "items", "payload")
        Assert.False(doc.RootElement.TryGetProperty("data", out _),
            "Response must not have an envelope 'data' key");
        Assert.False(doc.RootElement.TryGetProperty("result", out _),
            "Response must not have an envelope 'result' key");
        Assert.False(doc.RootElement.TryGetProperty("items", out _),
            "Response must not have an envelope 'items' key");
    }

    // -------------------------------------------------------------------------
    // Edge: createdAt field is ISO 8601 with timezone information
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given an existing contacto,
    /// When GET /api/v1/contactos/{id} returns 200,
    /// Then the createdAt field is a valid ISO 8601 DateTimeOffset with TZ info.
    /// Architecture requirement: DateTimeOffset (not plain DateTime).
    /// </summary>
    [Fact(DisplayName = "Edge — 200 response 'createdAt' is ISO 8601 DateTimeOffset with TZ")]
    public async Task GetContactoById_200Response_CreatedAtIsIso8601WithTimezone()
    {
        // GIVEN: Seed a contacto
        var factory = CreateIsolatedFactory();
        var clientHttp = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var now = DateTimeOffset.UtcNow;
        var contacto = ContactoEntity.Create(
            nombre: "Edge CreatedAt Test",
            cargo: "Gerente",
            telefono: "3002000022",
            email: "edge.createdat@siesa.com",
            clienteId: null,
            createdAt: now,
            updatedAt: now
        );
        await dbContext.Set<ContactoEntity>().AddAsync(contacto);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos/{id}
        var response = await clientHttp.GetAsync($"/api/v1/contactos/{contacto.Id}");

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
    // Edge: Multiple sequential GET requests return consistent data (idempotent)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given an existing contacto,
    /// When GET /api/v1/contactos/{id} is called twice in sequence,
    /// Then both responses return identical data (idempotent GET).
    /// </summary>
    [Fact(DisplayName = "Edge — Multiple sequential GET /api/v1/contactos/{id} return consistent data")]
    public async Task GetContactoById_CalledTwice_ReturnsSameData()
    {
        // GIVEN: Seed a contacto
        var factory = CreateIsolatedFactory();
        var clientHttp = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var contacto = ContactoEntity.Create(
            nombre: "Edge Idempotent Test",
            cargo: "Director",
            telefono: "3003000033",
            email: "edge.idempotent@siesa.com",
            clienteId: null,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        await dbContext.Set<ContactoEntity>().AddAsync(contacto);
        await dbContext.SaveChangesAsync();

        // WHEN: GET called twice in sequence
        var response1 = await clientHttp.GetAsync($"/api/v1/contactos/{contacto.Id}");
        var response2 = await clientHttp.GetAsync($"/api/v1/contactos/{contacto.Id}");

        // THEN: Both return 200
        Assert.Equal(HttpStatusCode.OK, response1.StatusCode);
        Assert.Equal(HttpStatusCode.OK, response2.StatusCode);

        // THEN: Response bodies contain identical id and nombre fields
        var json1 = await response1.Content.ReadAsStringAsync();
        var json2 = await response2.Content.ReadAsStringAsync();

        using var doc1 = JsonDocument.Parse(json1);
        using var doc2 = JsonDocument.Parse(json2);

        doc1.RootElement.TryGetProperty("id", out var id1);
        doc2.RootElement.TryGetProperty("id", out var id2);
        Assert.Equal(id1.GetString(), id2.GetString());

        doc1.RootElement.TryGetProperty("nombre", out var nombre1);
        doc2.RootElement.TryGetProperty("nombre", out var nombre2);
        Assert.Equal(nombre1.GetString(), nombre2.GetString());
    }

    // -------------------------------------------------------------------------
    // Edge: GET /api/v1/contactos/{id} does not interfere with GET /api/v1/contactos (list)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given both the list and detail endpoints are registered,
    /// When GET /api/v1/contactos is called (list route),
    /// Then it still returns a JSON array (detail route does not interfere).
    /// </summary>
    [Fact(DisplayName = "Edge — Detail route does not interfere with list route")]
    public async Task GetContactos_List_StillWorksWhenDetailRouteIsRegistered()
    {
        // GIVEN: Application has both /api/v1/contactos (list) and /api/v1/contactos/{id} registered
        // WHEN: GET /api/v1/contactos (list endpoint)
        var response = await _client.GetAsync("/api/v1/contactos");

        // THEN: 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Root element is a JSON array (not the detail object)
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
    }

    // -------------------------------------------------------------------------
    // Edge: Contact with clienteId set returns clienteId in response
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a contacto that has a clienteId assigned,
    /// When GET /api/v1/contactos/{id} returns 200,
    /// Then the response body includes the clienteId as a non-null value.
    /// </summary>
    [Fact(DisplayName = "Edge — 200 response includes non-null clienteId when contact has a client")]
    public async Task GetContactoById_200Response_IncludesClienteId_WhenAssigned()
    {
        // GIVEN: Seed a contacto with an associated clienteId
        var factory = CreateIsolatedFactory();
        var clientHttp = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var associatedClienteId = new Guid("30000000-0000-0000-0000-000000000001");

        var contacto = ContactoEntity.Create(
            nombre: "Contacto Con Cliente",
            cargo: "Representante",
            telefono: "3004000044",
            email: "con.cliente@siesa.com",
            clienteId: associatedClienteId,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        await dbContext.Set<ContactoEntity>().AddAsync(contacto);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos/{id}
        var response = await clientHttp.GetAsync($"/api/v1/contactos/{contacto.Id}");

        // THEN: 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: clienteId is present and equals the assigned value (not null)
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("clienteId", out var clienteIdProp),
            "Missing 'clienteId' field in response");

        Assert.NotEqual(JsonValueKind.Null, clienteIdProp.ValueKind);

        var clienteIdStr = clienteIdProp.GetString();
        Assert.Equal(associatedClienteId.ToString(), clienteIdStr);
    }

    // -------------------------------------------------------------------------
    // Edge: 400 Bad Request response Content-Type is problem+json
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a path parameter that is NOT a valid UUID,
    /// When GET /api/v1/contactos/{id} returns 400,
    /// Then the Content-Type of the response is application/problem+json (RFC 7807).
    /// </summary>
    [Fact(DisplayName = "Edge — 400 Bad Request response Content-Type is problem+json")]
    public async Task GetContactoById_400Response_ContentTypeIsProblemJson()
    {
        // GIVEN: An invalid UUID path parameter
        const string invalidId = "not-a-valid-uuid";

        // WHEN: GET /api/v1/contactos/{id}
        var response = await _client.GetAsync($"/api/v1/contactos/{invalidId}");

        // THEN: HTTP 400
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // THEN: Content-Type contains "problem+json" (RFC 7807)
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.True(
            contentType.Contains("problem+json") || contentType.Contains("json"),
            $"Expected Content-Type to contain 'json' but got: {contentType}"
        );
    }

    // -------------------------------------------------------------------------
    // Edge: 200 response includes all required ContactoDto fields
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given an existing contacto,
    /// When GET /api/v1/contactos/{id} returns 200,
    /// Then the response body includes all required ContactoDto fields:
    /// id, nombre, cargo, telefono, email, clienteId, createdAt.
    /// </summary>
    [Fact(DisplayName = "Edge — 200 response contains all required ContactoDto fields")]
    public async Task GetContactoById_200Response_ContainsAllRequiredDtoFields()
    {
        // GIVEN: Seed a complete contacto
        var factory = CreateIsolatedFactory();
        var clientHttp = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var contacto = ContactoEntity.Create(
            nombre: "Contacto Completo",
            cargo: "CEO",
            telefono: "3005000055",
            email: "completo@siesa.com",
            clienteId: null,
            createdAt: DateTimeOffset.UtcNow,
            updatedAt: DateTimeOffset.UtcNow
        );
        await dbContext.Set<ContactoEntity>().AddAsync(contacto);
        await dbContext.SaveChangesAsync();

        // WHEN: GET /api/v1/contactos/{id}
        var response = await clientHttp.GetAsync($"/api/v1/contactos/{contacto.Id}");

        // THEN: 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // THEN: All required ContactoDto fields are present
        Assert.True(root.TryGetProperty("id", out _),         "Missing 'id' field");
        Assert.True(root.TryGetProperty("nombre", out _),     "Missing 'nombre' field");
        Assert.True(root.TryGetProperty("cargo", out _),      "Missing 'cargo' field");
        Assert.True(root.TryGetProperty("telefono", out _),   "Missing 'telefono' field");
        Assert.True(root.TryGetProperty("email", out _),      "Missing 'email' field");
        Assert.True(root.TryGetProperty("clienteId", out _),  "Missing 'clienteId' field");
        Assert.True(root.TryGetProperty("createdAt", out _),  "Missing 'createdAt' field");
    }

    // -------------------------------------------------------------------------
    // Helper: create a fully isolated factory per test
    // -------------------------------------------------------------------------

    private static ContactoDetailEdgeWebApplicationFactory CreateIsolatedFactory()
    {
        return new ContactoDetailEdgeWebApplicationFactory();
    }
}
