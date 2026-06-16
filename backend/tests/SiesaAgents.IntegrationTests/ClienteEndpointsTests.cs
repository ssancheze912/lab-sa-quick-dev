using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests;

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
                if (descriptor is not null)
                    services.Remove(descriptor);

                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase("IntegrationTestDb_" + Guid.NewGuid()));
            });
        });
    }

    [Fact]
    public async Task GetClientes_Returns200_WithJsonArray()
    {
        // Arrange — seed one client
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.EnsureCreatedAsync();
        dbContext.Clientes.Add(ClienteEntity.Create("Test Corp", "900111111-1", "3001111111", "Bogotá"));
        await dbContext.SaveChangesAsync();

        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/clientes");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var clientes = await response.Content.ReadFromJsonAsync<List<ClienteDto>>();
        Assert.NotNull(clientes);
        Assert.NotEmpty(clientes);
        Assert.Equal("Test Corp", clientes[0].Nombre);
    }

    [Fact]
    public async Task GetClientes_Returns200_WithEmptyArray_WhenNoClientes()
    {
        // Arrange — empty DB
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor is not null)
                    services.Remove(descriptor);

                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase("EmptyDb_" + Guid.NewGuid()));
            });
        });

        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/clientes");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var clientes = await response.Content.ReadFromJsonAsync<List<ClienteDto>>();
        Assert.NotNull(clientes);
        Assert.Empty(clientes);
    }

    // TC-E2-P1-01: GET /api/v1/clientes/{id} returns 200 with all fields
    [Fact]
    public async Task GetClienteById_Returns200_WithAllFields_WhenClienteExists()
    {
        // Arrange — seed one client
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.EnsureCreatedAsync();
        var cliente = ClienteEntity.Create("Detail Corp", "900222222-2", "3002222222", "Cali");
        dbContext.Clientes.Add(cliente);
        await dbContext.SaveChangesAsync();

        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync($"/api/v1/clientes/{cliente.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<ClienteDto>(
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotNull(dto);
        Assert.Equal(cliente.Id, dto.Id);
        Assert.Equal("Detail Corp", dto.Nombre);
        Assert.Equal("900222222-2", dto.NIT);
        Assert.Equal("3002222222", dto.Telefono);
        Assert.Equal("Cali", dto.Ciudad);
        Assert.True(dto.CreatedAt > DateTimeOffset.MinValue);
        Assert.True(dto.UpdatedAt > DateTimeOffset.MinValue);
    }

    // TC-E2-P1-02: GET /api/v1/clientes/{nonExistentId} returns 404 Problem Details
    [Fact]
    public async Task GetClienteById_Returns404_ProblemDetails_WhenClienteDoesNotExist()
    {
        // Arrange
        var client = _factory.CreateClient();
        var nonExistentId = Guid.Empty; // 00000000-0000-0000-0000-000000000000

        // Act
        var response = await client.GetAsync($"/api/v1/clientes/{nonExistentId}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // Verify Problem Details format (RFC 7807) — no stack trace
        Assert.True(root.TryGetProperty("status", out var statusProp));
        Assert.Equal(404, statusProp.GetInt32());
        Assert.True(root.TryGetProperty("title", out _));
        Assert.True(root.TryGetProperty("detail", out _));
        // Verify no stack trace exposed (NFR6)
        Assert.False(root.TryGetProperty("exception", out _));
        Assert.False(root.TryGetProperty("stackTrace", out _));
    }
}
