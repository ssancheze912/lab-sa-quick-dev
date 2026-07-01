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

    // --- Story 3.2: GET /api/v1/contactos/{id} (AC #1, #2, #3) ------------------
    //
    // RED PHASE: `GET /api/v1/contactos/{id}` does not exist yet (Story 3.2,
    // Task 1). These tests define the expected contract: 200 + the correct
    // ContactoDto for an existing contact, and 404 + Problem Details (no
    // stack trace / no technical leakage per NFR6) for a non-existent Id.
    // Mirrors ClienteEndpointsTests' GetClienteById coverage exactly
    // (TC-E3-P1-06 backend leg, TC-E3-P1-07 backend leg).

    [Fact]
    public async Task GetContactoById_WithExistingId_ReturnsOk()
    {
        // GIVEN a seeded contact
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Detalle Endpoint Contacto {suffix}", $"detalle.endpoint.{suffix}@ejemplo.co");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/contactos/{id} with an existing Id
        var response = await client.GetAsync($"/api/v1/contactos/{seeded.Id}");

        // THEN the response is 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetContactoById_WithExistingId_ReturnsTheCorrectContactoDto()
    {
        // GIVEN a seeded contact
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Correcto Contacto {suffix}", $"correcto.{suffix}@ejemplo.co");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/contactos/{id}
        var result = await client.GetFromJsonAsync<ContactoDto>($"/api/v1/contactos/{seeded.Id}");

        // THEN the returned DTO matches the seeded contact's fields
        Assert.NotNull(result);
        Assert.Equal(seeded.Id, result!.Id);
        Assert.Equal(seeded.Nombre, result.Nombre);
        Assert.Equal(seeded.Cargo, result.Cargo);
        Assert.Equal(seeded.Telefono, result.Telefono);
        Assert.Equal(seeded.Email, result.Email);
    }

    [Fact]
    public async Task GetContactoById_WithNonExistentId_ReturnsNotFound()
    {
        // GIVEN a well-formed UUID with no matching contact
        var client = _factory.CreateClient();
        var nonExistentId = Guid.NewGuid();

        // WHEN calling GET /api/v1/contactos/{id}
        var response = await client.GetAsync($"/api/v1/contactos/{nonExistentId}");

        // THEN the response is 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetContactoById_WithNonExistentId_ReturnsProblemDetailsWithoutStackTrace()
    {
        // GIVEN a well-formed UUID with no matching contact
        var client = _factory.CreateClient();
        var nonExistentId = Guid.NewGuid();

        // WHEN calling GET /api/v1/contactos/{id}
        var response = await client.GetAsync($"/api/v1/contactos/{nonExistentId}");
        var rawJson = await response.Content.ReadAsStringAsync();

        // THEN the body is RFC 7807 Problem Details shaped, with no stack trace or
        // technical leakage (NFR6)
        Assert.Contains("\"status\"", rawJson);
        Assert.DoesNotContain("StackTrace", rawJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("System.Exception", rawJson, StringComparison.OrdinalIgnoreCase);
    }

    // --- Edge cases (mirrors ClienteEndpointsTests' GetClienteById edge cases) --

    [Fact]
    public async Task GetContactoById_WithGuidEmptyRouteSegment_ReturnsNotFound()
    {
        // GIVEN the well-formed but all-zeros GUID explicitly used in the story's
        // AC #3 / TC-E3-P1-07 example — must resolve identically to any other
        // non-existent well-formed Id (404, not a routing/binding special case)
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/contactos/00000000-0000-0000-0000-000000000000
        var response = await client.GetAsync($"/api/v1/contactos/{Guid.Empty}");

        // THEN the response is 404 Not Found, same contract as any other missing Id
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetContactoById_WithMalformedGuidRouteSegment_ReturnsBadRequestNot500()
    {
        // GIVEN a route segment that is not a parseable GUID at all (route constraint
        // is `{id:guid}` — an unparsable value should fail route binding gracefully,
        // not reach application code and throw an unhandled exception)
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/contactos/not-a-guid
        var response = await client.GetAsync("/api/v1/contactos/not-a-guid");

        // THEN the request fails at routing/binding (400/404), never a 500 — the
        // :guid route constraint means this path simply doesn't match this endpoint
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task GetContactoById_ResponseUsesCamelCaseJsonPropertyNames()
    {
        // GIVEN a seeded contact
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"CamelCase Detalle Contacto {suffix}", $"camelcase.detalle.{suffix}@ejemplo.co");
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/contactos/{id}
        var response = await client.GetAsync($"/api/v1/contactos/{seeded.Id}");
        var rawJson = await response.Content.ReadAsStringAsync();

        // THEN the JSON payload exposes camelCase keys matching the frontend's Contacto interface
        Assert.Contains("\"nombre\"", rawJson);
        Assert.Contains("\"cargo\"", rawJson);
        Assert.Contains("\"telefono\"", rawJson);
        Assert.Contains("\"email\"", rawJson);
        Assert.Contains("\"clienteId\"", rawJson);
    }

    [Fact]
    public async Task GetContactoById_DoesNotReturnAContactoDeletedAfterCreation()
    {
        // GIVEN a contact that existed and was then deleted directly via the database
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var seeded = await SeedAsync($"Eliminado Endpoint Contacto {suffix}", $"eliminado.endpoint.{suffix}@ejemplo.co");
        await using (var context = CreateContext())
        {
            var toDelete = await context.Set<ContactoEntity>().FindAsync(seeded.Id);
            Assert.NotNull(toDelete);
            context.Set<ContactoEntity>().Remove(toDelete!);
            await context.SaveChangesAsync();
        }
        _createdIds.Remove(seeded.Id);
        var client = _factory.CreateClient();

        // WHEN calling GET /api/v1/contactos/{id} for the now-deleted contact
        var response = await client.GetAsync($"/api/v1/contactos/{seeded.Id}");

        // THEN the endpoint returns 404, consistent with the never-existed case
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
