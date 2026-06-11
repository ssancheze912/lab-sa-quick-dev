using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Integration tests for GET /api/v1/clientes endpoint.
/// Uses WebApplicationFactory with InMemory database to avoid PostgreSQL dependency.
/// </summary>
public class ClienteEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ClienteEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace PostgreSQL with InMemory for tests
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase("IntegrationTestDb_" + Guid.NewGuid()));
            });
        });
    }

    private HttpClient CreateClientWithSeedData(params ClienteEntity[] entities)
    {
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                var dbName = "IntegrationTestDb_" + Guid.NewGuid();
                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase(dbName));

                var sp = services.BuildServiceProvider();
                using var scope = sp.CreateScope();
                var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                ctx.Database.EnsureCreated();
                ctx.Clientes.AddRange(entities);
                ctx.SaveChanges();
            });
        }).CreateClient();

        return client;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P1-01: GET /api/v1/clientes returns 200 with array
    //
    // Given: the system has at least one cliente
    // When:  GET /api/v1/clientes is called
    // Then:  200 OK is returned with a JSON array
    //   And: each element has all fields including createdAt as ISO 8601 UTC offset
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task GetClientes_ReturnsOkWithArray()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa Alpha", "900123456-1", "6014567890", "Bogotá");
        var client = CreateClientWithSeedData(entity);

        // Act
        var response = await client.GetAsync("/api/v1/clientes");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var dtos = await response.Content.ReadFromJsonAsync<List<ClienteDto>>();
        Assert.NotNull(dtos);
        Assert.Single(dtos);

        var dto = dtos[0];
        Assert.Equal(entity.Nombre, dto.Nombre);
        Assert.Equal(entity.Nit, dto.Nit);
        Assert.Equal(entity.Telefono, dto.Telefono);
        Assert.Equal(entity.Ciudad, dto.Ciudad);
        // CreatedAt must be DateTimeOffset (ISO 8601 with UTC offset)
        Assert.NotEqual(default, dto.CreatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P2-07: GET /api/v1/clientes?q=Alpha filters by name
    //
    // Given: the system has multiple clientes
    // When:  GET /api/v1/clientes?q=Alpha is called
    // Then:  only clientes matching "Alpha" in name are returned
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task GetClientes_WithSearchByName_FiltersResults()
    {
        // Arrange
        var alpha = ClienteEntity.Create("Empresa Alpha", "900111111-1", "601111111", "Bogotá");
        var beta = ClienteEntity.Create("Empresa Beta", "900222222-2", "602222222", "Medellín");
        var client = CreateClientWithSeedData(alpha, beta);

        // Act
        var response = await client.GetAsync("/api/v1/clientes?q=Alpha");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dtos = await response.Content.ReadFromJsonAsync<List<ClienteDto>>();
        Assert.NotNull(dtos);
        Assert.Single(dtos);
        Assert.Equal("Empresa Alpha", dtos[0].Nombre);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P2-07: GET /api/v1/clientes?q=111 filters by NIT
    //
    // Given: the system has multiple clientes
    // When:  GET /api/v1/clientes?q=111 is called
    // Then:  only clientes matching "111" in NIT are returned
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task GetClientes_WithSearchByNit_FiltersResults()
    {
        // Arrange
        var alpha = ClienteEntity.Create("Empresa Alpha", "900111111-1", "601111111", "Bogotá");
        var beta = ClienteEntity.Create("Empresa Beta", "900222222-2", "602222222", "Medellín");
        var client = CreateClientWithSeedData(alpha, beta);

        // Act
        var response = await client.GetAsync("/api/v1/clientes?q=111");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dtos = await response.Content.ReadFromJsonAsync<List<ClienteDto>>();
        Assert.NotNull(dtos);
        Assert.Single(dtos);
        Assert.Equal("900111111-1", dtos[0].Nit);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Given: the system has no clientes
    // When:  GET /api/v1/clientes is called
    // Then:  200 OK with empty array is returned
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task GetClientes_WhenEmpty_ReturnsOkWithEmptyArray()
    {
        // Arrange
        var client = CreateClientWithSeedData();

        // Act
        var response = await client.GetAsync("/api/v1/clientes");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dtos = await response.Content.ReadFromJsonAsync<List<ClienteDto>>();
        Assert.NotNull(dtos);
        Assert.Empty(dtos);
    }
}
