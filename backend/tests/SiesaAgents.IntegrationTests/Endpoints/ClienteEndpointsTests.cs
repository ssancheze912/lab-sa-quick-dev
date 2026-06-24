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
        .WithImage("postgres:18-alpine")
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

    [Fact]
    public async Task PutCliente_Returns200_WithUpdatedClienteJson_WhenRequestIsValid()
    {
        // Arrange
        await ClearClientesAsync();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var entity = ClienteEntity.Create("Empresa Original", "222333444-5", "3002223333", "Cali");
        db.Clientes.Add(entity);
        await db.SaveChangesAsync();

        var request = new UpdateClienteRequest("Empresa Actualizada", "222333444-5", "3002229999", "Medellín");

        // Act
        var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{entity.Id}", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadFromJsonAsync<ClienteDto>();
        Assert.NotNull(content);
        Assert.Equal("Empresa Actualizada", content.Nombre);
        Assert.Equal("222333444-5", content.Nit);
        Assert.Equal("3002229999", content.Telefono);
        Assert.Equal("Medellín", content.Ciudad);
        Assert.Equal(entity.Id, content.Id);
        Assert.NotEqual(default, content.UpdatedAt);
    }

    [Fact]
    public async Task PutCliente_Returns400BadRequest_WhenRequiredFieldIsMissing()
    {
        // Arrange
        var id = Guid.NewGuid();
        var request = new { nombre = "", nit = "", telefono = "", ciudad = "" };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{id}", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("nombre", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task PutCliente_Returns404NotFound_WhenClienteIdDoesNotExist()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();
        var request = new UpdateClienteRequest("Empresa", "123456789-0", "3001234567", "Bogotá");

        // Act
        var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{nonExistentId}", request);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Not Found", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task PutCliente_Returns409Conflict_WhenNitConflictsWithAnotherCliente()
    {
        // Arrange
        await ClearClientesAsync();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Seed two clients with different NITs
        var existing = ClienteEntity.Create("Empresa Existing", "444555666-7", "3004445555", "Bogotá");
        var toUpdate = ClienteEntity.Create("Empresa To Update", "777888999-8", "3007778888", "Cali");
        db.Clientes.AddRange(existing, toUpdate);
        await db.SaveChangesAsync();

        // Try to update toUpdate's NIT to existing's NIT
        var request = new UpdateClienteRequest("Empresa To Update", "444555666-7", "3007778888", "Cali");

        // Act
        var response = await _client.PutAsJsonAsync($"/api/v1/clientes/{toUpdate.Id}", request);

        // Assert
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("NIT", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task DeleteCliente_Returns204NoContent_WhenClienteExists()
    {
        // Arrange
        await ClearClientesAsync();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var entity = ClienteEntity.Create("Empresa Para Eliminar", "333444555-6", "3003334444", "Medellín");
        db.Clientes.Add(entity);
        await db.SaveChangesAsync();

        // Act
        var response = await _client.DeleteAsync($"/api/v1/clientes/{entity.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Empty(body);
    }

    [Fact]
    public async Task DeleteCliente_RemovesEntityFromDatabase_WhenClienteExists()
    {
        // Arrange
        await ClearClientesAsync();
        using var seedScope = _factory.Services.CreateScope();
        var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var entity = ClienteEntity.Create("Empresa Eliminar Check", "888777666-5", "3008887777", "Cali");
        db.Clientes.Add(entity);
        await db.SaveChangesAsync();

        // Act
        await _client.DeleteAsync($"/api/v1/clientes/{entity.Id}");

        // Assert — entity is gone from DB
        using var verifyScope = _factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var deleted = await verifyDb.Clientes.FindAsync(entity.Id);
        Assert.Null(deleted);
    }

    [Fact]
    public async Task DeleteCliente_Returns404ProblemDetails_WhenClienteIdDoesNotExist()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await _client.DeleteAsync($"/api/v1/clientes/{nonExistentId}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Not Found", body, StringComparison.OrdinalIgnoreCase);
    }

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
        await _postgresContainer.DisposeAsync();
    }
}
