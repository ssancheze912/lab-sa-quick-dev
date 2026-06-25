using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.IntegrationTests;

// ─── Helper factory ───────────────────────────────────────────────────────────

internal sealed class InMemoryClienteFactory(string dbName) : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureTestServices(services =>
        {
            // Find and remove ALL descriptors that mention AppDbContext or EF Core DB providers
            var serviceDescriptorsToRemove = services
                .Where(d =>
                    (d.ServiceType.Name.Contains("DbContext") && d.ServiceType.Name.Contains("Options")) ||
                    d.ServiceType == typeof(AppDbContext) ||
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                    (d.ImplementationType?.Name?.Contains("DbContext") == true) ||
                    (d.ServiceType.FullName?.Contains("Npgsql") == true) ||
                    (d.ImplementationType?.FullName?.Contains("Npgsql") == true))
                .ToList();

            foreach (var d in serviceDescriptorsToRemove)
                services.Remove(d);

            // Register InMemory DbContext — unique DB name to isolate tests
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(dbName));
        });
    }

    public async Task SeedAsync(Action<AppDbContext> seed)
    {
        // Build a fresh scope using the test application's service provider
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        seed(db);
        await db.SaveChangesAsync();
    }
}

// ─── Tests — each test uses its own isolated in-memory database ───────────────

public class ClienteEndpointsTests
{
    private static InMemoryClienteFactory CreateFactory() =>
        new("ClienteDb_" + Guid.NewGuid());

    [Fact]
    public async Task GetClientes_ReturnsOkWithEmptyArray_WhenNoClientsExist()
    {
        // Arrange — fresh, empty DB
        await using var factory = CreateFactory();
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/clientes");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<List<ClienteDto>>();
        body.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public async Task GetClientes_ReturnsOkWithClientList_AfterSeeding()
    {
        // Arrange
        await using var factory = CreateFactory();
        await factory.SeedAsync(db =>
        {
            db.Clientes.Add(ClienteEntity.Create("Empresa Ejemplo S.A.", "900123456-7", "6011234567", "Bogotá"));
        });

        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/clientes");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<List<ClienteDto>>();
        body.Should().NotBeNull();
        body!.Should().Contain(c => c.Nombre == "Empresa Ejemplo S.A." && c.Nit == "900123456-7");
    }

    [Fact]
    public async Task GetClientes_ReturnsApplicationJson_ContentType()
    {
        // Arrange
        await using var factory = CreateFactory();
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/clientes");

        // Assert
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    [Fact]
    public async Task GetClientes_ResponseContainsCamelCaseFields()
    {
        // Arrange
        await using var factory = CreateFactory();
        await factory.SeedAsync(db =>
        {
            db.Clientes.Add(ClienteEntity.Create("CamelCase Corp", "000000099-0", "3001234567", "Medellín"));
        });

        var client = factory.CreateClient();

        // Act
        var json = await client.GetStringAsync("/api/v1/clientes");

        // Assert — camelCase fields are present in JSON response
        json.Should().Contain("\"nombre\"");
        json.Should().Contain("\"nit\"");
        json.Should().Contain("\"createdAt\"");
        json.Should().Contain("\"updatedAt\"");
    }
}
