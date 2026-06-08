// Story 2.1: Client List & Search
// Epic 2: Client Management
//
// ATDD Acceptance Tests — RED Phase (API Integration — WebApplicationFactory + InMemory)
// These tests are intentionally FAILING until:
//   1. ClienteEntity / ClienteConfiguration / ClienteDto / GetClientesQueryHandler exist,
//   2. ClienteEndpoints.MapClienteEndpoints() is wired in Program.cs,
//   3. AppDbContext exposes DbSet<ClienteEntity> Clientes.
//
// Acceptance Criteria covered:
//   AC #2  — GET /api/v1/clientes returns 200 OK + Content-Type application/json + JSON array of camelCase objects.
//   AC #12 — Backend coverage: TC-E2-P2-01 (seeded list), TC-E2-P2-08 (createdAt/updatedAt with UTC offset).
//
// Test Design references:
//   TC-E2-P2-01 — GET returns seeded list.
//   TC-E2-P2-08 — createdAt / updatedAt carry UTC offset (DateTimeOffset).
//
// Strategy: WebApplicationFactory<Program> swaps the Npgsql AppDbContext for an InMemory variant
// so the test does not depend on PostgreSQL (sandbox infra: PostgreSQL unavailable by default).
// Real-DB schema asserts (snake_case columns + uk_clientes_nit) live in
// Infrastructure/ClienteSchemaIntegrationTests.cs (gated by RUN_DB_INTEGRATION_TESTS=1).

using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Api;

public class ClienteEndpointsTests : IClassFixture<ClienteEndpointsTests.InMemoryFactory>
{
    private readonly InMemoryFactory _factory;

    public ClienteEndpointsTests(InMemoryFactory factory)
    {
        _factory = factory;
    }

    public sealed class InMemoryFactory : WebApplicationFactory<Program>
    {
        public string DbName { get; } = $"clientes-endpoint-tests-{Guid.NewGuid():N}";

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                // Remove the real Npgsql registration shipped by Program.cs.
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor is not null)
                {
                    services.Remove(descriptor);
                }

                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase(DbName));
            });
        }
    }

    private async Task SeedAsync(ClienteEntity entity)
    {
        using var scope = _factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        ctx.Clientes.Add(entity);
        await ctx.SaveChangesAsync();
    }

    private async Task ClearAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        ctx.Clientes.RemoveRange(ctx.Clientes);
        await ctx.SaveChangesAsync();
    }

    [Fact]
    public async Task TC_E2_P2_01_GetClientes_WithSeededData_Returns200WithArrayContainingItem()
    {
        // GIVEN: A single seeded client and the API process running
        await ClearAsync();
        var entity = ClienteEntity.Create("Empresa Seed", "900555666-7", "3001234567", "Cali");
        await SeedAsync(entity);

        var client = _factory.CreateClient();

        // WHEN: The frontend issues GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");

        // THEN: 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetClientes_ResponseContentType_IsApplicationJson()
    {
        // GIVEN: An empty client list
        await ClearAsync();
        var client = _factory.CreateClient();

        // WHEN: The frontend issues GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");

        // THEN: Content-Type is application/json (NOT wrapped in problem+json)
        Assert.NotNull(response.Content.Headers.ContentType);
        Assert.Equal("application/json", response.Content.Headers.ContentType!.MediaType);
    }

    [Fact]
    public async Task GetClientes_WithEmptyDb_ReturnsEmptyJsonArray()
    {
        // GIVEN: No persisted clients
        await ClearAsync();
        var client = _factory.CreateClient();

        // WHEN: The frontend issues GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: Body is the literal direct JSON array "[]" — no wrapper object
        var trimmed = body.Trim();
        Assert.StartsWith("[", trimmed);
        Assert.EndsWith("]", trimmed);

        using var doc = JsonDocument.Parse(trimmed);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(0, doc.RootElement.GetArrayLength());
    }

    [Fact]
    public async Task GetClientes_ResponseBody_IsDirectJsonArray_NotWrapperObject()
    {
        // GIVEN: A seeded client
        await ClearAsync();
        await SeedAsync(ClienteEntity.Create("Empresa A", "111000111-1", "3001112222", "Medellín"));

        var client = _factory.CreateClient();

        // WHEN: The frontend issues GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: The root JSON token is an array (NOT a wrapper object like { "items": [...] })
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(1, doc.RootElement.GetArrayLength());
    }

    [Fact]
    public async Task GetClientes_EachItemHasSevenCamelCaseFields()
    {
        // GIVEN: A seeded client
        await ClearAsync();
        await SeedAsync(ClienteEntity.Create("Empresa B", "222000222-2", "3002223333", "Barranquilla"));

        var client = _factory.CreateClient();

        // WHEN: The frontend issues GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: The first item carries exactly the seven camelCase keys defined by ClienteDto
        using var doc = JsonDocument.Parse(body);
        var first = doc.RootElement[0];

        Assert.True(first.TryGetProperty("id", out _));
        Assert.True(first.TryGetProperty("nombre", out _));
        Assert.True(first.TryGetProperty("nit", out _));
        Assert.True(first.TryGetProperty("telefono", out _));
        Assert.True(first.TryGetProperty("ciudad", out _));
        Assert.True(first.TryGetProperty("createdAt", out _));
        Assert.True(first.TryGetProperty("updatedAt", out _));
    }

    [Fact]
    public async Task TC_E2_P2_08_GetClientes_CreatedAt_SerializesAsIso8601WithOffset()
    {
        // GIVEN: A seeded client
        await ClearAsync();
        await SeedAsync(ClienteEntity.Create("Empresa C", "333000333-3", "3003334444", "Cartagena"));

        var client = _factory.CreateClient();

        // WHEN: The frontend issues GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: createdAt is ISO 8601 with offset (DateTimeOffset → trailing "+00:00" or "Z")
        using var doc = JsonDocument.Parse(body);
        var createdAt = doc.RootElement[0].GetProperty("createdAt").GetString();
        Assert.False(string.IsNullOrEmpty(createdAt));
        var hasOffset = createdAt!.EndsWith("Z", StringComparison.Ordinal)
            || createdAt.Contains("+", StringComparison.Ordinal)
            || (createdAt.LastIndexOf('-') > 10);
        Assert.True(hasOffset, $"createdAt '{createdAt}' must carry a UTC offset (Z or +/-HH:MM).");
    }

    [Fact]
    public async Task TC_E2_P2_08_GetClientes_UpdatedAt_SerializesAsIso8601WithOffset()
    {
        // GIVEN: A seeded client
        await ClearAsync();
        await SeedAsync(ClienteEntity.Create("Empresa D", "444000444-4", "3004445555", "Pereira"));

        var client = _factory.CreateClient();

        // WHEN: The frontend issues GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: updatedAt is ISO 8601 with offset
        using var doc = JsonDocument.Parse(body);
        var updatedAt = doc.RootElement[0].GetProperty("updatedAt").GetString();
        Assert.False(string.IsNullOrEmpty(updatedAt));
        var hasOffset = updatedAt!.EndsWith("Z", StringComparison.Ordinal)
            || updatedAt.Contains("+", StringComparison.Ordinal)
            || (updatedAt.LastIndexOf('-') > 10);
        Assert.True(hasOffset, $"updatedAt '{updatedAt}' must carry a UTC offset (Z or +/-HH:MM).");
    }
}
