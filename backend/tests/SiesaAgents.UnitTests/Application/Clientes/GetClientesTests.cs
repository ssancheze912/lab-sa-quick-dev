using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Custom WebApplicationFactory that replaces PostgreSQL with InMemory database.
/// Removes all EF Core infrastructure descriptors before re-registering with InMemory.
/// </summary>
public class ClientesTestFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = $"ClientesTestDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=test;Username=test;Password=test"
            });
        });

        builder.ConfigureServices(services =>
        {
            // Remove ALL service descriptors related to DbContext and EF Core providers
            // to avoid "multiple database providers" error
            var toRemove = services
                .Where(d =>
                    d.ServiceType.FullName != null && (
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                    d.ServiceType == typeof(DbContextOptions) ||
                    d.ServiceType.FullName.StartsWith("Microsoft.EntityFrameworkCore") ||
                    d.ImplementationType?.FullName?.StartsWith("Microsoft.EntityFrameworkCore") == true ||
                    d.ImplementationType?.FullName?.StartsWith("Npgsql") == true ||
                    d.ImplementationType?.FullName?.StartsWith("EFCore.NamingConventions") == true))
                .ToList();

            foreach (var d in toRemove)
                services.Remove(d);

            // Register AppDbContext with InMemory provider
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(_dbName));
        });
    }
}

public class GetClientesTests
{
    [Fact]
    public async Task GetClientes_HappyPath_Returns200WithJsonArray()
    {
        // Arrange
        await using var factory = new ClientesTestFactory();

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Clientes.Add(ClienteEntity.Create("Empresa A", "900100001", "3001000001", "Bogotá"));
            db.Clientes.Add(ClienteEntity.Create("Empresa B", "900100002", "3001000002", "Medellín"));
            await db.SaveChangesAsync();
        }

        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/clientes");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.True(doc.RootElement.GetArrayLength() >= 2);
    }

    [Fact]
    public async Task GetClientes_EmptyDatabase_Returns200WithEmptyArray()
    {
        // Arrange: no seeding
        await using var factory = new ClientesTestFactory();
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/clientes");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(0, doc.RootElement.GetArrayLength());
    }

    [Fact]
    public async Task GetClientes_ResponseShape_ContainsRequiredFields()
    {
        // Arrange
        await using var factory = new ClientesTestFactory();

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Clientes.Add(ClienteEntity.Create("Shape Test SA", "800000099", "3002000001", "Cali"));
            await db.SaveChangesAsync();
        }

        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/clientes");
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var first = doc.RootElement.EnumerateArray().First();

        // Assert: all required fields present
        Assert.True(first.TryGetProperty("id", out _), "Missing 'id'");
        Assert.True(first.TryGetProperty("nombre", out _), "Missing 'nombre'");
        Assert.True(first.TryGetProperty("nit", out _), "Missing 'nit'");
        Assert.True(first.TryGetProperty("telefono", out _), "Missing 'telefono'");
        Assert.True(first.TryGetProperty("ciudad", out _), "Missing 'ciudad'");
        Assert.True(first.TryGetProperty("createdAt", out _), "Missing 'createdAt'");
    }
}
