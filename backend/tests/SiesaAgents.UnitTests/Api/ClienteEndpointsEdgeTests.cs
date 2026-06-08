// Story 2.1: Client List & Search — Automate Phase
// Epic 2: Client Management
//
// AUTOMATE expansion tests (edge cases — NOT regenerated from ATDD)
// Complements ClienteEndpointsTests.cs with HTTP-method edges, casing leaks,
// large-payload behavior, and route-shape validation.
//
// Acceptance Criteria touched:
//   AC #2  — GET returns the full list as JSON array; camelCase only.
//   AC #3  — Other HTTP methods on the same route do not leak server internals.
//   AC #12 — Backend API integration coverage expansion.

using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Api;

public class ClienteEndpointsEdgeTests : IClassFixture<ClienteEndpointsEdgeTests.InMemoryFactory>
{
    private readonly InMemoryFactory _factory;

    public ClienteEndpointsEdgeTests(InMemoryFactory factory)
    {
        _factory = factory;
    }

    public sealed class InMemoryFactory : WebApplicationFactory<Program>
    {
        public string DbName { get; } = $"clientes-edge-endpoint-{Guid.NewGuid():N}";

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
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

    private async Task ClearAndSeedAsync(params ClienteEntity[] entities)
    {
        using var scope = _factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        ctx.Clientes.RemoveRange(ctx.Clientes);
        foreach (var entity in entities)
        {
            ctx.Clientes.Add(entity);
        }
        await ctx.SaveChangesAsync();
    }

    [Fact]
    public async Task P2_GetClientes_ResponseBody_DoesNotLeakPascalCaseKeys()
    {
        // GIVEN: A seeded client
        await ClearAndSeedAsync(ClienteEntity.Create("Empresa Leak", "111-LEAK-1", "3001112222", "Bogotá"));
        var client = _factory.CreateClient();

        // WHEN: The frontend issues GET /api/v1/clientes
        var response = await client.GetAsync("/api/v1/clientes");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: No PascalCase keys appear in the wire format — System.Text.Json camelCase contract
        foreach (var leak in new[] { "\"Id\":", "\"Nombre\":", "\"Nit\":", "\"Telefono\":", "\"Ciudad\":", "\"CreatedAt\":", "\"UpdatedAt\":" })
        {
            Assert.DoesNotContain(leak, body);
        }
    }

    [Fact]
    public async Task P1_GetClientes_With250Items_ReturnsAllInSingleResponse()
    {
        // GIVEN: A large seeded list (NFR10 — single GET returns everything)
        var now = DateTimeOffset.UtcNow;
        var seed = Enumerable.Range(0, 250)
            .Select(i =>
            {
                var entity = ClienteEntity.Create($"Cliente {i:000}", $"NIT-{i:00000}-1", "3001234567", "Medellín");
                // Force unique CreatedAt to mirror Story 2.6 sort
                typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.CreatedAt))!
                    .SetValue(entity, now.AddSeconds(-i));
                return entity;
            })
            .ToArray();
        await ClearAndSeedAsync(seed);

        var client = _factory.CreateClient();

        // WHEN: GET is invoked
        var response = await client.GetAsync("/api/v1/clientes");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: The full 250 items are returned in one response
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(250, doc.RootElement.GetArrayLength());
    }

    [Theory]
    [InlineData("POST")]
    [InlineData("PUT")]
    [InlineData("DELETE")]
    [InlineData("PATCH")]
    public async Task P2_NonGetMethodsOnEndpoint_DoNotReturn500_AndDoNotLeakStackTrace(string method)
    {
        // GIVEN: A clean DB
        await ClearAndSeedAsync();
        var client = _factory.CreateClient();

        // WHEN: An unsupported method hits the endpoint
        var request = new HttpRequestMessage(new HttpMethod(method), "/api/v1/clientes");
        var response = await client.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        // THEN: The response is NOT a 500 (mapping owns method-rejection) and
        // does NOT leak server internals (regression vs Story 1.3 middleware AC #3)
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.DoesNotContain("StackTrace", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Exception", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task P2_GetClientes_IgnoresUnknownQueryStringParameters()
    {
        // GIVEN: A seeded client and a request with foreign query parameters
        await ClearAndSeedAsync(ClienteEntity.Create("Empresa QS", "QS-001-1", "3001112222", "Cali"));
        var client = _factory.CreateClient();

        // WHEN: GET is invoked with extraneous params (pagination not supported in Story 2.1)
        var response = await client.GetAsync("/api/v1/clientes?page=2&pageSize=50&foo=bar");

        // THEN: Still 200 OK with the array — query params are ignored (FR contract — pagination ships in Story 2.6+)
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(1, doc.RootElement.GetArrayLength());
    }

    [Fact]
    public async Task P2_GetClientes_TwoConsecutiveCalls_ReturnIdenticalPayload()
    {
        // GIVEN: A seeded client
        await ClearAndSeedAsync(ClienteEntity.Create("Empresa Idempotent", "IDP-1", "3001112222", "Bogotá"));
        var client = _factory.CreateClient();

        // WHEN: Two GETs are issued back-to-back
        var a = await (await client.GetAsync("/api/v1/clientes")).Content.ReadAsStringAsync();
        var b = await (await client.GetAsync("/api/v1/clientes")).Content.ReadAsStringAsync();

        // THEN: The payloads are byte-identical — read endpoint is idempotent/cacheable
        Assert.Equal(a, b);
    }

    [Fact]
    public async Task P2_GetClientes_OrdersByCreatedAtDescending_NewestFirst()
    {
        // GIVEN: Three clients with distinct CreatedAt
        await ClearAndSeedAsync();
        var now = DateTimeOffset.UtcNow;
        var older = ClienteEntity.Create("Older", "old-1", "3000000001", "Cali");
        var middle = ClienteEntity.Create("Middle", "mid-1", "3000000002", "Cali");
        var newest = ClienteEntity.Create("Newest", "new-1", "3000000003", "Cali");
        typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.CreatedAt))!.SetValue(older, now.AddDays(-10));
        typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.CreatedAt))!.SetValue(middle, now.AddDays(-5));
        typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.CreatedAt))!.SetValue(newest, now);
        await ClearAndSeedAsync(older, middle, newest);

        var client = _factory.CreateClient();

        // WHEN: GET is invoked
        var response = await client.GetAsync("/api/v1/clientes");
        var body = await response.Content.ReadAsStringAsync();

        // THEN: Items come back in descending CreatedAt order (Story 2.6 default-sort alignment)
        using var doc = JsonDocument.Parse(body);
        Assert.Equal("Newest", doc.RootElement[0].GetProperty("nombre").GetString());
        Assert.Equal("Middle", doc.RootElement[1].GetProperty("nombre").GetString());
        Assert.Equal("Older", doc.RootElement[2].GetProperty("nombre").GetString());
    }
}
