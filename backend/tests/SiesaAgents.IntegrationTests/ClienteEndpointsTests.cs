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

    // ─── GET /api/v1/clientes/{id} — new endpoint tests ─────────────────────────

    [Fact]
    public async Task GetClienteById_ReturnsOkWithClientData_WhenClientExists()
    {
        // Arrange
        await using var factory = CreateFactory();
        ClienteEntity? seededCliente = null;
        await factory.SeedAsync(db =>
        {
            seededCliente = ClienteEntity.Create("Empresa Ejemplo S.A.", "900123456-7", "6011234567", "Bogotá");
            db.Clientes.Add(seededCliente);
        });

        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync($"/api/v1/clientes/{seededCliente!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ClienteDto>();
        body.Should().NotBeNull();
        body!.Id.Should().Be(seededCliente.Id);
        body.Nombre.Should().Be("Empresa Ejemplo S.A.");
        body.Nit.Should().Be("900123456-7");
        body.Telefono.Should().Be("6011234567");
        body.Ciudad.Should().Be("Bogotá");
    }

    [Fact]
    public async Task GetClienteById_Returns404WithProblemDetails_WhenClientDoesNotExist()
    {
        // Arrange — empty DB, unknown ID
        await using var factory = CreateFactory();
        var client = factory.CreateClient();
        var unknownId = Guid.NewGuid();

        // Act
        var response = await client.GetAsync($"/api/v1/clientes/{unknownId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");

        var json = await response.Content.ReadAsStringAsync();
        json.Should().Contain("404");
        json.Should().Contain(unknownId.ToString());
    }

    [Fact]
    public async Task GetClienteById_ReturnsApplicationJson_WhenClientExists()
    {
        // Arrange
        await using var factory = CreateFactory();
        ClienteEntity? seededCliente = null;
        await factory.SeedAsync(db =>
        {
            seededCliente = ClienteEntity.Create("Content Type Corp", "111111111-1", "3109876543", "Cali");
            db.Clientes.Add(seededCliente);
        });

        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync($"/api/v1/clientes/{seededCliente!.Id}");

        // Assert
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    [Fact]
    public async Task GetClienteById_ResponseContainsCamelCaseFields()
    {
        // Arrange
        await using var factory = CreateFactory();
        ClienteEntity? seededCliente = null;
        await factory.SeedAsync(db =>
        {
            seededCliente = ClienteEntity.Create("CamelCase Cliente", "222222222-2", "3009876543", "Medellín");
            db.Clientes.Add(seededCliente);
        });

        var client = factory.CreateClient();

        // Act
        var json = await client.GetStringAsync($"/api/v1/clientes/{seededCliente!.Id}");

        // Assert — camelCase fields are present in JSON response
        json.Should().Contain("\"nombre\"");
        json.Should().Contain("\"nit\"");
        json.Should().Contain("\"createdAt\"");
        json.Should().Contain("\"updatedAt\"");
    }

    // ─── POST /api/v1/clientes ───────────────────────────────────────────────────

    [Fact]
    public async Task PostCliente_Returns201Created_WithClienteDtoBodyAndLocationHeader()
    {
        // Arrange
        await using var factory = CreateFactory();
        var client = factory.CreateClient();
        var payload = new { nombre = "Empresa Ejemplo S.A.", nit = "900123456-7", telefono = "6011234567", ciudad = "Bogotá" };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/clientes", payload);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var body = await response.Content.ReadFromJsonAsync<ClienteDto>();
        body.Should().NotBeNull();
        body!.Id.Should().NotBeEmpty();
        body.Nombre.Should().Be("Empresa Ejemplo S.A.");
        body.Nit.Should().Be("900123456-7");
        body.Telefono.Should().Be("6011234567");
        body.Ciudad.Should().Be("Bogotá");

        response.Headers.Location.Should().NotBeNull();
        response.Headers.Location!.ToString().Should().Contain($"/api/v1/clientes/{body.Id}");
    }

    [Fact]
    public async Task PostCliente_Returns400_WhenRequiredFieldsAreEmpty()
    {
        // Arrange
        await using var factory = CreateFactory();
        var client = factory.CreateClient();
        var payload = new { nombre = "", nit = "", telefono = "", ciudad = "" };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/clientes", payload);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");

        var json = await response.Content.ReadAsStringAsync();
        json.Should().Contain("400");
    }

    [Fact]
    public async Task PostCliente_ReturnsApplicationJsonWithCamelCaseFields()
    {
        // Arrange
        await using var factory = CreateFactory();
        var client = factory.CreateClient();
        var payload = new { nombre = "CamelCase Corp", nit = "333333333-3", telefono = "3001234567", ciudad = "Cali" };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/clientes", payload);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");

        var json = await response.Content.ReadAsStringAsync();
        json.Should().Contain("\"nombre\"");
        json.Should().Contain("\"nit\"");
        json.Should().Contain("\"createdAt\"");
        json.Should().Contain("\"updatedAt\"");
    }

    [Fact]
    public async Task PostCliente_CreatedClientAppearsInGetAll()
    {
        // Arrange
        await using var factory = CreateFactory();
        var client = factory.CreateClient();
        var payload = new { nombre = "Nueva Empresa", nit = "444444444-4", telefono = "3219876543", ciudad = "Medellín" };

        // Act — create
        var postResponse = await client.PostAsJsonAsync("/api/v1/clientes", payload);
        postResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        // Act — get all
        var getResponse = await client.GetAsync("/api/v1/clientes");

        // Assert
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var clientes = await getResponse.Content.ReadFromJsonAsync<List<ClienteDto>>();
        clientes.Should().NotBeNull();
        clientes!.Should().Contain(c => c.Nombre == "Nueva Empresa" && c.Nit == "444444444-4");
    }
}
