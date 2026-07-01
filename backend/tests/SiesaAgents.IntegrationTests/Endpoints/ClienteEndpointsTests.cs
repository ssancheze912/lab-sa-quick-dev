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

    // --- Edge cases (testarch-automate expansion) -----------------------------

    [Fact]
    public async Task GetClientes_WithEmptyQueryParam_ReturnsAllClientesLikeNoParam()
    {
        // GIVEN a seeded client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Empty Query Cliente {suffix}", $"704{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/clientes?q= (empty string, not omitted)
        var result = await client.GetFromJsonAsync<List<ClienteDto>>("/api/v1/clientes?q=");

        // THEN the empty query param behaves like no filter — client is returned
        Assert.NotNull(result);
        Assert.Contains(result!, c => c.Id == seeded.Id);
    }

    [Fact]
    public async Task GetClientes_WithUrlEncodedSpecialCharacters_ReturnsExpectedMatch()
    {
        // GIVEN a client whose name contains an ampersand (must survive URL encoding round-trip)
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var target = await SeedAsync($"Cliente & Asociados {suffix}", $"705{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling with a URL-encoded search term
        var encoded = Uri.EscapeDataString($"& Asociados {suffix}");
        var result = await client.GetFromJsonAsync<List<ClienteDto>>($"/api/v1/clientes?q={encoded}");

        // THEN the client matches despite the special character
        Assert.NotNull(result);
        Assert.Contains(result!, c => c.Id == target.Id);
    }

    [Fact]
    public async Task GetClientes_WithNonMatchingSearchTerm_ReturnsEmptyArrayNot404()
    {
        // GIVEN a seeded client that won't match
        var suffix = Guid.NewGuid().ToString("N")[..8];
        await SeedAsync($"Cliente Existente {suffix}", $"706{suffix}");
        var client = _factory.CreateClient();

        // WHEN searching for a term that matches nothing
        var response = await client.GetAsync($"/api/v1/clientes?q=zzz-inexistente-{suffix}");
        var result = await response.Content.ReadFromJsonAsync<List<ClienteDto>>();

        // THEN the endpoint still returns 200 OK with an empty array (not 404/error)
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(result);
        Assert.Empty(result!);
    }

    [Fact]
    public async Task GetClientes_ResponseUsesCamelCaseJsonPropertyNames()
    {
        // GIVEN a seeded client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        await SeedAsync($"CamelCase Cliente {suffix}", $"707{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");
        var rawJson = await response.Content.ReadAsStringAsync();

        // THEN the JSON payload exposes camelCase keys matching the frontend's Cliente interface
        Assert.Contains("\"nombre\"", rawJson);
        Assert.Contains("\"nit\"", rawJson);
        Assert.Contains("\"createdAt\"", rawJson);
    }

    // --- Story 2.2: GET /api/v1/clientes/{id} (AC #1, #2, #3) -------------------
    //
    // RED PHASE: the GET /api/v1/clientes/{id:guid} endpoint does not exist yet
    // (Story 2.2, Task 1). These tests define the expected contract: 200 + the
    // correct ClienteDto for an existing client, and 404 + Problem Details (no
    // stack trace / no technical leakage per NFR6) for a non-existent Id.

    [Fact]
    public async Task GetClienteById_WithExistingId_ReturnsOk()
    {
        // GIVEN a seeded client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Detalle Endpoint Cliente {suffix}", $"708{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/clientes/{id} with an existing Id
        var response = await client.GetAsync($"/api/v1/clientes/{seeded.Id}");

        // THEN the response is 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetClienteById_WithExistingId_ReturnsTheCorrectClienteDto()
    {
        // GIVEN a seeded client
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Correcto Cliente {suffix}", $"709{suffix}");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/clientes/{id}
        var result = await client.GetFromJsonAsync<ClienteDto>($"/api/v1/clientes/{seeded.Id}");

        // THEN the returned DTO matches the seeded client's fields
        Assert.NotNull(result);
        Assert.Equal(seeded.Id, result!.Id);
        Assert.Equal(seeded.Nombre, result.Nombre);
        Assert.Equal(seeded.Nit, result.Nit);
        Assert.Equal(seeded.Telefono, result.Telefono);
        Assert.Equal(seeded.Ciudad, result.Ciudad);
    }

    [Fact]
    public async Task GetClienteById_WithNonExistentId_ReturnsNotFound()
    {
        // GIVEN a well-formed UUID with no matching client
        var client = _factory.CreateClient();
        var nonExistentId = Guid.NewGuid();

        // WHEN calling GET /api/v1/clientes/{id}
        var response = await client.GetAsync($"/api/v1/clientes/{nonExistentId}");

        // THEN the response is 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetClienteById_WithNonExistentId_ReturnsProblemDetailsWithoutStackTrace()
    {
        // GIVEN a well-formed UUID with no matching client
        var client = _factory.CreateClient();
        var nonExistentId = Guid.NewGuid();

        // WHEN calling GET /api/v1/clientes/{id}
        var response = await client.GetAsync($"/api/v1/clientes/{nonExistentId}");
        var rawJson = await response.Content.ReadAsStringAsync();

        // THEN the body is RFC 7807 Problem Details shaped, with no stack trace or
        // technical leakage (NFR6)
        Assert.Contains("\"status\"", rawJson);
        Assert.DoesNotContain("StackTrace", rawJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("System.Exception", rawJson, StringComparison.OrdinalIgnoreCase);
    }
}
