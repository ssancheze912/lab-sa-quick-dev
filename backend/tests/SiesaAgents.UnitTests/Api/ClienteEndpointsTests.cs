using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Api;

/// <summary>
/// Story 2.1 — ATDD (RED phase).
///
/// Endpoint tests for <c>GET /api/v1/clientes</c> (Task 4):
///   * Returns 200 with an empty JSON array when the repository is empty (AC #4, #8).
///   * Returns items in the order provided by the repository (AC #1, #8).
///   * Emits camelCase JSON property names (AC #8).
///
/// The <c>Testing</c> environment overrides <see cref="IClienteRepository"/>
/// with an in-process <see cref="FakeClienteRepository"/> so the assertions
/// never depend on a live PostgreSQL instance (matches the Story 1.3 pattern
/// documented in the story's Testing Standards).
/// </summary>
public sealed class ClienteEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ClienteEndpointsTests(WebApplicationFactory<Program> factory)
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

    // AC #4, #8 — Empty repository returns 200 with `[]`.
    [Fact]
    public async Task GetClientes_ReturnsOk_WithEmptyArray_ForFreshDb()
    {
        using var factory = FactoryWithSeed();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/clientes");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Equal("[]", body.Trim());
    }

    // AC #1, #8 — Endpoint returns the items in the repository's order (CreatedAt DESC).
    [Fact]
    public async Task GetClientes_ReturnsAllSeededItems_InRepositoryOrder()
    {
        var newest = CreateEntityWithCreatedAt("Newest", "300", new DateTimeOffset(2026, 3, 1, 0, 0, 0, TimeSpan.Zero));
        var middle = CreateEntityWithCreatedAt("Middle", "200", new DateTimeOffset(2026, 2, 1, 0, 0, 0, TimeSpan.Zero));
        var oldest = CreateEntityWithCreatedAt("Oldest", "100", new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));

        // Fake repository returns items in insertion order — real repo already sorts DESC.
        using var factory = FactoryWithSeed(newest, middle, oldest);
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/clientes");

        response.EnsureSuccessStatusCode();
        var items = await response.Content.ReadFromJsonAsync<List<ClienteResponse>>();

        Assert.NotNull(items);
        Assert.Equal(3, items!.Count);
        Assert.Equal("Newest", items[0].Nombre);
        Assert.Equal("Middle", items[1].Nombre);
        Assert.Equal("Oldest", items[2].Nombre);
    }

    // AC #8 — JSON payload uses camelCase property names.
    [Fact]
    public async Task GetClientes_ReturnsJson_WithCamelCaseKeys()
    {
        var entity = ClienteEntity.Create("Empresa X", "900123456", "3001234567", "Bogotá");
        using var factory = FactoryWithSeed(entity);
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/clientes");
        response.EnsureSuccessStatusCode();

        var raw = await response.Content.ReadAsStringAsync();

        Assert.Contains("\"nombre\"", raw);
        Assert.Contains("\"nit\"", raw);
        Assert.Contains("\"createdAt\"", raw);
        Assert.DoesNotContain("\"Nombre\"", raw);
        Assert.DoesNotContain("\"CreatedAt\"", raw);
    }

    // ─── helpers ─────────────────────────────────────────────────────────

    private static ClienteEntity CreateEntityWithCreatedAt(string nombre, string nit, DateTimeOffset createdAt)
    {
        var entity = ClienteEntity.Create(nombre, nit, "3000000000", "Bogotá");
        typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.CreatedAt))!.SetValue(entity, createdAt);
        typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.UpdatedAt))!.SetValue(entity, createdAt);
        return entity;
    }

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
    }
}
