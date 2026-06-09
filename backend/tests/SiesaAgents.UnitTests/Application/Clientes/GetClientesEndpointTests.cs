// ATDD - Story 2.1: Client List & Search
// TC-E2-P2-01: Backend GET /api/v1/clientes returns array of ClienteDto

using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Integration tests for GET /api/v1/clientes endpoint (Story 2.1).
/// Uses WebApplicationFactory with InMemory EF Core provider for isolation.
/// Removes all DbContext descriptors to avoid Npgsql/InMemory dual-provider conflict.
/// </summary>
public class GetClientesEndpointTests
{
    private static WebApplicationFactory<Program> CreateFactory(string dbName)
    {
        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Test");
            builder.ConfigureServices(services =>
            {
                // Remove ALL descriptors that belong to the DbContext registration chain.
                // This includes the DbContextOptions<T>, AppDbContext itself, and any
                // IDbContextOptions extensions that were registered by AddDbContext.
                var toRemove = services
                    .Where(d =>
                        d.ServiceType.FullName != null &&
                        (d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                         d.ServiceType == typeof(DbContextOptions) ||
                         d.ServiceType == typeof(AppDbContext) ||
                         d.ServiceType.FullName.StartsWith("Microsoft.EntityFrameworkCore")))
                    .ToList();

                foreach (var d in toRemove)
                    services.Remove(d);

                // Re-register AppDbContext with InMemory provider only
                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase(dbName));
            });
        });
    }

    // -------------------------------------------------------------------------
    // TC-E2-P2-01: GET /api/v1/clientes returns 200 with ClienteDto array
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GetClientes_WithSeededData_Returns200WithClienteArray()
    {
        // ARRANGE
        var factory = CreateFactory($"TestDb_{Guid.NewGuid()}");

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Clientes.AddRange(
                ClienteEntity.Create("Acme Corp", "900123456-1", "3001234567", "Bogotá"),
                ClienteEntity.Create("Beta SA", "800234567-2", "3112345678", "Medellín"),
                ClienteEntity.Create("Gamma Ltda", "700345678-3", "3223456789", "Cali")
            );
            await db.SaveChangesAsync();
        }

        var client = factory.CreateClient();

        // ACT
        var response = await client.GetAsync("/api/v1/clientes");

        // ASSERT
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var clientes = await response.Content.ReadFromJsonAsync<ClienteDtoResponse[]>();
        Assert.NotNull(clientes);
        Assert.Equal(3, clientes.Length);

        foreach (var c in clientes)
        {
            Assert.NotEqual(Guid.Empty, c.Id);
            Assert.False(string.IsNullOrWhiteSpace(c.Nombre));
            Assert.False(string.IsNullOrWhiteSpace(c.Nit));
            Assert.False(string.IsNullOrWhiteSpace(c.Telefono));
            Assert.False(string.IsNullOrWhiteSpace(c.Ciudad));
            Assert.NotEqual(default, c.CreatedAt);
        }
    }

    [Fact]
    public async Task GetClientes_WithNoData_Returns200WithEmptyArray()
    {
        // ARRANGE
        var factory = CreateFactory($"TestDb_Empty_{Guid.NewGuid()}");
        var client = factory.CreateClient();

        // ACT
        var response = await client.GetAsync("/api/v1/clientes");

        // ASSERT
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var clientes = await response.Content.ReadFromJsonAsync<ClienteDtoResponse[]>();
        Assert.NotNull(clientes);
        Assert.Empty(clientes);
    }

    [Fact]
    public async Task GetClientes_ContentType_IsApplicationJson()
    {
        // ARRANGE
        var factory = CreateFactory($"TestDb_ContentType_{Guid.NewGuid()}");
        var client = factory.CreateClient();

        // ACT
        var response = await client.GetAsync("/api/v1/clientes");

        // ASSERT
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
    }
}

// DTO for deserializing response (mirrors ClienteDto shape with camelCase JSON)
file record ClienteDtoResponse(
    Guid Id,
    string Nombre,
    string Nit,
    string Telefono,
    string Ciudad,
    DateTimeOffset CreatedAt
);
