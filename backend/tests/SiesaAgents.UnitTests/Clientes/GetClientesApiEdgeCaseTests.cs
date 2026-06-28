using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Clientes;

/// <summary>
/// Edge-case API tests — Story 2.1: GET /api/v1/clientes (expands ATDD coverage).
///
/// Test IDs covered:
///   TC-E2-2-1-API-EC-1 (P1) — Response Content-Type is application/json
///   TC-E2-2-1-API-EC-2 (P1) — Response body is a JSON array (not a wrapper object)
///   TC-E2-2-1-API-EC-3 (P1) — Each DTO in response has all required fields
///   TC-E2-2-1-API-EC-4 (P1) — GET /api/v1/clientes with multiple seeded clients returns all of them
///   TC-E2-2-1-API-EC-5 (P2) — Duplicate NIT rejected: POST with existing NIT returns 409
///   TC-E2-2-1-API-EC-6 (P2) — GET /api/v1/clientes response includes DateTimeOffset (ISO 8601) for CreatedAt
/// </summary>
public class GetClientesApiEdgeCaseTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public GetClientesApiEdgeCaseTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private async Task<ClienteResponse?> CreateClienteAsync(string? nitSuffix = null)
    {
        var ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() % 1_000_000;
        var suffix = nitSuffix ?? ts.ToString("D6");
        var payload = new
        {
            nombre = $"Test Empresa {suffix}",
            nit = $"901{suffix}-2",
            telefono = "3012345678",
            ciudad = "Cali"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);
        if (!response.IsSuccessStatusCode) return null;
        return await response.Content.ReadFromJsonAsync<ClienteResponse>();
    }

    private async Task DeleteClienteAsync(Guid id)
    {
        await _client.DeleteAsync($"/api/v1/clientes/{id}");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-1-API-EC-1 (P1) — Response Content-Type is application/json
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-1-API-EC-1 (P1)
    /// GIVEN the backend is running
    /// WHEN GET /api/v1/clientes is called
    /// THEN the response Content-Type header includes "application/json"
    /// </summary>
    [Fact]
    public async Task GetClientes_WhenCalled_ReturnsApplicationJsonContentType()
    {
        // GIVEN: Backend is running
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();

        // WHEN: GET /api/v1/clientes is called
        var response = await _client.GetAsync("/api/v1/clientes");

        // THEN: Content-Type includes application/json
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.MediaType;
        Assert.Equal("application/json", contentType);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-1-API-EC-2 (P1) — Response body is a JSON array (not a wrapper object)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-1-API-EC-2 (P1)
    /// GIVEN the backend is running
    /// WHEN GET /api/v1/clientes is called
    /// THEN the response root JSON element is an array (no { data: [], total: 0 } wrapper)
    /// </summary>
    [Fact]
    public async Task GetClientes_WhenCalled_ReturnsRootJsonArray_NotWrappedObject()
    {
        // GIVEN: Backend is running
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();

        // WHEN: GET /api/v1/clientes is called
        var response = await _client.GetAsync("/api/v1/clientes");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // THEN: The root JSON element is an Array (not Object)
        var rawJson = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(rawJson);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-1-API-EC-3 (P1) — Each DTO has all required fields
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-1-API-EC-3 (P1)
    /// GIVEN a seeded client in the database
    /// WHEN GET /api/v1/clientes is called
    /// THEN each item in the array contains id, nombre, nit, telefono, ciudad, createdAt, updatedAt
    /// </summary>
    [Fact]
    public async Task GetClientes_WithSeededClient_ResponseContainsAllDtoFields()
    {
        // GIVEN: One seeded client
        var created = await CreateClienteAsync();
        Assert.NotNull(created);

        try
        {
            // WHEN: GET /api/v1/clientes is called
            var response = await _client.GetAsync("/api/v1/clientes");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var rawJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(rawJson);
            Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);

            // Find the created item in the response
            var item = doc.RootElement.EnumerateArray()
                .FirstOrDefault(el =>
                    el.TryGetProperty("id", out var idEl) &&
                    idEl.GetString() == created.Id.ToString());

            Assert.True(item.ValueKind != JsonValueKind.Undefined,
                "Created cliente not found in response array.");

            // THEN: All required DTO fields are present
            Assert.True(item.TryGetProperty("id", out _), "Missing field: id");
            Assert.True(item.TryGetProperty("nombre", out _), "Missing field: nombre");
            Assert.True(item.TryGetProperty("nit", out _), "Missing field: nit");
            Assert.True(item.TryGetProperty("telefono", out _), "Missing field: telefono");
            Assert.True(item.TryGetProperty("ciudad", out _), "Missing field: ciudad");
            Assert.True(item.TryGetProperty("createdAt", out _), "Missing field: createdAt");
            Assert.True(item.TryGetProperty("updatedAt", out _), "Missing field: updatedAt");
        }
        finally
        {
            await DeleteClienteAsync(created!.Id);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-1-API-EC-4 (P1) — Multiple seeded clients all appear in response
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-1-API-EC-4 (P1)
    /// GIVEN three clients seeded in the database
    /// WHEN GET /api/v1/clientes is called
    /// THEN all three clients appear in the response array
    /// </summary>
    [Fact]
    public async Task GetClientes_WithMultipleSeededClients_ReturnsAllInArray()
    {
        // GIVEN: Three seeded clients with unique NITs
        var ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() % 100_000;
        var c1 = await CreateClienteAsync($"{ts}A01");
        var c2 = await CreateClienteAsync($"{ts}A02");
        var c3 = await CreateClienteAsync($"{ts}A03");

        Assert.NotNull(c1);
        Assert.NotNull(c2);
        Assert.NotNull(c3);

        try
        {
            // WHEN: GET /api/v1/clientes is called
            var response = await _client.GetAsync("/api/v1/clientes");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<List<ClienteResponse>>();
            Assert.NotNull(body);

            // THEN: All three created clients appear in the response
            var ids = body.Select(c => c.Id).ToHashSet();
            Assert.Contains(c1!.Id, ids);
            Assert.Contains(c2!.Id, ids);
            Assert.Contains(c3!.Id, ids);
        }
        finally
        {
            await DeleteClienteAsync(c1!.Id);
            await DeleteClienteAsync(c2!.Id);
            await DeleteClienteAsync(c3!.Id);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-1-API-EC-5 (P2) — Duplicate NIT returns 409 Conflict
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-1-API-EC-5 (P2)
    /// GIVEN a client with NIT "999888777-5" already exists
    /// WHEN POST /api/v1/clientes is called again with the same NIT
    /// THEN the response is 409 Conflict (enforced by uk_clientes_nit unique index)
    /// </summary>
    [Fact]
    public async Task PostCliente_WhenNitAlreadyExists_Returns409Conflict()
    {
        // GIVEN: A client with a specific NIT already in the database
        var ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() % 1_000_000;
        var duplicateNit = $"999{ts:D6}-5";

        var firstPayload = new
        {
            nombre = "Primera Empresa",
            nit = duplicateNit,
            telefono = "3001111111",
            ciudad = "Bogotá"
        };

        var firstResponse = await _client.PostAsJsonAsync("/api/v1/clientes", firstPayload);
        Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);

        var firstCreated = await firstResponse.Content.ReadFromJsonAsync<ClienteResponse>();
        Assert.NotNull(firstCreated);

        try
        {
            // WHEN: POST with duplicate NIT
            var duplicatePayload = new
            {
                nombre = "Segunda Empresa",
                nit = duplicateNit,
                telefono = "3002222222",
                ciudad = "Medellín"
            };

            var duplicateResponse = await _client.PostAsJsonAsync("/api/v1/clientes", duplicatePayload);

            // THEN: Conflict returned
            Assert.Equal(HttpStatusCode.Conflict, duplicateResponse.StatusCode);
        }
        finally
        {
            await DeleteClienteAsync(firstCreated!.Id);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-2-1-API-EC-6 (P2) — createdAt is ISO 8601 DateTimeOffset format
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E2-2-1-API-EC-6 (P2)
    /// GIVEN a seeded client in the database
    /// WHEN GET /api/v1/clientes is called
    /// THEN the createdAt field is a valid ISO 8601 datetime string parseable as DateTimeOffset
    /// </summary>
    [Fact]
    public async Task GetClientes_WithSeededClient_CreatedAtIsValidIso8601DateTimeOffset()
    {
        // GIVEN: One seeded client
        var created = await CreateClienteAsync();
        Assert.NotNull(created);

        try
        {
            // WHEN: GET /api/v1/clientes is called
            var body = await _client.GetFromJsonAsync<List<ClienteResponse>>("/api/v1/clientes");
            Assert.NotNull(body);

            var item = body.FirstOrDefault(c => c.Id == created!.Id);
            Assert.NotNull(item);

            // THEN: createdAt and updatedAt are valid DateTimeOffset values (UTC)
            Assert.NotEqual(default, item!.CreatedAt);
            Assert.NotEqual(default, item.UpdatedAt);
            Assert.Equal(TimeSpan.Zero, item.CreatedAt.Offset); // UTC
        }
        finally
        {
            await DeleteClienteAsync(created!.Id);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response DTO (matches GET /api/v1/clientes JSON shape)
    // ─────────────────────────────────────────────────────────────────────────

    private sealed record ClienteResponse(
        Guid Id,
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt
    );
}
