using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.IntegrationTests.Fixtures;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Story 2.2 — integration tests for <c>GET /api/v1/clientes/{id}</c>.
///
/// Covers Acceptance Criterion #9 (three named tests):
///   * <c>GetClienteById_WhenExists_Returns200WithClienteDto</c>
///   * <c>GetClienteById_WhenNotFound_Returns404ProblemDetails</c>
///   * <c>GetClienteById_WhenInvalidGuid_Returns400</c>
///
/// Uses the same InMemory-provider stripping pattern from
/// <see cref="ClientesEndpointsTests"/> so tests stay deterministic and don't
/// require a live PostgreSQL instance.
/// </summary>
public class ClientesDetailEndpointTests : IClassFixture<SiesaAgentsApiFactory>
{
    private readonly SiesaAgentsApiFactory _factory;

    public ClientesDetailEndpointTests(SiesaAgentsApiFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// AC #9 — happy path. GIVEN a seeded cliente, WHEN GET /api/v1/clientes/{id},
    /// THEN status 200 + camelCase body with the seven public fields.
    /// </summary>
    [Fact]
    public async Task GetClienteById_WhenExists_Returns200WithClienteDto()
    {
        // GIVEN
        using var client = CreateClientWithCleanInMemoryDb(out var factory);
        var seededId = SeedClienteAsync(factory, "Cliente Detalle", "900555666-1", "3001112233", "Bogotá");

        // WHEN
        using var response = await client.GetAsync($"/api/v1/clientes/{seededId}");

        // THEN
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);

        var raw = await response.Content.ReadAsStringAsync();

        // camelCase keys per the API contract.
        Assert.Contains("\"id\"", raw);
        Assert.Contains("\"nombre\"", raw);
        Assert.Contains("\"nit\"", raw);
        Assert.Contains("\"telefono\"", raw);
        Assert.Contains("\"ciudad\"", raw);
        Assert.Contains("\"createdAt\"", raw);
        Assert.Contains("\"updatedAt\"", raw);

        // Negative — NEVER snake_case nor PascalCase keys at the API surface.
        Assert.DoesNotContain("\"created_at\"", raw);
        Assert.DoesNotContain("\"CreatedAt\"", raw);
        Assert.DoesNotContain("\"Nombre\"", raw);

        // Object (not array) shape.
        using var doc = JsonDocument.Parse(raw);
        Assert.Equal(JsonValueKind.Object, doc.RootElement.ValueKind);
        Assert.Equal(seededId.ToString(), doc.RootElement.GetProperty("id").GetString());
        Assert.Equal("Cliente Detalle", doc.RootElement.GetProperty("nombre").GetString());
        Assert.Equal("900555666-1", doc.RootElement.GetProperty("nit").GetString());
        Assert.Equal("3001112233", doc.RootElement.GetProperty("telefono").GetString());
        Assert.Equal("Bogotá", doc.RootElement.GetProperty("ciudad").GetString());
    }

    /// <summary>
    /// AC #9 — not-found path. GIVEN an empty DB, WHEN GET /api/v1/clientes/{random-uuid},
    /// THEN status 404 + application/problem+json body with status/title/type. No
    /// stackTrace / exception leakage (NFR6).
    /// </summary>
    [Fact]
    public async Task GetClienteById_WhenNotFound_Returns404ProblemDetails()
    {
        // GIVEN: an empty DB.
        using var client = CreateClientWithCleanInMemoryDb(out _);

        // WHEN
        var randomId = Guid.NewGuid();
        using var response = await client.GetAsync($"/api/v1/clientes/{randomId}");

        // THEN
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);

        Assert.Equal(404, doc.RootElement.GetProperty("status").GetInt32());
        Assert.Contains("Cliente", doc.RootElement.GetProperty("title").GetString());

        // NFR6 — no internal leakage in the body.
        Assert.False(doc.RootElement.TryGetProperty("stackTrace", out _));
        Assert.False(doc.RootElement.TryGetProperty("exception", out _));
        Assert.False(doc.RootElement.TryGetProperty("stack", out _));
    }

    /// <summary>
    /// AC #9 — invalid-UUID path. GIVEN a non-GUID route segment, WHEN
    /// GET /api/v1/clientes/not-a-guid, THEN status 400 (minimal-API route
    /// constraint short-circuits BEFORE the handler runs).
    /// </summary>
    [Fact]
    public async Task GetClienteById_WhenInvalidGuid_Returns400()
    {
        // GIVEN
        using var client = CreateClientWithCleanInMemoryDb(out _);

        // WHEN
        using var response = await client.GetAsync("/api/v1/clientes/not-a-guid");

        // THEN
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers — mirror the InMemoryFactory pattern from ClientesEndpointsTests.
    // ─────────────────────────────────────────────────────────────────────────

    private HttpClient CreateClientWithCleanInMemoryDb(out InMemoryFactory factory)
    {
        factory = new InMemoryFactory(Guid.NewGuid().ToString());
        var client = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();

        return client;
    }

    /// <summary>
    /// Seed a single cliente through the same reflection-based factory invocation
    /// used by Story 2.1's <c>SeedTwoClientes</c> helper — keeps the test project
    /// decoupled from a direct <c>SiesaAgents.Domain</c> assembly reference.
    /// Returns the new cliente's <see cref="Guid"/> id so the test can build the
    /// URL.
    /// </summary>
    private static Guid SeedClienteAsync(InMemoryFactory factory, string nombre, string nit, string? telefono, string? ciudad)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var asm = typeof(AppDbContext).Assembly;
        var domainAsm = asm.GetReferencedAssemblies()
            .Select(Assembly.Load)
            .FirstOrDefault(a => a.GetName().Name == "SiesaAgents.Domain");

        Assert.NotNull(domainAsm);

        var clrType = domainAsm!.GetType("SiesaAgents.Domain.Clientes.Entities.ClienteEntity");
        Assert.NotNull(clrType);

        var createMethod = clrType!.GetMethod("Create",
            new[] { typeof(string), typeof(string), typeof(string), typeof(string) });
        Assert.NotNull(createMethod);

        var entity = createMethod!.Invoke(null, new object?[] { nombre, nit, telefono, ciudad });
        Assert.NotNull(entity);

        db.Add(entity!);
        db.SaveChanges();

        var idProperty = clrType.GetProperty("Id");
        Assert.NotNull(idProperty);
        return (Guid)idProperty!.GetValue(entity)!;
    }
}
