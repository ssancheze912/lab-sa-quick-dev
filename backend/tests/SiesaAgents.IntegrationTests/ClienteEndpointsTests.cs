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

    // ── Story 2.2 Integration Tests ───────────────────────────────────────────
    // Tests below are FAILING (RED phase) until the GET /api/v1/clientes/{id}
    // endpoint is implemented in ClienteEndpoints.cs and GetClienteByIdQueryHandler
    // is registered in DI.

    /// <summary>
    /// TC-E2-P2-02: Seed 1 client, GET /api/v1/clientes/{id}, assert 200 + ClienteDto object
    /// with all required fields (id, nombre, nit, telefono, ciudad, createdAt).
    /// AC1 and AC2 — clicking a list item or accessing URL directly both use this endpoint.
    /// </summary>
    [Fact]
    public async Task GetClienteById_WithSeededClient_Returns200AndClienteDto()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa Detalle", "900500100-1", "3005001001", "Bogotá");
        var httpClient = CreateClientWithSeed(entity);

        // Act
        var response = await httpClient.GetAsync($"/api/v1/clientes/{entity.Id}");

        // Assert — HTTP 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetClienteById_WithSeededClient_ReturnsJsonObjectNotArray()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa Detalle", "900500100-2", "3005001002", "Medellín");
        var httpClient = CreateClientWithSeed(entity);

        // Act
        var response = await httpClient.GetAsync($"/api/v1/clientes/{entity.Id}");

        // Assert — Response is a JSON object (not an array — direct object contract)
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Object, doc.RootElement.ValueKind);
    }

    [Fact]
    public async Task GetClienteById_WithSeededClient_ResponseContainsAllRequiredFields()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa Detalle", "900500100-3", "3005001003", "Cali");
        var httpClient = CreateClientWithSeed(entity);

        // Act
        var response = await httpClient.GetAsync($"/api/v1/clientes/{entity.Id}");
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var obj = doc.RootElement;

        // Assert — All 6 required fields present
        Assert.True(obj.TryGetProperty("id", out _));
        Assert.True(obj.TryGetProperty("nombre", out _));
        Assert.True(obj.TryGetProperty("nit", out _));
        Assert.True(obj.TryGetProperty("telefono", out _));
        Assert.True(obj.TryGetProperty("ciudad", out _));
        Assert.True(obj.TryGetProperty("createdAt", out _));
    }

    [Fact]
    public async Task GetClienteById_WithSeededClient_ResponseContainsCorrectNombre()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa Detalle Nombre", "900500100-4", "3005001004", "Barranquilla");
        var httpClient = CreateClientWithSeed(entity);

        // Act
        var response = await httpClient.GetAsync($"/api/v1/clientes/{entity.Id}");
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var obj = doc.RootElement;

        // Assert
        Assert.Equal("Empresa Detalle Nombre", obj.GetProperty("nombre").GetString());
    }

    [Fact]
    public async Task GetClienteById_WithSeededClient_ResponseContainsCorrectNit()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa NIT", "900500100-5", "3005001005", "Bucaramanga");
        var httpClient = CreateClientWithSeed(entity);

        // Act
        var response = await httpClient.GetAsync($"/api/v1/clientes/{entity.Id}");
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // Assert
        Assert.Equal("900500100-5", doc.RootElement.GetProperty("nit").GetString());
    }

    [Fact]
    public async Task GetClienteById_WithSeededClient_ResponseContainsValidIso8601CreatedAt()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ISO", "900500100-6", "3005001006", "Manizales");
        var httpClient = CreateClientWithSeed(entity);

        // Act
        var response = await httpClient.GetAsync($"/api/v1/clientes/{entity.Id}");
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // Assert — createdAt is a valid ISO 8601 DateTimeOffset (never bare DateTime)
        var createdAtString = doc.RootElement.GetProperty("createdAt").GetString();
        Assert.True(DateTimeOffset.TryParse(createdAtString, out _));
    }

    /// <summary>
    /// TC-E2-P2-03: GET /api/v1/clientes/{nonExistentId} returns 404 with Problem Details RFC 7807.
    /// AC3 — Non-existent clienteId triggers a 404 (not an unhandled exception).
    /// </summary>
    [Fact]
    public async Task GetClienteById_WithNonExistentId_Returns404()
    {
        // Arrange
        var nonExistentId = "00000000-0000-0000-0000-000000000000";
        var httpClient = CreateClientWithSeed(); // empty database

        // Act
        var response = await httpClient.GetAsync($"/api/v1/clientes/{nonExistentId}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetClienteById_WithNonExistentId_ResponseIsProblemDetailsFormat()
    {
        // Arrange
        var nonExistentId = "00000000-0000-0000-0000-000000000000";
        var httpClient = CreateClientWithSeed();

        // Act
        var response = await httpClient.GetAsync($"/api/v1/clientes/{nonExistentId}");
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var obj = doc.RootElement;

        // Assert — RFC 7807 Problem Details: must have "status" and "title" fields
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.True(obj.TryGetProperty("status", out var statusProp));
        Assert.Equal(404, statusProp.GetInt32());
        Assert.True(obj.TryGetProperty("title", out _));
    }

    [Fact]
    public async Task GetClienteById_WithNonExistentId_ResponseHasNoStackTrace()
    {
        // Arrange — NFR6: no technical details exposed in error response
        var nonExistentId = "00000000-0000-0000-0000-000000000000";
        var httpClient = CreateClientWithSeed();

        // Act
        var response = await httpClient.GetAsync($"/api/v1/clientes/{nonExistentId}");
        var body = await response.Content.ReadAsStringAsync();

        // Assert — no stack trace keywords in the response body
        Assert.DoesNotContain("StackTrace", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("at SiesaAgents", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Exception", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetClienteById_WithNonExistentId_DetailMessageIsInSpanish()
    {
        // Arrange
        var nonExistentId = "00000000-0000-0000-0000-000000000000";
        var httpClient = CreateClientWithSeed();

        // Act
        var response = await httpClient.GetAsync($"/api/v1/clientes/{nonExistentId}");
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // Assert — "detail" field in Spanish per company standards
        if (doc.RootElement.TryGetProperty("detail", out var detailProp))
        {
            var detail = detailProp.GetString() ?? string.Empty;
            Assert.Contains("cliente", detail, StringComparison.OrdinalIgnoreCase);
        }
    }
}
