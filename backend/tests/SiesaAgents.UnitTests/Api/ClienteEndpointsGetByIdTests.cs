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
/// Story 2.2 — ATDD (RED phase).
///
/// Endpoint tests for <c>GET /api/v1/clientes/{id:guid}</c> (Task 2):
///   * Returns 200 with a single <c>ClienteDto</c> when the id matches (AC #8).
///   * Returns 404 with a Problem Details RFC 7807 body when the id does not
///     match (AC #9) — the body MUST NOT leak internals (NFR6 / R-001).
///   * Returns 404 (via the ":guid" route constraint) when the path segment
///     is not a well-formed UUID (AC #10).
///
/// Story 2.2 keeps Story 2.1's endpoint tests untouched — this file only
/// exercises the new by-id endpoint. Shares the same <see cref="WebApplicationFactory{TEntryPoint}"/>
/// / Testing environment / fake-repository override pattern established by
/// Story 2.1's <c>ClienteEndpointsTests</c>.
/// </summary>
public sealed class ClienteEndpointsGetByIdTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ClienteEndpointsGetByIdTests(WebApplicationFactory<Program> factory)
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

    // AC #8 — Existing id returns 200 with the DTO payload (camelCase).
    [Fact]
    public async Task GetClienteById_Returns200_WithDto_WhenIdExists()
    {
        var entity = ClienteEntity.Create("Empresa Detalle", "900555111", "3005551110", "Medellín");
        using var factory = FactoryWithSeed(entity);
        using var client = factory.CreateClient();

        var response = await client.GetAsync($"/api/v1/clientes/{entity.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var raw = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"nombre\"", raw);
        Assert.Contains("\"nit\"", raw);
        Assert.Contains("\"telefono\"", raw);
        Assert.Contains("\"ciudad\"", raw);
        Assert.Contains("\"createdAt\"", raw);
        Assert.Contains("\"updatedAt\"", raw);

        var dto = await response.Content.ReadFromJsonAsync<ClienteResponse>();
        Assert.NotNull(dto);
        Assert.Equal(entity.Id, dto!.Id);
        Assert.Equal("Empresa Detalle", dto.Nombre);
        Assert.Equal("900555111", dto.Nit);
        Assert.Equal("3005551110", dto.Telefono);
        Assert.Equal("Medellín", dto.Ciudad);
    }

    // AC #9 — Unknown UUID returns 404 with Problem Details RFC 7807.
    // NFR6 / R-001 — the body MUST NOT contain server internals.
    [Fact]
    public async Task GetClienteById_Returns404_WithProblemDetails_WhenIdNotFound()
    {
        using var factory = FactoryWithSeed(); // empty repository
        using var client = factory.CreateClient();

        var response = await client.GetAsync($"/api/v1/clientes/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.StartsWith("application/problem+json", contentType);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"title\"", body);
        Assert.Contains("\"status\"", body);
        Assert.Contains("404", body);
        // NFR6 anti-leak — no server internals in the response.
        Assert.DoesNotContain("stackTrace", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("exception", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("secret", body, StringComparison.OrdinalIgnoreCase);
    }

    // AC #10 — Non-UUID path segment is rejected by the :guid route constraint.
    [Fact]
    public async Task GetClienteById_Returns404_WhenIdIsNotGuid()
    {
        using var factory = FactoryWithSeed();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/clientes/not-a-guid");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.StartsWith("application/problem+json", contentType);
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
