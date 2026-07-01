using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SiesaAgents.Application.DTOs;
using SiesaAgents.Domain.Entities;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.IntegrationTests.Support;

namespace SiesaAgents.IntegrationTests.Endpoints;

/// <summary>
/// Story 3.1 (AC #1, #2): `GET /api/v1/contactos` end-to-end via the real
/// ASP.NET pipeline (TestApiFactory -> Program.cs), independent of the
/// frontend's client-side filtering (TC-E3-P2-07 backend-path coverage, R6).
///
/// RED PHASE: `GET /api/v1/contactos` does not exist yet (Story 3.1, Task 2).
/// These tests define the expected contract.
/// </summary>
public class ContactoEndpointsTests : IClassFixture<TestApiFactory>, IAsyncLifetime
{
    private const string ConnectionString =
        "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres";

    private readonly TestApiFactory _factory;
    private readonly List<Guid> _createdIds = [];

    public ContactoEndpointsTests(TestApiFactory factory)
    {
        _factory = factory;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        if (_createdIds.Count == 0)
        {
            return;
        }

        await using var context = CreateContext();
        var toRemove = await context.Set<ContactoEntity>().Where(c => _createdIds.Contains(c.Id)).ToListAsync();
        context.Set<ContactoEntity>().RemoveRange(toRemove);
        await context.SaveChangesAsync();
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString, npgsql => { })
            .ReplaceService<IHistoryRepository, SnakeCaseNpgsqlHistoryRepository>()
            .Options;
        return new AppDbContext(options);
    }

    private async Task<ContactoEntity> SeedAsync(string nombre, string email, Guid? clienteId = null)
    {
        await using var context = CreateContext();
        var contacto = ContactoEntity.Create(nombre, "Analista", "3000000000", email, clienteId);
        context.Set<ContactoEntity>().Add(contacto);
        await context.SaveChangesAsync();
        _createdIds.Add(contacto.Id);
        return contacto;
    }

    [Fact]
    public async Task GetContactos_ReturnsOk()
    {
        // GIVEN a contact
        var suffix = Guid.NewGuid().ToString("N")[..8];
        await SeedAsync($"Endpoint Contacto {suffix}", $"endpoint.{suffix}@ejemplo.co");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/contactos
        var response = await client.GetAsync("/api/v1/contactos");

        // THEN the response is 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetContactos_ReturnsAllSeededContactos()
    {
        // GIVEN a seeded contact
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Todos Contacto {suffix}", $"todos.{suffix}@ejemplo.co");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/contactos without a search term
        var result = await client.GetFromJsonAsync<List<ContactoDto>>("/api/v1/contactos");

        // THEN the seeded contact is present in the response
        Assert.NotNull(result);
        Assert.Contains(result!, c => c.Id == seeded.Id);
    }

    [Fact]
    public async Task GetContactos_WithSearchTermMatchingNombre_ReturnsOnlyMatchingContactos()
    {
        // GIVEN two contacts with distinct names
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var target = await SeedAsync($"Filtrado Especial {suffix}", $"filtrado.{suffix}@ejemplo.co");
        await SeedAsync($"Otro Diferente {suffix}", $"otro.{suffix}@ejemplo.co");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/contactos?q=<term matching only target's nombre>
        var result = await client.GetFromJsonAsync<List<ContactoDto>>($"/api/v1/contactos?q=Filtrado Especial {suffix}");

        // THEN only the matching contact is returned
        Assert.NotNull(result);
        Assert.Contains(result!, c => c.Id == target.Id);
        Assert.DoesNotContain(result!, c => c.Nombre.StartsWith("Otro Diferente"));
    }

    [Fact]
    public async Task GetContactos_WithSearchTermMatchingOnlyEmail_ReturnsTheMatchingContacto_R6()
    {
        // GIVEN a contact whose EMAIL contains the search term but whose
        // NOMBRE does not (R6 — search must check both fields independently,
        // not just Nombre; TC-E3-P2-07 backend-path coverage)
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var target = await SeedAsync($"Juan Perez {suffix}", $"correo.unico.{suffix}@dominio-raro.co");
        await SeedAsync($"Maria Lopez {suffix}", $"otro.{suffix}@ejemplo.co");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/contactos?q=<substring only present in the email>
        var result = await client.GetFromJsonAsync<List<ContactoDto>>($"/api/v1/contactos?q=dominio-raro.co");

        // THEN the contact matches via Email, proving the backend does not
        // filter on Nombre alone
        Assert.NotNull(result);
        Assert.Contains(result!, c => c.Id == target.Id);
    }

    [Fact]
    public async Task GetContactos_WithNonMatchingSearchTerm_ReturnsEmptyArrayNot404()
    {
        // GIVEN a seeded contact that won't match
        var suffix = Guid.NewGuid().ToString("N")[..8];
        await SeedAsync($"Contacto Existente {suffix}", $"existente.{suffix}@ejemplo.co");
        var client = _factory.CreateClient();

        // WHEN searching for a term that matches nothing
        var response = await client.GetAsync($"/api/v1/contactos?q=zzz-inexistente-{suffix}");
        var result = await response.Content.ReadFromJsonAsync<List<ContactoDto>>();

        // THEN the endpoint still returns 200 OK with an empty array (not 404/error)
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(result);
        Assert.Empty(result!);
    }

    [Fact]
    public async Task GetContactos_ResponseUsesCamelCaseJsonPropertyNames()
    {
        // GIVEN a seeded contact
        var suffix = Guid.NewGuid().ToString("N")[..8];
        await SeedAsync($"CamelCase Contacto {suffix}", $"camelcase.{suffix}@ejemplo.co");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/contactos
        var response = await client.GetAsync("/api/v1/contactos");
        var rawJson = await response.Content.ReadAsStringAsync();

        // THEN the JSON payload exposes camelCase keys matching the frontend's Contacto interface
        Assert.Contains("\"nombre\"", rawJson);
        Assert.Contains("\"cargo\"", rawJson);
        Assert.Contains("\"telefono\"", rawJson);
        Assert.Contains("\"email\"", rawJson);
        Assert.Contains("\"clienteId\"", rawJson);
        Assert.Contains("\"createdAt\"", rawJson);
    }

    [Fact]
    public async Task GetContactos_WithContactoNotAssociatedToAnyCliente_ReturnsNullClienteId()
    {
        // GIVEN a contact created with no clienteId (independent, unassociated)
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Sin Cliente {suffix}", $"sincliente.{suffix}@ejemplo.co", clienteId: null);
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/contactos
        var result = await client.GetFromJsonAsync<List<ContactoDto>>("/api/v1/contactos");

        // THEN the contact's clienteId is null in the response, matching its nullable FK
        var found = result!.Single(c => c.Id == seeded.Id);
        Assert.Null(found.ClienteId);
    }
}
