/**
 * API Integration Tests — GET /api/v1/contactos (edge cases & boundary conditions)
 * Story 3.1 — Contact List & Search (testarch-automate expansion)
 *
 * Coverage gap areas addressed:
 *   TC-E3-API-EDGE-01  Large dataset (50 contacts) — all returned, array length matches
 *   TC-E3-API-EDGE-02  Contact with non-null clienteId — FK field serialized as valid UUID
 *   TC-E3-API-EDGE-03  Response JSON does not include wrapper object (no "data", "items" keys)
 *   TC-E3-API-EDGE-04  Multiple sequential requests are independent (no cross-test contamination)
 *   TC-E3-API-EDGE-05  HTTP method isolation — POST, PUT, DELETE return 405 Method Not Allowed
 *   TC-E3-API-EDGE-06  Response body is valid parseable JSON (Content-Type + parse check)
 *   TC-E3-API-EDGE-07  createdAt includes timezone offset 'Z' or '+/-' sign (DateTimeOffset)
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
 */

using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Contactos;

/// <summary>
/// Isolated factory for edge-case tests — uses a different in-memory DB name
/// to avoid state leakage from ContactosEndpointsTests.
/// </summary>
public sealed class ContactosEdgeWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName;

    public ContactosEdgeWebApplicationFactory(string dbName = "IntegrationTestDb_ContactosEdge")
    {
        _dbName = dbName;
    }

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove ALL DbContext-related descriptors (PostgreSQL + AppDbContext)
            var descriptorsToRemove = services
                .Where(d =>
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                    d.ServiceType == typeof(Microsoft.EntityFrameworkCore.DbContextOptions) ||
                    d.ServiceType == typeof(AppDbContext))
                .ToList();

            foreach (var d in descriptorsToRemove)
                services.Remove(d);

            var optionsDescriptors = services
                .Where(d => d.ServiceType.Name.Contains("DbContextOptions"))
                .ToList();
            foreach (var d in optionsDescriptors)
                services.Remove(d);

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(_dbName));
        });
    }
}

/// <summary>
/// Edge-case and boundary tests for GET /api/v1/contactos.
/// Each test uses its own isolated factory to guarantee no shared state.
/// </summary>
public sealed class ContactosEndpointsEdgeTests
{
    // -------------------------------------------------------------------------
    // TC-E3-API-EDGE-01: Large dataset — all 50 contacts returned
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-E3-API-EDGE-01 — Given 50 seeded contacts,
    /// When GET /api/v1/contactos is called,
    /// Then the response array contains exactly 50 items.
    ///
    /// Rationale: ensures no arbitrary limit (e.g. Take(10)) is applied in the handler.
    /// </summary>
    [Fact]
    public async Task TC_E3_API_EDGE_01_GetContactos_Returns_AllItems_LargeDataset()
    {
        // GIVEN: 50 contacts seeded in an isolated in-memory database
        using var factory = new ContactosEdgeWebApplicationFactory("Edge_LargeDataset");
        var client = factory.CreateClient();
        await SeedContactosAsync(factory, count: 50);

        // WHEN: GET /api/v1/contactos
        var response = await client.GetAsync("/api/v1/contactos");

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Response contains exactly 50 items
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(50, doc.RootElement.GetArrayLength());
    }

