using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;
using Testcontainers.PostgreSql;
using Xunit;

namespace SiesaAgents.IntegrationTests.Endpoints;

public sealed class ContactoEndpointsTests : IAsyncLifetime
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

    private async Task ClearContactosAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Contactos.RemoveRange(db.Contactos);
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task GetContactos_Returns200_WithJsonArray()
    {
        // Arrange — no seeding (empty)
        await ClearContactosAsync();

        // Act
        var response = await _client.GetAsync("/api/v1/contactos");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadFromJsonAsync<List<ContactoDto>>();
        Assert.NotNull(content);
    }

    [Fact]
    public async Task GetContactos_ReturnsEmptyArray_WhenNoContactosSeeded()
    {
        // Arrange
        await ClearContactosAsync();

        // Act
        var response = await _client.GetAsync("/api/v1/contactos");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadFromJsonAsync<List<ContactoDto>>();
        Assert.NotNull(content);
        Assert.Empty(content);
    }

    [Fact]
    public async Task GetContactos_ReturnsSeededContactoData_WithCorrectCamelCaseFields()
    {
        // Arrange
        await ClearContactosAsync();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var contacto = ContactoEntity.Create("Juan Pérez", "Gerente", "3001234567", "juan.perez@empresa.com");
        db.Contactos.Add(contacto);
        await db.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync("/api/v1/contactos");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadFromJsonAsync<List<ContactoDto>>();
        Assert.NotNull(content);
        Assert.Single(content);
        var dto = content[0];
        Assert.Equal("Juan Pérez", dto.Nombre);
        Assert.Equal("Gerente", dto.Cargo);
        Assert.Equal("3001234567", dto.Telefono);
        Assert.Equal("juan.perez@empresa.com", dto.Email);
        Assert.Null(dto.ClienteId);
    }

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
        await _postgresContainer.DisposeAsync();
    }
}
