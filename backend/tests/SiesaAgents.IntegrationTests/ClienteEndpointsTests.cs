using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;
using Xunit;

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
                // Replace PostgreSQL with InMemory for integration tests
                var descriptor = services.SingleOrDefault(d =>
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase("IntegrationTestDb_" + Guid.NewGuid()));
            });
        });
    }

    private HttpClient CreateClientWithSeed(params ClienteEntity[] entities)
    {
        var client = _factory.CreateClient();

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
        db.Clientes.AddRange(entities);
        db.SaveChanges();

        return client;
    }

    /// <summary>
    /// TC-E2-P2-01: Seed 3 clients, GET /api/v1/clientes, assert 200 + JSON array length 3
    /// with all required fields in ISO 8601 format.
    /// </summary>
    [Fact]
    public async Task GetClientes_WithSeededData_Returns200AndJsonArray()
    {
        // Arrange
        var c1 = ClienteEntity.Create("Empresa A", "900100001-1", "3001000001", "Bogotá");
        var c2 = ClienteEntity.Create("Empresa B", "900100002-2", "3001000002", "Medellín");
        var c3 = ClienteEntity.Create("Empresa C", "900100003-3", "3001000003", "Cali");

        var client = CreateClientWithSeed(c1, c2, c3);

        // Act
        var response = await client.GetAsync("/api/v1/clientes");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var array = doc.RootElement;

        Assert.Equal(JsonValueKind.Array, array.ValueKind);
        Assert.Equal(3, array.GetArrayLength());

        // Verify each element has the required fields
        foreach (var element in array.EnumerateArray())
        {
            Assert.True(element.TryGetProperty("id", out _));
            Assert.True(element.TryGetProperty("nombre", out _));
            Assert.True(element.TryGetProperty("nit", out _));
            Assert.True(element.TryGetProperty("telefono", out _));
            Assert.True(element.TryGetProperty("ciudad", out _));
            Assert.True(element.TryGetProperty("createdAt", out var createdAt));
            // Verify ISO 8601 with timezone (DateTimeOffset serialization)
            Assert.True(DateTimeOffset.TryParse(createdAt.GetString(), out _));
        }
    }

    /// <summary>
    /// GET /api/v1/clientes with no data returns 200 and empty array [].
    /// </summary>
    [Fact]
    public async Task GetClientes_WhenEmpty_Returns200AndEmptyArray()
    {
        // Arrange
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d =>
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase("EmptyDb_" + Guid.NewGuid()));
            });
        }).CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/clientes");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(0, doc.RootElement.GetArrayLength());
    }

    /// <summary>
    /// TC-E2-P2-02: Seed 1 client, GET /api/v1/clientes/{id}, assert 200 + JSON object with all required fields.
    /// </summary>
    [Fact]
    public async Task GetClienteById_WithSeededClient_Returns200AndClienteDto()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa XYZ", "900777777-7", "3007777777", "Cali");
        var client = CreateClientWithSeed(entity);

        // Act
        var response = await client.GetAsync($"/api/v1/clientes/{entity.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var obj = doc.RootElement;

        Assert.Equal(JsonValueKind.Object, obj.ValueKind);
        Assert.True(obj.TryGetProperty("id", out var idProp));
        Assert.Equal(entity.Id.ToString(), idProp.GetString());
        Assert.True(obj.TryGetProperty("nombre", out var nombreProp));
        Assert.Equal("Empresa XYZ", nombreProp.GetString());
        Assert.True(obj.TryGetProperty("nit", out var nitProp));
        Assert.Equal("900777777-7", nitProp.GetString());
        Assert.True(obj.TryGetProperty("telefono", out var telefonoProp));
        Assert.Equal("3007777777", telefonoProp.GetString());
        Assert.True(obj.TryGetProperty("ciudad", out var ciudadProp));
        Assert.Equal("Cali", ciudadProp.GetString());
        Assert.True(obj.TryGetProperty("createdAt", out var createdAtProp));
        Assert.True(DateTimeOffset.TryParse(createdAtProp.GetString(), out _));
    }

    /// <summary>
    /// TC-E2-P2-03: GET /api/v1/clientes/{non-existent-id} returns 404 with Problem Details RFC 7807, no stack trace.
    /// </summary>
    [Fact]
    public async Task GetClienteById_WithNonExistentId_Returns404WithProblemDetails()
    {
        // Arrange
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d =>
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase("NotFoundDb_" + Guid.NewGuid()));
            });
        }).CreateClient();

        var nonExistentId = Guid.Empty;

        // Act
        var response = await client.GetAsync($"/api/v1/clientes/{nonExistentId}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var obj = doc.RootElement;

        Assert.Equal(JsonValueKind.Object, obj.ValueKind);
        Assert.True(obj.TryGetProperty("status", out var statusProp));
        Assert.Equal(404, statusProp.GetInt32());
        Assert.True(obj.TryGetProperty("title", out _));
        // No stack trace in response
        Assert.False(obj.TryGetProperty("stackTrace", out _));
        Assert.False(obj.TryGetProperty("exception", out _));
    }
}
