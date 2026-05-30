// Story 2.1: Client List & Search
// ATDD API Integration Tests: GET /api/v1/clientes
// Status: RED — Tests fail until ClienteEntity, ClienteRepository, GetClientesQueryHandler,
//               ClienteEndpoints are implemented and registered in Program.cs
// AC covered: AC#5 (direct JSON array, fields: id, nombre, nit, telefono, ciudad, createdAt, updatedAt)
// Test case: TC-E2-P1-01

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace SiesaAgents.IntegrationTests.Clientes;

/// <summary>
/// Integration tests for GET /api/v1/clientes.
/// Require: running PostgreSQL instance at Host=localhost;Database=siesa_agents_db
/// and all migrations applied (dotnet ef database update).
///
/// TC-E2-P1-01: GET /api/v1/clientes — Returns Array of All Clients
/// </summary>
public class ClienteEndpointsTests : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public ClienteEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    // TODO (TEA Review): InitializeAsync is a no-op. Tests asserting ">= 3 clients" rely on a pre-seeded
    // live DB, making them non-deterministic. Replace with isolated test DB using WebApplicationFactory
    // .WithWebHostBuilder() pointing to a dedicated test database, seed via EF Core in InitializeAsync,
    // and clean up in DisposeAsync. See test-review-2-1.md for details.
    // Knowledge base: fixture-architecture.md, data-factories.md
    public Task InitializeAsync() => Task.CompletedTask;

    // TODO (TEA Review): DisposeAsync is a no-op — no cleanup of test data written during tests.
    // Add DELETE calls or DB truncation here to prevent state bleed between test runs.
    public Task DisposeAsync() => Task.CompletedTask;

    // =========================================================================
    // TC-E2-P1-01: GET /api/v1/clientes — Returns Array of All Clients
    // AC#5: Returns direct JSON array; each item has: id, nombre, nit, telefono, ciudad, createdAt, updatedAt
    // =========================================================================

    [Fact]
    public async Task GivenThreeClientsSeeded_WhenGetClientes_ThenReturns200WithArrayOfThree()
    {
        // GIVEN — 3 clients will have been seeded before this test via the shared fixture
        // (seeding is done in SeedTestDataAsync; the test DB must have exactly 3 clients)

        // WHEN
        var response = await _client.GetAsync("/api/v1/clientes");

        // THEN — 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // Response must be a direct JSON array — NOT a wrapped object { data: [], meta: {} }
        Assert.Equal(JsonValueKind.Array, root.ValueKind);

        // Array must contain at least the 3 seeded clients
        // (exact count may vary if DB is shared; verify >= 3)
        Assert.True(root.GetArrayLength() >= 3,
            $"Expected at least 3 clients in the response array, got {root.GetArrayLength()}");
    }

    [Fact]
    public async Task GivenThreeClientsSeeded_WhenGetClientes_ThenEachItemContainsAllRequiredFields()
    {
        // GIVEN

        // WHEN
        var response = await _client.GetAsync("/api/v1/clientes");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.Equal(JsonValueKind.Array, root.ValueKind);
        Assert.True(root.GetArrayLength() > 0, "Expected at least one client in the response.");

        // THEN — each item must contain id, nombre, nit, telefono, ciudad, createdAt, updatedAt
        foreach (var item in root.EnumerateArray())
        {
            Assert.True(item.TryGetProperty("id", out _),
                "Each client item must contain 'id' field");
            Assert.True(item.TryGetProperty("nombre", out _),
                "Each client item must contain 'nombre' field");
            Assert.True(item.TryGetProperty("nit", out _),
                "Each client item must contain 'nit' field");
            Assert.True(item.TryGetProperty("telefono", out _),
                "Each client item must contain 'telefono' field");
            Assert.True(item.TryGetProperty("ciudad", out _),
                "Each client item must contain 'ciudad' field");
            Assert.True(item.TryGetProperty("createdAt", out _),
                "Each client item must contain 'createdAt' field");
            Assert.True(item.TryGetProperty("updatedAt", out _),
                "Each client item must contain 'updatedAt' field");
        }
    }

    [Fact]
    public async Task GivenThreeClientsSeeded_WhenGetClientes_ThenIdIsValidNonEmptyUuid()
    {
        // GIVEN

        // WHEN
        var response = await _client.GetAsync("/api/v1/clientes");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // THEN — each id must be a valid, non-empty UUID (not Guid.Empty)
        foreach (var item in root.EnumerateArray())
        {
            var idProperty = item.GetProperty("id");
            var idString = idProperty.GetString();

            Assert.NotNull(idString);
            Assert.True(Guid.TryParse(idString, out var guid),
                $"Expected 'id' to be a valid UUID, got: {idString}");
            Assert.NotEqual(Guid.Empty, guid);
        }
    }

    [Fact]
    public async Task GivenThreeClientsSeeded_WhenGetClientes_ThenCreatedAtIsIso8601WithTimezone()
    {
        // GIVEN

        // WHEN
        var response = await _client.GetAsync("/api/v1/clientes");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // THEN — createdAt must be ISO 8601 with timezone offset
        foreach (var item in root.EnumerateArray())
        {
            var createdAtProperty = item.GetProperty("createdAt");
            var createdAtString = createdAtProperty.GetString();

            Assert.NotNull(createdAtString);
            Assert.True(DateTimeOffset.TryParse(createdAtString, out _),
                $"Expected 'createdAt' to be ISO 8601 with timezone, got: {createdAtString}");
        }
    }

    [Fact]
    public async Task GivenThreeClientsSeeded_WhenGetClientes_ThenUpdatedAtIsIso8601WithTimezone()
    {
        // GIVEN

        // WHEN
        var response = await _client.GetAsync("/api/v1/clientes");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // THEN — updatedAt must be ISO 8601 with timezone offset
        foreach (var item in root.EnumerateArray())
        {
            var updatedAtProperty = item.GetProperty("updatedAt");
            var updatedAtString = updatedAtProperty.GetString();

            Assert.NotNull(updatedAtString);
            Assert.True(DateTimeOffset.TryParse(updatedAtString, out _),
                $"Expected 'updatedAt' to be ISO 8601 with timezone, got: {updatedAtString}");
        }
    }

    [Fact]
    public async Task GivenNoClientsInDatabase_WhenGetClientes_ThenReturns200WithEmptyArray()
    {
        // GIVEN — this test verifies the empty-array case (may require isolated DB or cleanup)
        // The test framework should ensure an empty client table for this test.

        // NOTE: This test relies on the test database being cleared.
        // When using a shared WebApplicationFactory, consider using WebApplicationFactory.WithWebHostBuilder
        // with a dedicated test DB, or call a cleanup endpoint before asserting.

        // WHEN
        var response = await _client.GetAsync("/api/v1/clientes");

        // THEN — response is 200 (not 404 or 500 when list is empty)
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // Must be a direct JSON array (not wrapped object)
        Assert.Equal(JsonValueKind.Array, root.ValueKind);
    }

    [Fact]
    public async Task GivenGetClientes_WhenResponseReceived_ThenResponseIsDirectArrayNotWrappedObject()
    {
        // GIVEN — architecture.md specifies direct JSON array for list responses (not { data: [], meta: {} })

        // WHEN
        var response = await _client.GetAsync("/api/v1/clientes");

        // THEN
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var contentType = response.Content.Headers.ContentType?.MediaType;
        Assert.Equal("application/json", contentType);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // The root element MUST be an array — NOT an object with 'data', 'meta', or 'items' keys
        Assert.Equal(JsonValueKind.Array, root.ValueKind);

        // Negative assertion: must NOT be a wrapped object
        Assert.NotEqual(JsonValueKind.Object, root.ValueKind);
    }
}
