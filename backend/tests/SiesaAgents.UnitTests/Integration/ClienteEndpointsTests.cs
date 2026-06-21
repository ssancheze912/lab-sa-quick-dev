using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Application.Clientes.Interfaces;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Integration;

public class ClienteEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ClienteEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace real DB with InMemory for tests
                var descriptor = services.SingleOrDefault(d =>
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase("TestDb_" + Guid.NewGuid()));
            });
        });
    }

    [Fact]
    public async Task GET_ApiV1Clientes_Returns200WithEmptyArray()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/clientes");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        var array = JsonSerializer.Deserialize<JsonElement[]>(json);
        Assert.NotNull(array);
        Assert.Empty(array);
    }

    [Fact]
    public async Task GET_ApiV1Clientes_ReturnsCorrectJsonShape()
    {
        // Arrange — seed a cliente
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d =>
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                var dbName = "TestDb_shape_" + Guid.NewGuid();
                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase(dbName));

                // Seed data
                var sp = services.BuildServiceProvider();
                using var scope = sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                db.Clientes.Add(ClienteEntity.Create("Empresa Test SA", "900123456-1", "+573001234567", "Bogotá"));
                db.SaveChanges();
            });
        }).CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/clientes");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.Equal(JsonValueKind.Array, root.ValueKind);
        Assert.Equal(1, root.GetArrayLength());

        var item = root[0];

        // Verify required fields exist with correct types
        Assert.True(item.TryGetProperty("id", out var id));
        Assert.Equal(JsonValueKind.String, id.ValueKind);
        Assert.True(Guid.TryParse(id.GetString(), out _));

        Assert.True(item.TryGetProperty("nombre", out var nombre));
        Assert.Equal("Empresa Test SA", nombre.GetString());

        Assert.True(item.TryGetProperty("nit", out var nit));
        Assert.Equal("900123456-1", nit.GetString());

        Assert.True(item.TryGetProperty("telefono", out _));
        Assert.True(item.TryGetProperty("ciudad", out _));

        // Verify createdAt is present and has timezone offset
        Assert.True(item.TryGetProperty("createdAt", out var createdAt));
        Assert.Equal(JsonValueKind.String, createdAt.ValueKind);
        var createdAtStr = createdAt.GetString()!;
        Assert.True(DateTimeOffset.TryParse(createdAtStr, out _),
            $"createdAt '{createdAtStr}' should be a valid DateTimeOffset");

        Assert.True(item.TryGetProperty("updatedAt", out _));
    }
}
