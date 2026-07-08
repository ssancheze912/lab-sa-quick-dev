using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Api;

/// <summary>
/// Story 2.2 — Automate (Edge Cases).
///
/// Expands endpoint coverage of <c>GET /api/v1/clientes/{id:guid}</c> with
/// negative-path and boundary behaviours the ATDD suite skipped:
///   * <see cref="Guid.Empty"/> (all-zeros) returns 404 with Problem Details.
///   * UUID case-insensitivity — an uppercase-hex id and its lowercase
///     equivalent both match the same seed.
///   * Malformed segment variants (too short, too long, non-hex) all short-
///     circuit at the route constraint with 404.
///   * Unsupported HTTP verbs on the by-id route (POST, PUT, DELETE) return
///     404 or 405 — those verbs belong to Stories 2.3/2.4/2.5.
///   * Concurrent GETs by id share the fake repo without state leak.
///   * NFR6 anti-leak clauses stay tight on 404 (no exception/stackTrace).
///
/// [P1] tag — the by-id endpoint is the seam that FR30 deep-link URL entries
/// hit first; a leak or a wrong status code here breaks bookmark + share UX.
/// </summary>
public sealed class ClienteEndpointsGetByIdEdgeTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ClienteEndpointsGetByIdEdgeTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private WebApplicationFactory<Program> FactoryWithSeed(params ClienteEntity[] seed)
    {
        return _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IClienteRepository>();
                services.AddSingleton<IClienteRepository>(_ =>
                {
                    var fake = new FakeClienteRepository();
                    fake.Seed(seed);
                    return fake;
                });
            });
        });
    }

    // [P1] Guid.Empty is a well-formed UUID — the ":guid" constraint accepts it — and returns 404 (no matching row).
    [Fact]
    public async Task GetClienteById_ReturnsProblemDetails404_ForGuidEmpty()
    {
        using var factory = FactoryWithSeed(); // empty repository
        using var client = factory.CreateClient();

        var response = await client.GetAsync($"/api/v1/clientes/{Guid.Empty}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.StartsWith("application/problem+json",
            response.Content.Headers.ContentType?.MediaType ?? string.Empty);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"status\"", body);
        Assert.Contains("404", body);
        Assert.DoesNotContain("stackTrace", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("exception", body, StringComparison.OrdinalIgnoreCase);
    }

    // [P1] The route constraint is case-insensitive on hex chars — uppercase UUID must return the same seeded item.
    [Fact]
    public async Task GetClienteById_MatchesEntity_WhenUuidIsUppercase()
    {
        var entity = ClienteEntity.Create("Case Insensitive", "900123456", "3001234567", "Bogotá");
        using var factory = FactoryWithSeed(entity);
        using var client = factory.CreateClient();

        var idUpper = entity.Id.ToString().ToUpperInvariant();
        var response = await client.GetAsync($"/api/v1/clientes/{idUpper}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<ClienteResponse>();
        Assert.NotNull(dto);
        Assert.Equal(entity.Id, dto!.Id);
        Assert.Equal("Case Insensitive", dto.Nombre);
    }

    // [P1] A too-short segment (missing final group) is rejected by the :guid constraint.
    [Fact]
    public async Task GetClienteById_Returns404_WhenIdIsTruncatedUuid()
    {
        using var factory = FactoryWithSeed();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/clientes/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // [P1] An overlong segment (extra hex chars) is rejected by the :guid constraint.
    [Fact]
    public async Task GetClienteById_Returns404_WhenIdIsOverlongUuid()
    {
        using var factory = FactoryWithSeed();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/clientes/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeeee");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // [P2] A well-shaped id containing an out-of-range hex char (‘g’) is rejected as non-UUID.
    [Fact]
    public async Task GetClienteById_Returns404_WhenIdContainsNonHexChar()
    {
        using var factory = FactoryWithSeed();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/clientes/gggggggg-gggg-gggg-gggg-gggggggggggg");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // [P1] POST to the by-id route is not defined — must return 404 or 405.
    [Fact]
    public async Task Post_ToClienteByIdRoute_ReturnsNotFoundOr405()
    {
        var entity = ClienteEntity.Create("Empresa", "900123456", "3001234567", "Bogotá");
        using var factory = FactoryWithSeed(entity);
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync($"/api/v1/clientes/{entity.Id}", new { });

        Assert.True(
            response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.MethodNotAllowed,
            $"Expected 404 or 405 for unsupported POST, got {(int)response.StatusCode}");
    }

    // NOTE: PUT to the by-id route was a Story 2.3 negative guard;
    // Story 2.4 implements the endpoint, so the assertion no longer applies.
    // See ClienteEndpointsUpdateTests for the Story 2.4 positive-path coverage.

    // [P1] DELETE to the by-id route belongs to Story 2.5 — must return 404 or 405 for now.
    [Fact]
    public async Task Delete_ToClienteByIdRoute_ReturnsNotFoundOr405()
    {
        var entity = ClienteEntity.Create("Empresa", "900123456", "3001234567", "Bogotá");
        using var factory = FactoryWithSeed(entity);
        using var client = factory.CreateClient();

        var response = await client.DeleteAsync($"/api/v1/clientes/{entity.Id}");

        Assert.True(
            response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.MethodNotAllowed,
            $"Expected 404 or 405 for unsupported DELETE, got {(int)response.StatusCode}");
    }

    // [P2] Two parallel GET-by-id requests each observe the seeded item without state leak.
    [Fact]
    public async Task GetClienteById_HandlesConcurrentRequests_WithoutStateLeak()
    {
        var seed = new[]
        {
            ClienteEntity.Create("Uno", "900000001", "3000000001", "Bogotá"),
            ClienteEntity.Create("Dos", "900000002", "3000000002", "Medellín"),
        };
        using var factory = FactoryWithSeed(seed);
        using var client = factory.CreateClient();

        var t1 = client.GetAsync($"/api/v1/clientes/{seed[0].Id}");
        var t2 = client.GetAsync($"/api/v1/clientes/{seed[1].Id}");
        var t3 = client.GetAsync($"/api/v1/clientes/{seed[0].Id}");

        var responses = await Task.WhenAll(t1, t2, t3);

        foreach (var r in responses)
        {
            r.EnsureSuccessStatusCode();
        }

        var d1 = await responses[0].Content.ReadFromJsonAsync<ClienteResponse>();
        var d2 = await responses[1].Content.ReadFromJsonAsync<ClienteResponse>();
        var d3 = await responses[2].Content.ReadFromJsonAsync<ClienteResponse>();
        Assert.Equal("Uno", d1!.Nombre);
        Assert.Equal("Dos", d2!.Nombre);
        Assert.Equal("Uno", d3!.Nombre);
    }

    // [P2] A 200 response uses application/json content-type (charset details are framework-controlled).
    [Fact]
    public async Task GetClienteById_UsesJsonContentType_On200()
    {
        var entity = ClienteEntity.Create("Empresa", "900123456", "3001234567", "Bogotá");
        using var factory = FactoryWithSeed(entity);
        using var client = factory.CreateClient();

        var response = await client.GetAsync($"/api/v1/clientes/{entity.Id}");
        response.EnsureSuccessStatusCode();

        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
    }

    // [P2] The 200 payload for a single client is a JSON object — NOT an array (architecture doc "GET single → direct object").
    [Fact]
    public async Task GetClienteById_ReturnsSingleObject_NotArray()
    {
        var entity = ClienteEntity.Create("Empresa", "900123456", "3001234567", "Bogotá");
        using var factory = FactoryWithSeed(entity);
        using var client = factory.CreateClient();

        var response = await client.GetAsync($"/api/v1/clientes/{entity.Id}");
        response.EnsureSuccessStatusCode();

        var raw = (await response.Content.ReadAsStringAsync()).TrimStart();
        Assert.StartsWith("{", raw);
        Assert.DoesNotContain("\"data\"", raw); // no envelope
    }

    // ─── helpers ─────────────────────────────────────────────────────────

    private sealed record ClienteResponse(
        Guid Id, string Nombre, string Nit, string Telefono, string Ciudad,
        DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly List<ClienteEntity> _items = new();

        public void Seed(IEnumerable<ClienteEntity> items) => _items.AddRange(items);

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IReadOnlyList<ClienteEntity>>(_items);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_items.FirstOrDefault(e => e.Id == id));

        // Story 2.3 additions — this fake is only used by read tests.
        public Task AddAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
        public Task<bool> NitExistsAsync(string nit, CancellationToken ct) => Task.FromResult(false);
        // Story 2.4 additions — this fake is only used by read tests.
        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
        public Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct) => Task.FromResult(false);
    }
}
