using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Interfaces;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;
using Testcontainers.PostgreSql;
using Xunit;
// CreateClienteRequest is in SiesaAgents.Application.Clientes.DTOs (already imported above)

namespace SiesaAgents.IntegrationTests.Endpoints;

public sealed class ClienteEndpointsTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgresContainer = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("siesa_agents_test")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;

    public async Task InitializeAsync()
    {
        await _postgresContainer.StartAsync();

        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Testing");
                builder.ConfigureServices(services =>
                {
                    // Remove the real DbContext registration
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor != null) services.Remove(descriptor);

                    // Add test DbContext pointing to the container
                    services.AddDbContext<AppDbContext>(options =>
                        options.UseNpgsql(_postgresContainer.GetConnectionString()));
                });
            });

        _client = _factory.CreateClient();

        // Apply migrations to the test database
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
    }

    private async Task ClearClientesAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Clientes.RemoveRange(db.Clientes);
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task GetClientes_Returns200_WithJsonArray()
    {
        // Arrange — no seeding (empty)
        await ClearClientesAsync();

        // Act
        var response = await _client.GetAsync("/api/v1/clientes");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadFromJsonAsync<List<ClienteDto>>();
        Assert.NotNull(content);
    }

    [Fact]
    public async Task GetClientes_ReturnsEmptyArray_WhenNoClientesSeeded()
    {
        // Arrange — ensure clean state
        await ClearClientesAsync();

        // Act
        var response = await _client.GetAsync("/api/v1/clientes");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadFromJsonAsync<List<ClienteDto>>();
        Assert.NotNull(content);
        Assert.Empty(content);
    }

    [Fact]
    public async Task GetClientes_ReturnsSeededData_WithCorrectCamelCaseFields()
    {
        // Arrange — clean state before seeding
        await ClearClientesAsync();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var cliente = ClienteEntity.Create("Empresa Gamma", "700111222-3", "3201112222", "Cali");
        db.Clientes.Add(cliente);
        await db.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync("/api/v1/clientes");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadFromJsonAsync<List<ClienteDto>>();
        Assert.NotNull(content);
        var found = content.FirstOrDefault(c => c.Nit == "700111222-3");
        Assert.NotNull(found);
        Assert.Equal("Empresa Gamma", found.Nombre);
        Assert.Equal("3201112222", found.Telefono);
        Assert.Equal("Cali", found.Ciudad);
        // Verify camelCase fields are present by checking non-null values
        Assert.NotEqual(default, found.Id);
        Assert.NotEqual(default, found.CreatedAt);
        Assert.NotEqual(default, found.UpdatedAt);
    }

    [Fact]
    public async Task GetClienteById_Returns200_WithClienteJson_WhenClienteExists()
    {
        // Arrange
        await ClearClientesAsync();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var cliente = ClienteEntity.Create("Empresa Delta", "600555444-5", "3150001111", "Barranquilla");
        db.Clientes.Add(cliente);
        await db.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/v1/clientes/{cliente.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadFromJsonAsync<ClienteDto>();
        Assert.NotNull(content);
        Assert.Equal(cliente.Id, content.Id);
        Assert.Equal("Empresa Delta", content.Nombre);
        Assert.Equal("600555444-5", content.Nit);
        Assert.Equal("3150001111", content.Telefono);
        Assert.Equal("Barranquilla", content.Ciudad);
    }

    [Fact]
    public async Task GetClienteById_Returns404ProblemDetails_WhenClienteDoesNotExist()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await _client.GetAsync($"/api/v1/clientes/{nonExistentId}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Not Found", body);
    }

    [Fact]
    public async Task GetClienteById_ResponseHasCamelCaseFields_WhenClienteExists()
    {
        // Arrange
        await ClearClientesAsync();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var cliente = ClienteEntity.Create("Empresa Epsilon", "500333222-6", "3167778888", "Cartagena");
        db.Clientes.Add(cliente);
        await db.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/v1/clientes/{cliente.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadFromJsonAsync<ClienteDto>();
        Assert.NotNull(content);
        Assert.NotEqual(default, content.Id);
        Assert.NotEqual(default, content.CreatedAt);
        Assert.NotEqual(default, content.UpdatedAt);
    }

    [Fact]
    public async Task PostCliente_Returns201Created_WithClienteJson_WhenRequestIsValid()
    {
        // Arrange
        await ClearClientesAsync();
        var request = new CreateClienteRequest("Empresa Zeta", "111222333-0", "3001112222", "Bucaramanga");

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", request);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var content = await response.Content.ReadFromJsonAsync<ClienteDto>();
        Assert.NotNull(content);
        Assert.Equal("Empresa Zeta", content.Nombre);
        Assert.Equal("111222333-0", content.Nit);
        Assert.Equal("3001112222", content.Telefono);
        Assert.Equal("Bucaramanga", content.Ciudad);
        Assert.NotEqual(default, content.Id);
        Assert.NotEqual(default, content.CreatedAt);
        Assert.NotEqual(default, content.UpdatedAt);
    }

    [Fact]
    public async Task PostCliente_Returns400BadRequest_WhenRequiredFieldIsMissing()
    {
        // Arrange
        var request = new { nombre = "", nit = "", telefono = "", ciudad = "" };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("nombre", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task PostCliente_Returns409Conflict_WhenNitAlreadyExists()
    {
        // Arrange
        await ClearClientesAsync();
        // Seed a cliente with the same NIT
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var existing = ClienteEntity.Create("Empresa Existing", "999888777-6", "3000000001", "Cali");
        db.Clientes.Add(existing);
        await db.SaveChangesAsync();

        var request = new CreateClienteRequest("Empresa Duplicate", "999888777-6", "3000000002", "Bogotá");

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", request);

        // Assert
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("NIT", body, StringComparison.OrdinalIgnoreCase);
    }

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
        await _postgresContainer.DisposeAsync();
    }
}
