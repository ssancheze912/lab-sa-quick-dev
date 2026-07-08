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
/// Story 2.1 — Automate (Edge Cases).
///
/// Expands endpoint coverage with negative-path and boundary behaviours the
/// RED-phase tests skipped:
///   * Unsupported HTTP methods on `/api/v1/clientes` return 404 or 405
///     (Story 2.1 only defines GET — POST/PUT/DELETE are Stories 2.3–2.5).
///   * GET /api/v1/clientes/{unknown-guid} returns 404 (documented in Task 4
///     "existing status-code-pages handler covers it").
///   * Concurrent GETs never leak state between requests.
///   * Large-payload response (500 clientes) serialises without failure.
///   * Content-Type charset is UTF-8.
///
/// [P1] tag — API surface contract validation.
/// </summary>
public sealed class ClienteEndpointsEdgeTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ClienteEndpointsEdgeTests(WebApplicationFactory<Program> factory)
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

    // Story 2.3 replaced the "POST not implemented" assertion with a positive-shape check:
    // POST with an invalid payload MUST return the RFC 7807 400 ValidationProblem shape (not a 404/405).
    [Fact]
    public async Task Post_ToClientesRoute_ReturnsValidationProblem_WhenBodyIsInvalid()
    {
        using var factory = FactoryWithSeed();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/v1/clientes", new { nombre = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.StartsWith("application/problem+json", contentType);
    }

    // [P1] PUT /api/v1/clientes — not implemented → 404 or 405.
    [Fact]
    public async Task Put_ToClientesRoute_ReturnsNotFoundOr405()
    {
        using var factory = FactoryWithSeed();
        using var client = factory.CreateClient();

        var response = await client.PutAsJsonAsync("/api/v1/clientes", new { });

        Assert.True(
            response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.MethodNotAllowed,
            $"Expected 404 or 405 for unsupported PUT, got {(int)response.StatusCode}");
    }

    // [P1] DELETE /api/v1/clientes — not implemented → 404 or 405.
    [Fact]
    public async Task Delete_OnClientesRoute_ReturnsNotFoundOr405()
    {
        using var factory = FactoryWithSeed();
        using var client = factory.CreateClient();

        var response = await client.DeleteAsync("/api/v1/clientes");

        Assert.True(
            response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.MethodNotAllowed,
            $"Expected 404 or 405 for unsupported DELETE, got {(int)response.StatusCode}");
    }

    // [P1] GET /api/v1/clientes/{unknown-guid} — Story 2.2 will handle this; Story 2.1 leaves it as 404.
    [Fact]
    public async Task Get_ByUnknownId_ReturnsNotFound_ForStory21Scope()
    {
        using var factory = FactoryWithSeed();
        using var client = factory.CreateClient();

        var unknownId = Guid.NewGuid();
        var response = await client.GetAsync($"/api/v1/clientes/{unknownId}");

        // Story 2.1 has NO GetById endpoint — the request should not match; 404 is expected.
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // [P1] GET /api/v1/clientes with 500 seeded items — verifies the endpoint can serialise a large payload.
    [Fact]
    public async Task GetClientes_HandlesLargePayload_500Items()
    {
        var seed = new List<ClienteEntity>(capacity: 500);
        for (var i = 0; i < 500; i++)
        {
            seed.Add(ClienteEntity.Create(
                $"Empresa {i:000}",
                $"900{i:000000}",
                $"300{i:0000000}",
                "Bogotá"));
        }

        using var factory = FactoryWithSeed(seed.ToArray());
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/clientes");
        response.EnsureSuccessStatusCode();

        var items = await response.Content.ReadFromJsonAsync<List<ClienteResponse>>();
        Assert.NotNull(items);
        Assert.Equal(500, items!.Count);
    }

    // [P2] Content-Type should include a UTF-8 charset (implicit) OR at least application/json.
    [Fact]
    public async Task GetClientes_UsesJson_ContentType()
    {
        var entity = ClienteEntity.Create("Empresa", "900123456", "3001234567", "Bogotá");
        using var factory = FactoryWithSeed(entity);
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/clientes");
        response.EnsureSuccessStatusCode();

        var contentType = response.Content.Headers.ContentType;
        Assert.NotNull(contentType);
        Assert.Equal("application/json", contentType!.MediaType);
    }

    // [P2] Two concurrent GETs each read the same fake repository seed without interference.
    [Fact]
    public async Task GetClientes_HandlesConcurrentRequests_WithoutStateLeak()
    {
        var seed = new[]
        {
            ClienteEntity.Create("Uno", "111", "111", "Bogotá"),
            ClienteEntity.Create("Dos", "222", "222", "Medellín"),
        };
        using var factory = FactoryWithSeed(seed);
        using var client = factory.CreateClient();

        var task1 = client.GetAsync("/api/v1/clientes");
        var task2 = client.GetAsync("/api/v1/clientes");
        var task3 = client.GetAsync("/api/v1/clientes");

        var responses = await Task.WhenAll(task1, task2, task3);

        foreach (var r in responses)
        {
            r.EnsureSuccessStatusCode();
            var items = await r.Content.ReadFromJsonAsync<List<ClienteResponse>>();
            Assert.NotNull(items);
            Assert.Equal(2, items!.Count);
        }
    }

    // [P2] Empty response with no trailing whitespace — proves clean JSON serialisation.
    [Fact]
    public async Task GetClientes_EmptyResponse_HasNoWhitespaceArtifacts()
    {
        using var factory = FactoryWithSeed();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/clientes");
        response.EnsureSuccessStatusCode();

        var raw = await response.Content.ReadAsStringAsync();
        Assert.Equal("[]", raw);
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