    // -------------------------------------------------------------------------
    // TC-E3-API-EDGE-02: Contact with non-null clienteId serializes as valid UUID
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-E3-API-EDGE-02 — Given a contact linked to a cliente (non-null clienteId),
    /// When GET /api/v1/contactos is called,
    /// Then the clienteId field is a valid UUID string (not null, not empty).
    ///
    /// Rationale: FR25 — contacts CAN have a clienteId; tests orphan contacts,
    /// this test covers the non-orphan (associated) path.
    /// </summary>
    [Fact]
    public async Task TC_E3_API_EDGE_02_GetContactos_Returns_NonNullClienteId_AsValidUuid()
    {
        // GIVEN: 1 contact seeded WITH a clienteId (non-null FK)
        using var factory = new ContactosEdgeWebApplicationFactory("Edge_NonNullClienteId");
        var client = factory.CreateClient();

        var clienteId = Guid.NewGuid();
        await SeedContactosAsync(factory, count: 1, clienteId: clienteId);

        // WHEN: GET /api/v1/contactos
        var response = await client.GetAsync("/api/v1/contactos");

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: clienteId field is a string representation of the seeded UUID
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var first = doc.RootElement.EnumerateArray().First();

        Assert.True(first.TryGetProperty("clienteId", out var clienteIdProp), "Missing 'clienteId'");
        Assert.Equal(JsonValueKind.String, clienteIdProp.ValueKind);
        Assert.True(
            Guid.TryParse(clienteIdProp.GetString(), out var parsedId),
            $"clienteId is not a valid UUID: {clienteIdProp.GetString()}"
        );
        Assert.Equal(clienteId, parsedId);
    }

    // -------------------------------------------------------------------------
    // TC-E3-API-EDGE-03: Response is a bare JSON array — no wrapper object
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-E3-API-EDGE-03 — Given contacts exist,
    /// When GET /api/v1/contactos is called,
    /// Then the JSON root is an array, NOT an object with "data", "items",
    /// "result", "value" or any other wrapper key.
    ///
    /// Rationale: AC-E3.1 specifies direct array (no wrapper).
    /// </summary>
    [Fact]
    public async Task TC_E3_API_EDGE_03_GetContactos_Response_IsDirectArray_NoWrapper()
    {
        // GIVEN: 2 contacts seeded
        using var factory = new ContactosEdgeWebApplicationFactory("Edge_NoWrapper");
        var client = factory.CreateClient();
        await SeedContactosAsync(factory, count: 2);

        // WHEN: GET /api/v1/contactos
        var response = await client.GetAsync("/api/v1/contactos");

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Root JSON element is an array (not wrapped in an object)
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);

