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

    [Fact]
    public async Task GetClientes_Returns200_WithJsonArray()
    {
        // Arrange — no seeding (empty)

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
        // Arrange — no seeding

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
        // Arrange
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

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
        await _postgresContainer.DisposeAsync();
    }
}
