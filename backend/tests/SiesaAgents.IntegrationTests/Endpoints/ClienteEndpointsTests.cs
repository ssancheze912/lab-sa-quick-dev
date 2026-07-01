using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SiesaAgents.Application.DTOs;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.IntegrationTests.Support;

namespace SiesaAgents.IntegrationTests.Endpoints;

/// <summary>
/// Story 2.1 (AC #1, #2): `GET /api/v1/clientes` end-to-end via the real ASP.NET
/// pipeline (TestApiFactory -> Program.cs), independent of the frontend's
/// client-side filtering (TC-E2-P2-08 backend-path coverage).
/// </summary>
public class ClienteEndpointsTests : IClassFixture<TestApiFactory>, IAsyncLifetime
{
    private const string ConnectionString =
        "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres";

    private readonly TestApiFactory _factory;
    private readonly List<Guid> _createdIds = [];

    public ClienteEndpointsTests(TestApiFactory factory)
    {
        _factory = factory;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        if (_createdIds.Count == 0)
        {
            return;
        }

        await using var context = CreateContext();
        var toRemove = await context.Clientes.Where(c => _createdIds.Contains(c.Id)).ToListAsync();
        context.Clientes.RemoveRange(toRemove);
        await context.SaveChangesAsync();
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString, npgsql => { })
            .ReplaceService<IHistoryRepository, SnakeCaseNpgsqlHistoryRepository>()
            .Options;
        return new AppDbContext(options);
    }

    private async Task<ClienteEntity> SeedAsync(string nombre, string nit)
    {
        await using var context = CreateContext();
        var cliente = ClienteEntity.Create(nombre, nit, "3000000000", "Bogotá");
        context.Clientes.Add(cliente);
        await context.SaveChangesAsync();
        _createdIds.Add(cliente.Id);
        return cliente;
    }

    [Fact]
    public async Task GetClientes_ReturnsOk()
    {
        // GIVEN a client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        await SeedAsync($"Endpoint Cliente {suffix}", $"700{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");

        // THEN the response is 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetClientes_ReturnsAllSeededClientes()
    {
        // GIVEN a seeded client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Todos Cliente {suffix}", $"701{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/clientes without a search term
        var result = await client.GetFromJsonAsync<List<ClienteDto>>("/api/v1/clientes");

        // THEN the seeded client is present in the response
        Assert.NotNull(result);
        Assert.Contains(result!, c => c.Id == seeded.Id);
    }

    [Fact]
    public async Task GetClientes_WithSearchTerm_ReturnsOnlyMatchingClientes()
    {
        // GIVEN two clients with distinct names
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var target = await SeedAsync($"Filtrado Especial {suffix}", $"702{suffix}");
        await SeedAsync($"Otro Diferente {suffix}", $"703{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/clientes?q=<term matching only target>
        var result = await client.GetFromJsonAsync<List<ClienteDto>>($"/api/v1/clientes?q=Filtrado Especial {suffix}");

        // THEN only the matching client is returned
        Assert.NotNull(result);
        Assert.Contains(result!, c => c.Id == target.Id);
        Assert.DoesNotContain(result!, c => c.Nombre.StartsWith("Otro Diferente"));
    }
}
