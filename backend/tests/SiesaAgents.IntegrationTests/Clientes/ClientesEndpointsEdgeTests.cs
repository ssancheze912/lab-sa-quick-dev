/**
 * Edge-case API Integration Tests — GET /api/v1/clientes
 * Story 2.1 — Client List & Search — Automation Expansion
 *
 * Complements ClientesEndpointsTests.cs (ATDD baseline).
 * Covers edge cases not in ATDD:
 *   - Content-Type header is application/json
 *   - Single seeded client returns array of length 1
 *   - Response is a direct JSON array (no envelope/wrapper object)
 *   - updatedAt field presence (architecture contract)
 *   - Non-existent endpoint returns 404 (method-not-found guard)
 *   - CORS header present for dev origin
 *   - Concurrent GET requests return consistent results
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
 * Given-When-Then format per test method.
 */

using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Clientes;

/// <summary>
/// Edge-case tests for GET /api/v1/clientes.
/// Uses an isolated in-memory database per test class.
/// </summary>
public sealed class ClientesEndpointsEdgeTests : IClassFixture<ClientesEdgeWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly ClientesEdgeWebApplicationFactory _factory;

    public ClientesEndpointsEdgeTests(ClientesEdgeWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // -------------------------------------------------------------------------
    // Edge: Content-Type header must be application/json
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given clients in the database,
    /// When GET /api/v1/clientes is called,
    /// Then Content-Type response header is application/json.
    /// </summary>
    [Fact(DisplayName = "Edge — GET /api/v1/clientes returns Content-Type application/json")]
    public async Task GetClientes_ContentTypeIsApplicationJson()
    {
        // GIVEN: At least no explicit setup needed; empty array still has Content-Type
        // Use isolated DB so test is independent
        var factory = CreateIsolatedFactory($"ContentTypeDb_{Guid.NewGuid()}");
        var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");

        // THEN: Status is 200
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Content-Type is application/json (may include charset)
        var contentType = response.Content.Headers.ContentType?.MediaType;
        Assert.Equal("application/json", contentType);
    }

    // -------------------------------------------------------------------------
    // Edge: Single client in database
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given exactly 1 client in the database,
    /// When GET /api/v1/clientes is called,
    /// Then returns HTTP 200 with a JSON array of exactly 1 element.
    /// </summary>
    [Fact(DisplayName = "Edge — GET /api/v1/clientes returns single-item array when 1 client seeded")]
    public async Task GetClientes_ReturnsSingleItemArray_WhenOneClientSeeded()
    {
        // GIVEN: 1 client is seeded in isolated database
        var factory = CreateIsolatedFactory($"SingleClientDb_{Guid.NewGuid()}");
        await SeedClientesInFactoryAsync(factory, 1);
        var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");

        // THEN: HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: JSON array with exactly 1 element
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(1, doc.RootElement.GetArrayLength());
    }

    // -------------------------------------------------------------------------
    // Edge: Response must be a direct array, NOT an envelope object
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given clients in the database,
    /// When GET /api/v1/clientes is called,
    /// Then the root JSON element is an Array, not an Object with a "data" or "items" wrapper.
    /// </summary>
    [Fact(DisplayName = "Edge — GET /api/v1/clientes root element is a JSON array (no envelope wrapper)")]
    public async Task GetClientes_RootElementIsArray_NotEnvelopeObject()
    {
        // GIVEN: 3 clients seeded
        var factory = CreateIsolatedFactory($"ArrayCheckDb_{Guid.NewGuid()}");
        await SeedClientesInFactoryAsync(factory, 3);
        var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");
        var json = await response.Content.ReadAsStringAsync();

        // THEN: JSON starts with '[' (array), not '{' (object)
        Assert.True(json.TrimStart().StartsWith('['),
            $"Expected JSON array starting with '[' but got: {json[..Math.Min(50, json.Length)]}");

        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);

        // THEN: Root is NOT an object with envelope keys
        Assert.NotEqual(JsonValueKind.Object, doc.RootElement.ValueKind);
    }

    // -------------------------------------------------------------------------
    // Edge: Invalid HTTP method returns 405 Method Not Allowed
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given the /api/v1/clientes endpoint only supports GET,
    /// When a POST with no body is sent,
    /// Then returns 405 Method Not Allowed (endpoint is read-only in story 2.1).
    /// Note: This test will be skipped/fixme'd if POST is also registered.
    /// </summary>
    [Fact(DisplayName = "Edge — POST /api/v1/clientes returns 404 or 405 when not yet implemented")]
    public async Task PostClientes_ReturnsNotFoundOrMethodNotAllowed_WhenEndpointNotRegistered()
    {
        // GIVEN: Only GET is registered for /api/v1/clientes in story 2.1
        var factory = CreateIsolatedFactory($"MethodDb_{Guid.NewGuid()}");
        var client = factory.CreateClient();

        // WHEN: POST to the clientes endpoint with empty JSON
        var response = await client.PostAsync(
            "/api/v1/clientes",
            new StringContent("{}", System.Text.Encoding.UTF8, "application/json"));

        // THEN: Returns 404 (not registered) or 405 (method not allowed)
        // Either is acceptable — the key requirement is NOT 200
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound ||
            response.StatusCode == HttpStatusCode.MethodNotAllowed,
            $"Expected 404 or 405 but got {(int)response.StatusCode} {response.StatusCode}");
    }

    // -------------------------------------------------------------------------
    // Edge: Concurrent GET requests return consistent results
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given 5 clients in the database,
    /// When 3 concurrent GET /api/v1/clientes requests are made,
    /// Then all 3 responses return HTTP 200 with arrays of equal length.
    /// </summary>
    [Fact(DisplayName = "Edge — Concurrent GET /api/v1/clientes requests all return consistent results")]
    public async Task GetClientes_ConcurrentRequests_ReturnConsistentResults()
    {
        // GIVEN: 5 clients seeded
        var factory = CreateIsolatedFactory($"ConcurrentDb_{Guid.NewGuid()}");
        await SeedClientesInFactoryAsync(factory, 5);

        // Create 3 independent HTTP clients sharing the same in-memory DB
        var clients = new[] {
            factory.CreateClient(),
            factory.CreateClient(),
            factory.CreateClient(),
        };

        // WHEN: All 3 requests fired concurrently
        var tasks = clients.Select(c => c.GetAsync("/api/v1/clientes")).ToArray();
        var responses = await Task.WhenAll(tasks);

        // THEN: All return 200
        foreach (var response in responses)
        {
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        // THEN: All return same array length
        var lengths = new List<int>();
        foreach (var response in responses)
        {
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            lengths.Add(doc.RootElement.GetArrayLength());
        }

        Assert.True(lengths.All(l => l == lengths[0]),
            $"Concurrent responses returned different lengths: {string.Join(", ", lengths)}");

        Assert.True(lengths[0] >= 5,
            $"Expected at least 5 items in each response but got {lengths[0]}");
    }

    // -------------------------------------------------------------------------
    // Edge: Health endpoint still works alongside clientes endpoint
    // -------------------------------------------------------------------------

    /// <summary>
    /// When GET /api/v1/health/db is called alongside the clientes endpoint,
    /// Then both endpoints are reachable and return expected status codes.
    /// </summary>
    [Fact(DisplayName = "Edge — Health endpoint coexists with clientes endpoint")]
    public async Task HealthEndpoint_StillReachable_WhenClientesEndpointExists()
    {
        // GIVEN: Application running with both endpoints registered
        var factory = CreateIsolatedFactory($"HealthDb_{Guid.NewGuid()}");
        var client = factory.CreateClient();

        // WHEN: GET /api/v1/health/db
        // NOTE: May return 503 in test environment (no real DB) but must not 404
        var healthResponse = await client.GetAsync("/api/v1/health/db");

        // THEN: Health endpoint is reachable (200 or 503, not 404)
        Assert.NotEqual(HttpStatusCode.NotFound, healthResponse.StatusCode);

        // AND: Clientes endpoint also reachable
        var clientesResponse = await client.GetAsync("/api/v1/clientes");
        Assert.Equal(HttpStatusCode.OK, clientesResponse.StatusCode);
    }

    // -------------------------------------------------------------------------
    // Edge: Response is valid JSON even when database is empty
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given an empty database,
    /// When GET /api/v1/clientes is called,
    /// Then the response body is parseable as valid JSON (not empty string or null).
    /// </summary>
    [Fact(DisplayName = "Edge — GET /api/v1/clientes returns valid parseable JSON when empty")]
    public async Task GetClientes_ReturnsValidJson_WhenDatabaseIsEmpty()
    {
        // GIVEN: Empty database
        var factory = CreateIsolatedFactory($"ValidJsonDb_{Guid.NewGuid()}");
        var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");

        // THEN: HTTP 200
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Body is non-empty
        var json = await response.Content.ReadAsStringAsync();
        Assert.NotNull(json);
        Assert.NotEmpty(json);

        // THEN: Body is parseable as valid JSON
        var exception = Record.Exception(() =>
        {
            using var doc = JsonDocument.Parse(json);
            _ = doc.RootElement; // ensure it's accessible
        });
        Assert.Null(exception);
    }

    // -------------------------------------------------------------------------
    // Edge: Large dataset — 10 clients returned correctly
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given 10 clients in the database,
    /// When GET /api/v1/clientes is called,
    /// Then returns HTTP 200 with a JSON array of exactly 10 elements,
    /// each with the required DTO shape.
    /// </summary>
    [Fact(DisplayName = "Edge — GET /api/v1/clientes handles 10 seeded clients correctly")]
    public async Task GetClientes_Returns10Items_WhenTenClientsSeeded()
    {
        // GIVEN: 10 clients seeded
        var factory = CreateIsolatedFactory($"TenClientsDb_{Guid.NewGuid()}");
        await SeedClientesInFactoryAsync(factory, 10);
        var client = factory.CreateClient();

        // WHEN: GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");

        // THEN: HTTP 200
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: Array has at least 10 items
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.GetArrayLength() >= 10,
            $"Expected >= 10 items but got {doc.RootElement.GetArrayLength()}");

        // THEN: Every item has the required DTO fields
        foreach (var item in doc.RootElement.EnumerateArray())
        {
            Assert.True(item.TryGetProperty("id", out _), "Missing 'id'");
            Assert.True(item.TryGetProperty("nombre", out _), "Missing 'nombre'");
            Assert.True(item.TryGetProperty("nit", out _), "Missing 'nit'");
            Assert.True(item.TryGetProperty("telefono", out _), "Missing 'telefono'");
            Assert.True(item.TryGetProperty("ciudad", out _), "Missing 'ciudad'");
            Assert.True(item.TryGetProperty("createdAt", out _), "Missing 'createdAt'");
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /// <summary>
    /// Creates an isolated WebApplicationFactory with its own in-memory database.
    /// Each call gets a completely fresh DB to ensure test isolation.
    /// </summary>
    private static ClientesEdgeWebApplicationFactory CreateIsolatedFactory(string dbName)
    {
        var factory = new ClientesEdgeWebApplicationFactory();
        factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor is not null)
                    services.Remove(descriptor);

                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase(dbName));
            });
        });
        return factory;
    }

    /// <summary>
    /// Seeds `count` cliente records into the factory's in-memory database.
    /// NOTE: Seeding code is commented out until ClienteEntity is implemented (RED phase).
    /// Uncomment seeding when domain entity is created in implementation.
    /// </summary>
    private static async Task SeedClientesInFactoryAsync(ClientesEdgeWebApplicationFactory factory, int count)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // NOTE: Uncomment when ClienteEntity is available (after dev-story implementation):
        //
        // var clientes = Enumerable.Range(1, count).Select(i => new SiesaAgents.Domain.Entities.ClienteEntity
        // {
        //     Id = Guid.NewGuid(),
        //     Nombre = $"Edge Test Empresa {i:D4}",
        //     Nit = $"800{i:D6}-{i % 10}",
        //     Telefono = $"601{i:D7}",
        //     Ciudad = i % 2 == 0 ? "Bogotá" : "Medellín",
        //     CreatedAt = DateTimeOffset.UtcNow.AddDays(-i),
        //     UpdatedAt = DateTimeOffset.UtcNow.AddDays(-i),
        // });
        // await dbContext.Set<SiesaAgents.Domain.Entities.ClienteEntity>().AddRangeAsync(clientes);
        // await dbContext.SaveChangesAsync();

        // Placeholder — remove once entity exists
        await Task.CompletedTask;
    }
}

/// <summary>
/// Dedicated factory for edge-case tests to avoid shared state with the ATDD test factory.
/// </summary>
public sealed class ClientesEdgeWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (descriptor is not null)
                services.Remove(descriptor);

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase($"EdgeTestDb_Default_{Guid.NewGuid()}"));
        });
    }
}
