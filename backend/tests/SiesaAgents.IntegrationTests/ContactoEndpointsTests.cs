using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Domain.Contactos.Entities;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.IntegrationTests;

// ─── Helper factory ───────────────────────────────────────────────────────────

internal sealed class InMemoryContactoFactory(string dbName) : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureTestServices(services =>
        {
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

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(dbName));
        });
    }

    public async Task SeedAsync(Action<AppDbContext> seed)
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        seed(db);
        await db.SaveChangesAsync();
    }
}

// ─── Tests — each test uses its own isolated in-memory database ───────────────

public class ContactoEndpointsTests
{
    private static InMemoryContactoFactory CreateFactory() =>
        new("ContactoDb_" + Guid.NewGuid());

    [Fact]
    public async Task GetContactos_ReturnsOkWithEmptyArray_WhenNoContactsExist()
    {
        // Arrange — fresh, empty DB
        await using var factory = CreateFactory();
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/contactos");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<List<ContactoDto>>();
        body.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public async Task GetContactos_ReturnsOkWithContactList_AfterSeeding()
    {
        // Arrange
        await using var factory = CreateFactory();
        await factory.SeedAsync(db =>
        {
            db.Contactos.Add(ContactoEntity.Create("Juan Pérez", "Gerente Comercial", "3001234567", "juan.perez@empresa.com"));
        });

        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/contactos");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<List<ContactoDto>>();
        body.Should().NotBeNull();
        body!.Should().Contain(c => c.Nombre == "Juan Pérez" && c.Email == "juan.perez@empresa.com");
    }

    [Fact]
    public async Task GetContactos_ReturnsApplicationJson_ContentType()
    {
        // Arrange
        await using var factory = CreateFactory();
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/contactos");

        // Assert
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    [Fact]
    public async Task GetContactos_ResponseContainsCamelCaseFields_IncludingClienteIdNull()
    {
        // Arrange
        await using var factory = CreateFactory();
        await factory.SeedAsync(db =>
        {
            db.Contactos.Add(ContactoEntity.Create("María García", "Directora", "3107654321", "m.garcia@freelance.com"));
        });

        var client = factory.CreateClient();

        // Act
        var json = await client.GetStringAsync("/api/v1/contactos");

        // Assert — camelCase fields and clienteId: null
        json.Should().Contain("\"nombre\"");
        json.Should().Contain("\"email\"");
        json.Should().Contain("\"createdAt\"");
        json.Should().Contain("\"updatedAt\"");
        json.Should().Contain("\"clienteId\"");
    }
}
