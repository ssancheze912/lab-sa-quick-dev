/**
 * Story 2.4: PUT /api/v1/clientes/{id} — Integration Tests (ATDD RED Phase)
 * Tests intentionally fail until the PUT endpoint is implemented.
 *
 * Acceptance Criteria covered:
 * - AC2: PUT returns 200 OK with updated ClienteDto on valid payload
 * - AC3: PUT returns 400 Bad Request (Problem Details) when required fields are empty
 * - AC2: GET after PUT shows updated values (immediate reflection)
 * - AC2: Response includes camelCase fields and updated updatedAt timestamp
 * - AC5: PUT returns 404 Not Found when client ID does not exist
 *
 * Note on AC6 (409): InMemory EF provider does not enforce unique constraints.
 * The 409 path is covered at unit level in UpdateClienteCommandHandlerTests
 * and must be validated with a real PostgreSQL container in future integration runs.
 *
 * Framework: xUnit + WebApplicationFactory (InMemoryClienteFactory) + FluentAssertions
 */

using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using Xunit;

namespace SiesaAgents.IntegrationTests;

public class UpdateClienteEndpointTests
{
    private static InMemoryClienteFactory CreateFactory() =>
        new("UpdateClienteDb_" + Guid.NewGuid());

    // ─── AC2: 200 OK with updated ClienteDto ─────────────────────────────────

    [Fact]
    public async Task PutCliente_Returns200Ok_WithUpdatedClienteDtoBody_OnValidPayload()
    {
        // Arrange — GIVEN: An existing client seeded in the database
        await using var factory = CreateFactory();
        ClienteEntity? seededCliente = null;

        await factory.SeedAsync(db =>
        {
            seededCliente = ClienteEntity.Create("Empresa Original S.A.", "900123456-7", "6011234567", "Bogotá");
            db.Clientes.Add(seededCliente);
        });

        var client = factory.CreateClient();
        var payload = new
        {
            nombre = "Empresa Actualizada S.A.",
            nit = "900999888-7",
            telefono = "6019876543",
            ciudad = "Medellín",
        };

        // Act — WHEN: PUT /api/v1/clientes/{id} is called with valid data
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seededCliente!.Id}", payload);

