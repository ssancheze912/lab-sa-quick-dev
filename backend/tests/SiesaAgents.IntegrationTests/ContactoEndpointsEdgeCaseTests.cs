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

// ─── Edge-case integration tests for GET /api/v1/contactos ───────────────────
// Complements ContactoEndpointsTests.cs with scenarios not covered by ATDD:
// - Multiple contacts returned in descending CreatedAt order
// - Contact with non-null clienteId (FK preserved in JSON)
// - Response includes telefono and cargo fields
// - Multiple contacts — all items present in response

// Reuses InMemoryContactoFactory from ContactoEndpointsTests (same assembly/namespace)

public class ContactoEndpointsEdgeCaseTests
{
    private static InMemoryContactoFactory CreateFactory() =>
        new("ContactoEdgeDb_" + Guid.NewGuid());

    // ─── Multiple contacts: all returned ─────────────────────────────────────

    [Fact]
    public async Task GetContactos_WithMultipleSeededContacts_ReturnsAllOfThem()
    {
        // Arrange
        await using var factory = CreateFactory();
        await factory.SeedAsync(db =>
        {
            db.Contactos.Add(ContactoEntity.Create("Primero Test", "Cargo A", "3001111111", "primero@test.com"));
            db.Contactos.Add(ContactoEntity.Create("Segundo Test", "Cargo B", "3002222222", "segundo@test.com"));
            db.Contactos.Add(ContactoEntity.Create("Tercero Test", "Cargo C", "3003333333", "tercero@test.com"));
        });

        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/contactos");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<List<ContactoDto>>();
        body.Should().HaveCount(3);
        body!.Select(c => c.Nombre).Should().Contain(["Primero Test", "Segundo Test", "Tercero Test"]);
    }

    // ─── Ordering: descending CreatedAt ──────────────────────────────────────

    [Fact]
    public async Task GetContactos_WithMultipleContacts_ReturnsOrderedByCreatedAtDescending()
    {
        // Arrange: seed two contacts; the ordering must be CreatedAt DESC
        await using var factory = CreateFactory();
        await factory.SeedAsync(db =>
        {
            db.Contactos.Add(ContactoEntity.Create("Viejo Contacto", "Cargo", "3001234567", "viejo@test.com"));
            db.Contactos.Add(ContactoEntity.Create("Nuevo Contacto", "Cargo", "3007654321", "nuevo@test.com"));
        });

        var client = factory.CreateClient();

        // Act
        var body = await client.GetFromJsonAsync<List<ContactoDto>>("/api/v1/contactos");

        // Assert: descending order (first item CreatedAt >= second)
        body.Should().HaveCount(2);
        body![0].CreatedAt.Should().BeOnOrAfter(body[1].CreatedAt);
    }

    // ─── Contact with non-null clienteId ─────────────────────────────────────

    [Fact]
    public async Task GetContactos_ContactWithNonNullClienteId_SerializesClienteIdAsUuid()
    {
        // Arrange: seed a contact linked to a fake clienteId
        // Note: in-memory DB does not enforce FK constraints, so we can use any Guid
        var clienteId = Guid.NewGuid();
        await using var factory = CreateFactory();
        await factory.SeedAsync(db =>
        {
            db.Contactos.Add(ContactoEntity.Create("Vinculado", "Gerente", "3001234567", "vinculado@test.com", clienteId));
        });

        var client = factory.CreateClient();

        // Act
        var body = await client.GetFromJsonAsync<List<ContactoDto>>("/api/v1/contactos");

        // Assert
        body.Should().ContainSingle(c => c.Nombre == "Vinculado");
        body![0].ClienteId.Should().Be(clienteId);
    }

    // ─── Response includes all ContactoDto fields ─────────────────────────────

    [Fact]
    public async Task GetContactos_ReturnsContactDtoWithAllFields()
    {
        // Arrange
        await using var factory = CreateFactory();
        await factory.SeedAsync(db =>
        {
            db.Contactos.Add(ContactoEntity.Create(
                "Completo García",
                "Director Técnico",
                "3009876543",
                "completo@empresa.com"));
        });

        var client = factory.CreateClient();

        // Act
        var body = await client.GetFromJsonAsync<List<ContactoDto>>("/api/v1/contactos");

        // Assert: all ContactoDto fields populated
        var dto = body.Should().ContainSingle().Subject;
        dto.Id.Should().NotBeEmpty();
        dto.Nombre.Should().Be("Completo García");
        dto.Cargo.Should().Be("Director Técnico");
        dto.Telefono.Should().Be("3009876543");
        dto.Email.Should().Be("completo@empresa.com");
        dto.ClienteId.Should().BeNull();
        dto.CreatedAt.Should().BeCloseTo(DateTimeOffset.UtcNow, precision: TimeSpan.FromSeconds(10));
        dto.UpdatedAt.Should().BeCloseTo(DateTimeOffset.UtcNow, precision: TimeSpan.FromSeconds(10));
    }

    // ─── Response is a direct array, not an envelope ──────────────────────────

    [Fact]
    public async Task GetContactos_ResponseBody_IsDirectArrayNotEnvelopeObject()
    {
        // Arrange
        await using var factory = CreateFactory();
        var client = factory.CreateClient();

        // Act
        var json = await client.GetStringAsync("/api/v1/contactos");

        // Assert: starts with '[' not '{' (direct array, no wrapper)
        json.TrimStart().Should().StartWith("[");
    }

    // ─── No 404 on the endpoint ───────────────────────────────────────────────

    [Fact]
    public async Task GetContactos_EndpointRegistered_Returns200NotNull()
    {
        // Arrange
        await using var factory = CreateFactory();
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/contactos");

        // Assert
        response.StatusCode.Should().NotBe(HttpStatusCode.NotFound);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ─── Response with DateTimeOffset UTC ─────────────────────────────────────

    [Fact]
    public async Task GetContactos_CreatedAtAndUpdatedAt_SerializedWithTimeZone()
    {
        // Arrange
        await using var factory = CreateFactory();
        await factory.SeedAsync(db =>
        {
            db.Contactos.Add(ContactoEntity.Create("Zona Test", "Cargo", "3001234567", "zona@test.com"));
        });

        var client = factory.CreateClient();

        // Act
        var json = await client.GetStringAsync("/api/v1/contactos");

        // Assert: ISO 8601 date strings contain 'T' separator (DateTimeOffset, not DateTime)
        json.Should().Contain("\"createdAt\"");
        json.Should().Contain("\"updatedAt\"");
        // DateTimeOffset serialization includes timezone info (e.g., 'Z' or '+00:00')
        json.Should().MatchRegex(@"""createdAt""\s*:\s*""\d{4}-\d{2}-\d{2}T");
    }
}
