using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Clientes;

/// <summary>
/// Story 2.1 (Epic 2: Client Management), AC #1 — ATDD Acceptance Tests, RED phase.
///
/// RED phase: fails to compile today because <c>SiesaAgents.Domain.Clientes.Entities.ClienteEntity</c>,
/// <c>AppDbContext.Clientes</c>, and the <c>GET /api/v1/clientes</c> endpoint
/// (<c>ClienteEndpoints.MapClienteEndpoints</c>) do not exist yet (Story 2.1 Tasks 1-2).
///
/// Requires a reachable local PostgreSQL instance with the `CreateClientesTable` migration
/// applied (Story 2.1 Task 1's `dotnet ef database update`) — decorated with
/// <see cref="RequiresPostgresFactAttribute"/> per the project's soft-skip convention
/// established in Story 1.3 (xUnit reports "Skipped", never a false "Passed" with no
/// assertions run, when PostgreSQL is unreachable).
///
/// Per Story 2.1 Dev Notes ("Known Cross-Story Test Dependency"), data is seeded directly
/// via <c>AppDbContext</c> rather than through a POST call, since the create endpoint is
/// Story 2.3's scope. Each test performs its own setup/cleanup (auto-cleanup principle,
/// `fixture-architecture.md`) so tests remain isolated and re-runnable against a shared
/// local database, and generates a unique NIT per test run to avoid colliding with the
/// `uk_clientes_nit` unique index if a previous run's cleanup was interrupted.
/// </summary>
public class ClienteEndpointsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ClienteEndpointsTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [RequiresPostgresFact]
    public async Task GetClientes_ReturnsOk_WhenTableIsEmpty()
    {
        // GIVEN the clientes table has no rows
        await ClearClientesTableAsync();

        // WHEN GET /api/v1/clientes is called
        var response = await _client.GetAsync("/api/v1/clientes");

        // THEN the response status is 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [RequiresPostgresFact]
    public async Task GetClientes_ReturnsEmptyArray_WhenTableIsEmpty()
    {
        // GIVEN the clientes table has no rows
        await ClearClientesTableAsync();

        // WHEN GET /api/v1/clientes is called
        var clientes = await GetClientesAsync();

        // THEN the response body is an empty array
        Assert.Empty(clientes);
    }

    [RequiresPostgresFact]
    public async Task GetClientes_ReturnsDirectArray_NotWrappedInDataProperty()
    {
        // GIVEN the clientes table has no rows
        await ClearClientesTableAsync();

        // WHEN GET /api/v1/clientes is called
        var response = await _client.GetAsync("/api/v1/clientes");
        var json = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(json);

        // THEN the JSON root is a direct array, never `{ data: [...] }` (architecture.md's
        // API response-shape convention)
        Assert.Equal(JsonValueKind.Array, document.RootElement.ValueKind);
    }

    [RequiresPostgresFact]
    public async Task GetClientes_ReturnsSeededRecordCount_WhenDataExists()
    {
        // GIVEN two clients seeded directly via AppDbContext
        var clienteA = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        var clienteB = ClienteEntity.Create("Beta SAS", UniqueNit(), "3019876543", "Medellín");
        await SeedClientesAsync(clienteA, clienteB);

        try
        {
            // WHEN GET /api/v1/clientes is called
            var clientes = await GetClientesAsync();

            // THEN both seeded records are returned
            Assert.Equal(2, clientes.Count(c => c.Id == clienteA.Id || c.Id == clienteB.Id));
        }
        finally
        {
            await DeleteClientesAsync(clienteA.Id, clienteB.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task GetClientes_ReturnsSeededNombre_WhenDataExists()
    {
        // GIVEN a client named "Acme Corp" seeded directly via AppDbContext
        var cliente = ClienteEntity.Create("Acme Corp", UniqueNit(), "3001234567", "Bogotá");
        await SeedClientesAsync(cliente);

        try
        {
            // WHEN GET /api/v1/clientes is called
            var clientes = await GetClientesAsync();

            // THEN the response includes a record with the seeded Nombre
            Assert.Contains(clientes, c => c.Nombre == "Acme Corp");
        }
        finally
        {
            await DeleteClientesAsync(cliente.Id);
        }
    }

    [RequiresPostgresFact]
    public async Task GetClientes_ReturnsSeededNit_WhenDataExists()
    {
        // GIVEN a client with a known NIT seeded directly via AppDbContext
        var nit = UniqueNit();
        var cliente = ClienteEntity.Create("Acme Corp", nit, "3001234567", "Bogotá");
        await SeedClientesAsync(cliente);

        try
        {
            // WHEN GET /api/v1/clientes is called
            var clientes = await GetClientesAsync();

            // THEN the response includes a record with the seeded Nit
            Assert.Contains(clientes, c => c.Nit == nit);
        }
        finally
        {
            await DeleteClientesAsync(cliente.Id);
        }
    }

    private static string UniqueNit() =>
        $"9{DateTimeOffset.UtcNow.Ticks % 100_000_000:D8}";

    private async Task SeedClientesAsync(params ClienteEntity[] clientes)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        dbContext.Clientes.AddRange(clientes);
        await dbContext.SaveChangesAsync();
    }

    private async Task DeleteClientesAsync(params Guid[] ids)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var toRemove = await dbContext.Clientes.Where(c => ids.Contains(c.Id)).ToListAsync();
        dbContext.Clientes.RemoveRange(toRemove);
        await dbContext.SaveChangesAsync();
    }

    private async Task ClearClientesTableAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM clientes");
    }

    private async Task<List<ClienteApiResponse>> GetClientesAsync()
    {
        var response = await _client.GetAsync("/api/v1/clientes");
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<List<ClienteApiResponse>>(
                   json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
               ?? [];
    }

    private sealed record ClienteApiResponse(
        Guid Id,
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad,
        DateTimeOffset CreatedAt);
}