        // Assert — THEN: 200 OK with updated ClienteDto
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<ClienteDto>();
        body.Should().NotBeNull();
        body!.Id.Should().Be(seededCliente.Id);
        body.Nombre.Should().Be("Empresa Actualizada S.A.");
        body.Nit.Should().Be("900999888-7");
        body.Telefono.Should().Be("6019876543");
        body.Ciudad.Should().Be("Medellín");
    }

    [Fact]
    public async Task PutCliente_ResponseContainsCamelCaseFields()
    {
        // Arrange — GIVEN: An existing client
        await using var factory = CreateFactory();
        ClienteEntity? seededCliente = null;

        await factory.SeedAsync(db =>
        {
            seededCliente = ClienteEntity.Create("CamelCase Corp", "111111111-1", "3001234567", "Cali");
            db.Clientes.Add(seededCliente);
        });

        var client = factory.CreateClient();
        var payload = new { nombre = "CamelCase Updated", nit = "111111111-2", telefono = "3001234567", ciudad = "Cali" };

        // Act — WHEN: PUT is called
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seededCliente!.Id}", payload);

        // Assert — THEN: Response JSON uses camelCase property names
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadAsStringAsync();
        json.Should().Contain("\"nombre\"");
        json.Should().Contain("\"nit\"");
        json.Should().Contain("\"createdAt\"");
        json.Should().Contain("\"updatedAt\"");
    }

    [Fact]
    public async Task PutCliente_UpdatedAtTimestampIsRefreshed()
    {
        // Arrange — GIVEN: An existing client with a known createdAt
        await using var factory = CreateFactory();
        ClienteEntity? seededCliente = null;

        await factory.SeedAsync(db =>
        {
            seededCliente = ClienteEntity.Create("Empresa S.A.", "222222222-2", "3009876543", "Medellín");
            db.Clientes.Add(seededCliente);
        });

        var client = factory.CreateClient();
        var originalUpdatedAt = seededCliente!.UpdatedAt;

        var payload = new { nombre = "Empresa Actualizada", nit = "222222222-2", telefono = "3009876543", ciudad = "Medellín" };

        // Act — WHEN: PUT is called
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seededCliente.Id}", payload);

        // Assert — THEN: UpdatedAt in response is not before the original (it was refreshed)
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ClienteDto>();
        body.Should().NotBeNull();
        body!.UpdatedAt.Should().BeOnOrAfter(originalUpdatedAt);
    }

    [Fact]
    public async Task PutCliente_ReturnsApplicationJson_ContentType()
    {
        // Arrange
        await using var factory = CreateFactory();
        ClienteEntity? seededCliente = null;

        await factory.SeedAsync(db =>
        {
            seededCliente = ClienteEntity.Create("Content Type Corp", "333333333-3", "3109876543", "Bogotá");
            db.Clientes.Add(seededCliente);
        });

        var client = factory.CreateClient();
        var payload = new { nombre = "Content Type Updated", nit = "333333333-3", telefono = "3109876543", ciudad = "Bogotá" };

        // Act
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seededCliente!.Id}", payload);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    // ─── AC2: Updated client reflects new values in GET after PUT ────────────

    [Fact]
    public async Task PutCliente_UpdatedClientReflectsNewValues_WhenFetchedAfterUpdate()
    {
        // Arrange — GIVEN: An existing client
        await using var factory = CreateFactory();
        ClienteEntity? seededCliente = null;

        await factory.SeedAsync(db =>
        {
            seededCliente = ClienteEntity.Create("Before Update Corp", "444444444-4", "3219876543", "Cali");
            db.Clientes.Add(seededCliente);
        });

        var client = factory.CreateClient();
        var payload = new { nombre = "After Update Corp", nit = "444444444-5", telefono = "3219876543", ciudad = "Bogotá" };

        // Act — WHEN: PUT updates the client
        var putResponse = await client.PutAsJsonAsync($"/api/v1/clientes/{seededCliente!.Id}", payload);
        putResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // AND: GET is called for the same client
        var getResponse = await client.GetAsync($"/api/v1/clientes/{seededCliente.Id}");

        // Assert — THEN: GET returns the updated values (FR27 — immediate reflection)
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await getResponse.Content.ReadFromJsonAsync<ClienteDto>();
        body.Should().NotBeNull();
        body!.Nombre.Should().Be("After Update Corp");
        body.Nit.Should().Be("444444444-5");
        body.Ciudad.Should().Be("Bogotá");
    }

    // ─── AC3: 400 Bad Request — empty required fields ────────────────────────

    [Fact]
    public async Task PutCliente_Returns400_WhenRequiredFieldsAreEmpty()
    {
        // Arrange — GIVEN: An existing client and an invalid payload (empty strings)
        await using var factory = CreateFactory();
        ClienteEntity? seededCliente = null;

        await factory.SeedAsync(db =>
        {
            seededCliente = ClienteEntity.Create("Empresa S.A.", "555555555-5", "6011234567", "Bogotá");
            db.Clientes.Add(seededCliente);
        });

        var client = factory.CreateClient();
        var payload = new { nombre = "", nit = "", telefono = "", ciudad = "" };

        // Act — WHEN: PUT is called with empty fields
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seededCliente!.Id}", payload);

        // Assert — THEN: 400 Bad Request with Problem Details RFC 7807
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");

        var json = await response.Content.ReadAsStringAsync();
        json.Should().Contain("400");
    }

    [Fact]
    public async Task PutCliente_Returns400_WhenFieldsAreWhitespaceOnly()
    {
        // Arrange — GIVEN: An existing client and whitespace-only payload
        await using var factory = CreateFactory();
        ClienteEntity? seededCliente = null;

        await factory.SeedAsync(db =>
        {
            seededCliente = ClienteEntity.Create("Empresa S.A.", "666666666-6", "6011234567", "Bogotá");
            db.Clientes.Add(seededCliente);
        });

        var client = factory.CreateClient();
        var payload = new { nombre = "   ", nit = "   ", telefono = "   ", ciudad = "   " };

        // Act — WHEN: PUT is called with whitespace fields
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{seededCliente!.Id}", payload);

        // Assert — THEN: 400 Bad Request (FluentValidation NotEmpty trims whitespace)
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var json = await response.Content.ReadAsStringAsync();
        json.Should().Contain("400");
    }

    // ─── AC5: 404 Not Found — client does not exist ───────────────────────────

    [Fact]
    public async Task PutCliente_Returns404WithProblemDetails_WhenClientDoesNotExist()
    {
        // Arrange — GIVEN: An empty database and a random unknown ID
        await using var factory = CreateFactory();
        var client = factory.CreateClient();
        var unknownId = Guid.NewGuid();
        var payload = new { nombre = "Empresa", nit = "900123456-7", telefono = "6011234567", ciudad = "Bogotá" };

        // Act — WHEN: PUT is called for a non-existent client
        var response = await client.PutAsJsonAsync($"/api/v1/clientes/{unknownId}", payload);

        // Assert — THEN: 404 Not Found with Problem Details RFC 7807
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");

        var json = await response.Content.ReadAsStringAsync();
        json.Should().Contain("404");
    }

    // NOTE: AC6 — PUT /api/v1/clientes/{id} returns 409 Conflict when NIT already belongs to a
    // different client. This path CANNOT be tested with InMemory EF (no unique constraint enforcement).
    // It is covered at unit level in UpdateClienteCommandHandlerTests and requires a PostgreSQL
    // test container for full integration validation. See Story 2.3 note for precedent.
}