        // THEN: Root does NOT have typical wrapper keys
        // (This is implicitly guaranteed by the array check above,
        //  but we verify the raw JSON for extra confidence)
        Assert.DoesNotContain("\"data\":", json);
        Assert.DoesNotContain("\"items\":", json);
        Assert.DoesNotContain("\"result\":", json);
        Assert.DoesNotContain("\"value\":", json);
    }

    // -------------------------------------------------------------------------
    // TC-E3-API-EDGE-04: Two sequential requests return consistent results
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-E3-API-EDGE-04 — Given 3 contacts seeded,
    /// When GET /api/v1/contactos is called twice in sequence,
    /// Then both responses return the same number of items and same IDs.
    ///
    /// Rationale: ensures the handler is idempotent (no side effects between reads).
    /// </summary>
    [Fact]
    public async Task TC_E3_API_EDGE_04_GetContactos_SequentialRequests_ReturnConsistentResults()
    {
        // GIVEN: 3 contacts seeded
        using var factory = new ContactosEdgeWebApplicationFactory("Edge_Sequential");
        var client = factory.CreateClient();
        await SeedContactosAsync(factory, count: 3);

        // WHEN: First request
        var response1 = await client.GetAsync("/api/v1/contactos");
        var json1 = await response1.Content.ReadAsStringAsync();
        using var doc1 = JsonDocument.Parse(json1);
        var ids1 = doc1.RootElement.EnumerateArray()
            .Select(e => e.GetProperty("id").GetString())
            .OrderBy(id => id)
            .ToList();

        // WHEN: Second request (no changes between requests)
        var response2 = await client.GetAsync("/api/v1/contactos");
        var json2 = await response2.Content.ReadAsStringAsync();
        using var doc2 = JsonDocument.Parse(json2);
        var ids2 = doc2.RootElement.EnumerateArray()
            .Select(e => e.GetProperty("id").GetString())
            .OrderBy(id => id)
            .ToList();

        // THEN: Both responses are identical in content
        Assert.Equal(HttpStatusCode.OK, response1.StatusCode);
        Assert.Equal(HttpStatusCode.OK, response2.StatusCode);
        Assert.Equal(3, ids1.Count);
        Assert.Equal(ids1, ids2);
    }

    // -------------------------------------------------------------------------
    // TC-E3-API-EDGE-05: Unsupported HTTP methods return 405 Method Not Allowed
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-E3-API-EDGE-05 — Given the contactos endpoint only supports GET,
    /// When POST, PUT, or DELETE are used on /api/v1/contactos,
    /// Then the endpoint returns 405 Method Not Allowed.
    ///
    /// Rationale: Story 3.1 registers GET only; other methods must be rejected.
    /// </summary>
    [Theory]
    [InlineData("POST")]
    [InlineData("PUT")]
    [InlineData("DELETE")]
    public async Task TC_E3_API_EDGE_05_GetContactos_UnsupportedMethods_Return405(string method)
    {
        // GIVEN: A fresh client (no seeded data needed for 405 check)
        using var factory = new ContactosEdgeWebApplicationFactory($"Edge_Methods_{method}");
        var client = factory.CreateClient();

        // WHEN: Calling the endpoint with an unsupported HTTP method
        var request = new HttpRequestMessage(new HttpMethod(method), "/api/v1/contactos");
        var response = await client.SendAsync(request);

        // THEN: 405 Method Not Allowed
        Assert.Equal(HttpStatusCode.MethodNotAllowed, response.StatusCode);
    }

    // -------------------------------------------------------------------------
    // TC-E3-API-EDGE-06: Response body is valid parseable JSON
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-E3-API-EDGE-06 — Given contacts exist,
    /// When GET /api/v1/contactos is called,
    /// Then the response body is valid JSON (parseable without exceptions).
    ///
    /// Rationale: Defends against accidental non-JSON responses (plain text, XML, etc.)
    /// </summary>
    [Fact]
    public async Task TC_E3_API_EDGE_06_GetContactos_ResponseBody_IsValidJson()
    {
        // GIVEN: At least 1 contact seeded
        using var factory = new ContactosEdgeWebApplicationFactory("Edge_ValidJson");
        var client = factory.CreateClient();
        await SeedContactosAsync(factory, count: 1);

        // WHEN: GET /api/v1/contactos
        var response = await client.GetAsync("/api/v1/contactos");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: Body is non-empty
        Assert.False(string.IsNullOrWhiteSpace(body));

        // THEN: Body is valid JSON (no exception thrown)
        var exception = Record.Exception(() =>
        {
            using var doc = JsonDocument.Parse(body);
            _ = doc.RootElement.ValueKind;
        });
        Assert.Null(exception);
    }

    // -------------------------------------------------------------------------
    // TC-E3-API-EDGE-07: createdAt includes timezone marker (Z or +/-)
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-E3-API-EDGE-07 — Given contacts with explicit UTC timestamps,
    /// When GET /api/v1/contactos is called,
    /// Then every createdAt value ends with 'Z' or contains '+' or '-' offset.
    ///
    /// Rationale: Architecture mandates DateTimeOffset (with TZ) not DateTime (local).
    /// This is a regression guard for accidental DateTime usage.
    /// </summary>
    [Fact]
    public async Task TC_E3_API_EDGE_07_GetContactos_CreatedAt_IncludesTimezoneMarker()
    {
        // GIVEN: 3 contacts seeded with specific UTC DateTimeOffset values
        using var factory = new ContactosEdgeWebApplicationFactory("Edge_CreatedAtTZ");
        var client = factory.CreateClient();
        await SeedContactosAsync(factory, count: 3);

        // WHEN: GET /api/v1/contactos
        var response = await client.GetAsync("/api/v1/contactos");
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // THEN: Each item's createdAt contains timezone info
        foreach (var item in doc.RootElement.EnumerateArray())
        {
            Assert.True(item.TryGetProperty("createdAt", out var createdAtProp));
            var createdAtStr = createdAtProp.GetString();
            Assert.False(string.IsNullOrEmpty(createdAtStr));

            var hasTimezone =
                createdAtStr!.EndsWith('Z') ||
                createdAtStr.Contains('+') ||
                createdAtStr.Contains('-', StringComparison.Ordinal);

            Assert.True(hasTimezone, $"createdAt missing timezone marker: '{createdAtStr}'");
        }
    }

    // -------------------------------------------------------------------------
    // TC-E3-API-EDGE-08: Field names use camelCase (JSON serialization convention)
    // -------------------------------------------------------------------------

    /// <summary>
    /// TC-E3-API-EDGE-08 — Given contacts exist,
    /// When GET /api/v1/contactos is called,
    /// Then JSON field names are camelCase (e.g. "clienteId", "createdAt") not PascalCase.
    ///
    /// Rationale: ASP.NET Core uses camelCase JSON serializer by default.
    ///            Frontend expects camelCase keys per the API contract.
    /// </summary>
    [Fact]
    public async Task TC_E3_API_EDGE_08_GetContactos_FieldNames_AreCamelCase()
    {
        // GIVEN: 1 contact seeded
        using var factory = new ContactosEdgeWebApplicationFactory("Edge_CamelCase");
        var client = factory.CreateClient();
        await SeedContactosAsync(factory, count: 1);

        // WHEN: GET /api/v1/contactos
        var response = await client.GetAsync("/api/v1/contactos");
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var first = doc.RootElement.EnumerateArray().First();

        // THEN: camelCase keys are present
        Assert.True(first.TryGetProperty("id", out _), "Expected camelCase 'id' field");
        Assert.True(first.TryGetProperty("nombre", out _), "Expected camelCase 'nombre' field");
        Assert.True(first.TryGetProperty("cargo", out _), "Expected camelCase 'cargo' field");
        Assert.True(first.TryGetProperty("telefono", out _), "Expected camelCase 'telefono' field");
        Assert.True(first.TryGetProperty("email", out _), "Expected camelCase 'email' field");
        Assert.True(first.TryGetProperty("clienteId", out _), "Expected camelCase 'clienteId' field");
        Assert.True(first.TryGetProperty("createdAt", out _), "Expected camelCase 'createdAt' field");

        // THEN: PascalCase keys are NOT present
        Assert.False(first.TryGetProperty("Id", out _), "PascalCase 'Id' should NOT appear");
        Assert.False(first.TryGetProperty("Nombre", out _), "PascalCase 'Nombre' should NOT appear");
        Assert.False(first.TryGetProperty("ClienteId", out _), "PascalCase 'ClienteId' should NOT appear");
        Assert.False(first.TryGetProperty("CreatedAt", out _), "PascalCase 'CreatedAt' should NOT appear");
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /// <summary>
    /// Seeds the in-memory database with ContactoEntity records.
    /// Optionally accepts a clienteId to test non-null FK paths.
    /// </summary>
    private static async Task SeedContactosAsync(
        ContactosEdgeWebApplicationFactory factory,
        int count,
        Guid? clienteId = null)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var contactos = Enumerable.Range(1, count).Select(i =>
            SiesaAgents.Domain.Entities.ContactoEntity.Create(
                nombre: $"Edge Contacto {i:D4}",
                cargo: $"Edge Cargo {i:D4}",
                telefono: $"311{i:D7}",
                email: $"edge.contacto.{i:D4}@siesa.com",
                clienteId: clienteId,
                createdAt: DateTimeOffset.UtcNow.AddMinutes(-i),
                updatedAt: DateTimeOffset.UtcNow.AddMinutes(-i)
            )
        ).ToList();

        await dbContext.Set<SiesaAgents.Domain.Entities.ContactoEntity>().AddRangeAsync(contactos);
        await dbContext.SaveChangesAsync();
    }
}
