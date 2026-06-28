using Microsoft.AspNetCore.Mvc.Testing;
using SiesaAgents.Application.Contactos.Commands;
using SiesaAgents.Domain.Contactos.Entities;
using SiesaAgents.Domain.Contactos.Interfaces;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Contactos;

/// <summary>
/// Tests — Story 4.2: Associate &amp; Disassociate Contacts from Client
///
/// Test IDs covered:
///   TC-E4-4-2-UNIT-BE-1 (P1) — Handler with valid contactoId + clienteId sets ClienteId, saves, returns ContactoDto
///   TC-E4-4-2-UNIT-BE-2 (P1) — Handler with clienteId = null sets ClienteId to null, saves, returns ContactoDto
///   TC-E4-4-2-UNIT-BE-3 (P1) — Handler with non-existent contactoId returns null
///   TC-E4-4-2-DOMAIN-1  (P1) — ContactoEntity.AssignCliente sets ClienteId and refreshes UpdatedAt (DateTimeOffset)
///   TC-E4-4-2-DOMAIN-2  (P1) — ContactoEntity.AssignCliente with null clears ClienteId
///   TC-E4-4-2-API-1    (P0) — PUT /api/v1/contactos/{id}/cliente with { clienteId: uuid } → 200 OK + ContactoDto
///   TC-E4-4-2-API-2    (P1) — PUT /api/v1/contactos/{id}/cliente with { clienteId: null } → 200 OK + clienteId null
///   TC-E4-4-2-API-3    (P1) — PUT /api/v1/contactos/{id}/cliente with non-existent id → 404 Problem Details
/// </summary>

// ─────────────────────────────────────────────────────────────────────────────
// Fake repository for unit testing the command handler without a real DB
// ─────────────────────────────────────────────────────────────────────────────

file sealed class FakeContactoRepository : IContactoRepository
{
    private readonly Dictionary<Guid, ContactoEntity> _store = new();
    public int SaveChangesCallCount { get; private set; }

    public void Seed(ContactoEntity contacto) => _store[contacto.Id] = contacto;

    public Task<IReadOnlyList<ContactoEntity>> GetAllAsync(CancellationToken ct = default)
        => Task.FromResult<IReadOnlyList<ContactoEntity>>(_store.Values.ToList());

    public Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => Task.FromResult(_store.TryGetValue(id, out var c) ? c : null);

    public Task AddAsync(ContactoEntity contacto, CancellationToken ct = default)
    {
        _store[contacto.Id] = contacto;
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken ct = default)
    {
        SaveChangesCallCount++;
        return Task.CompletedTask;
    }

    public Task DeleteAsync(ContactoEntity contacto, CancellationToken ct = default)
    {
        _store.Remove(contacto.Id);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(ContactoEntity contacto, CancellationToken ct = default)
        => Task.CompletedTask;
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests — AssignContactoClienteCommandHandler
// ─────────────────────────────────────────────────────────────────────────────

public class AssignContactoClienteHandlerUnitTests
{
    private const string ValidNombre = "Ana García";
    private const string ValidCargo = "Directora";
    private const string ValidTelefono = "3001234567";
    private const string ValidEmail = "ana.garcia@empresa.co";

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E4-4-2-UNIT-BE-1 (P1)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E4-4-2-UNIT-BE-1 (P1)
    /// GIVEN an existing ContactoEntity and a valid clienteId
    /// WHEN AssignContactoClienteCommandHandler.HandleAsync is called
    /// THEN the returned ContactoDto.ClienteId matches the assigned clienteId
    /// AND SaveChangesAsync is called exactly once
    /// </summary>
    [Fact]
    public async Task HandleAsync_WhenContactoExistsAndClienteIdIsValid_SetsClienteIdAndReturnsDto()
    {
        // GIVEN
        var repo = new FakeContactoRepository();
        var contacto = ContactoEntity.Create(ValidNombre, ValidCargo, ValidTelefono, ValidEmail);
        repo.Seed(contacto);

        var clienteId = Guid.NewGuid();
        var handler = new AssignContactoClienteCommandHandler(repo);
        var command = new AssignContactoClienteCommand(contacto.Id, clienteId);

        // WHEN
        var result = await handler.HandleAsync(command);

        // THEN: Result is not null and ClienteId is updated
        Assert.NotNull(result);
        Assert.Equal(clienteId, result.ClienteId);
        Assert.Equal(contacto.Id, result.Id);
        Assert.Equal(ValidNombre, result.Nombre);

        // AND: SaveChangesAsync was called once
        Assert.Equal(1, repo.SaveChangesCallCount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E4-4-2-UNIT-BE-2 (P1)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E4-4-2-UNIT-BE-2 (P1)
    /// GIVEN an existing ContactoEntity assigned to a client
    /// WHEN AssignContactoClienteCommandHandler.HandleAsync is called with clienteId = null
    /// THEN the returned ContactoDto.ClienteId is null (disassociation)
    /// AND SaveChangesAsync is called exactly once
    /// </summary>
    [Fact]
    public async Task HandleAsync_WhenClienteIdIsNull_DisassociatesContactoAndReturnsDto()
    {
        // GIVEN: Contact with an existing assignment
        var repo = new FakeContactoRepository();
        var contacto = ContactoEntity.Create(ValidNombre, ValidCargo, ValidTelefono, ValidEmail);
        contacto.AssignCliente(Guid.NewGuid());
        repo.Seed(contacto);

        var handler = new AssignContactoClienteCommandHandler(repo);
        var command = new AssignContactoClienteCommand(contacto.Id, null);

        // WHEN
        var result = await handler.HandleAsync(command);

        // THEN: ClienteId is null (disassociated)
        Assert.NotNull(result);
        Assert.Null(result.ClienteId);
        Assert.Equal(contacto.Id, result.Id);

        // AND: SaveChangesAsync was called once
        Assert.Equal(1, repo.SaveChangesCallCount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E4-4-2-UNIT-BE-3 (P1)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E4-4-2-UNIT-BE-3 (P1)
    /// GIVEN a non-existent contactoId
    /// WHEN AssignContactoClienteCommandHandler.HandleAsync is called
    /// THEN null is returned
    /// AND SaveChangesAsync is never called
    /// </summary>
    [Fact]
    public async Task HandleAsync_WhenContactoNotFound_ReturnsNull()
    {
        // GIVEN: Empty repository
        var repo = new FakeContactoRepository();
        var handler = new AssignContactoClienteCommandHandler(repo);
        var command = new AssignContactoClienteCommand(Guid.NewGuid(), Guid.NewGuid());

        // WHEN
        var result = await handler.HandleAsync(command);

        // THEN: null returned
        Assert.Null(result);

        // AND: SaveChangesAsync was NOT called
        Assert.Equal(0, repo.SaveChangesCallCount);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests — ContactoEntity.AssignCliente domain method
// ─────────────────────────────────────────────────────────────────────────────

public class ContactoEntityAssignClienteTests
{
    private const string ValidNombre = "María López";
    private const string ValidCargo = "Gerente";
    private const string ValidTelefono = "3001234567";
    private const string ValidEmail = "maria@empresa.co";

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E4-4-2-DOMAIN-1 (P1)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E4-4-2-DOMAIN-1 (P1)
    /// GIVEN a ContactoEntity with no client assigned
    /// WHEN AssignCliente is called with a valid clienteId
    /// THEN ClienteId is set to the provided value
    /// AND UpdatedAt is refreshed (strictly greater than original)
    /// AND UpdatedAt uses DateTimeOffset.UtcNow (UTC offset = zero)
    /// </summary>
    [Fact]
    public async Task AssignCliente_WhenValidClienteId_SetsClienteIdAndRefreshesUpdatedAt()
    {
        // GIVEN
        var entity = ContactoEntity.Create(ValidNombre, ValidCargo, ValidTelefono, ValidEmail);
        var originalUpdatedAt = entity.UpdatedAt;
        var clienteId = Guid.NewGuid();

        await Task.Delay(5); // Ensure measurable time difference

        // WHEN
        entity.AssignCliente(clienteId);

        // THEN: ClienteId is set
        Assert.Equal(clienteId, entity.ClienteId);

        // AND: UpdatedAt is refreshed
        Assert.True(entity.UpdatedAt > originalUpdatedAt,
            $"UpdatedAt ({entity.UpdatedAt}) should be > original ({originalUpdatedAt})");

        // AND: Uses DateTimeOffset (UTC offset must be zero — project enforcement rule)
        Assert.Equal(TimeSpan.Zero, entity.UpdatedAt.Offset);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E4-4-2-DOMAIN-2 (P1)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E4-4-2-DOMAIN-2 (P1)
    /// GIVEN a ContactoEntity assigned to a client
    /// WHEN AssignCliente is called with null
    /// THEN ClienteId is null (contact is disassociated)
    /// AND UpdatedAt is refreshed
    /// </summary>
    [Fact]
    public async Task AssignCliente_WhenCalledWithNull_ClearsClienteIdAndRefreshesUpdatedAt()
    {
        // GIVEN: Contact assigned to a client
        var entity = ContactoEntity.Create(ValidNombre, ValidCargo, ValidTelefono, ValidEmail);
        entity.AssignCliente(Guid.NewGuid());
        var updatedAtAfterAssign = entity.UpdatedAt;

        await Task.Delay(5);

        // WHEN: Disassociate
        entity.AssignCliente(null);

        // THEN: ClienteId cleared
        Assert.Null(entity.ClienteId);

        // AND: UpdatedAt refreshed
        Assert.True(entity.UpdatedAt > updatedAtAfterAssign);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// API integration tests — PUT /api/v1/contactos/{id}/cliente
// ─────────────────────────────────────────────────────────────────────────────

public class AssignContactoClienteApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public AssignContactoClienteApiTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E4-4-2-API-1 (P0)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E4-4-2-API-1 (P0)
    /// GIVEN an existing contacto and cliente (seeded via POST)
    /// WHEN PUT /api/v1/contactos/{id}/cliente with { clienteId: uuid }
    /// THEN response is 200 OK and body contains ContactoDto with updated clienteId
    /// </summary>
    [Fact]
    public async Task PutContactoCliente_WhenValidClienteId_Returns200WithUpdatedClienteId()
    {
        // GIVEN: Seed a cliente
        var ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var clientePayload = new
        {
            nombre = $"ClienteAsoc-{ts}",
            nit = $"9{ts % 100_000_000:D8}-1",
            telefono = $"310{ts % 10_000_000:D7}",
            ciudad = "Bogotá"
        };
        var clienteResp = await _client.PostAsJsonAsync("/api/v1/clientes", clientePayload);
        Assert.Equal(HttpStatusCode.Created, clienteResp.StatusCode);
        var cliente = await clienteResp.Content.ReadFromJsonAsync<ClienteResponse>();
        Assert.NotNull(cliente);

        // AND: Seed a contacto
        var contactoPayload = new
        {
            nombre = $"Contacto Asoc {ts}",
            cargo = "Analista",
            telefono = $"311{ts % 10_000_000:D7}",
            email = $"asoc.{ts}@empresa.co"
        };
        var contactoResp = await _client.PostAsJsonAsync("/api/v1/contactos", contactoPayload);
        Assert.Equal(HttpStatusCode.Created, contactoResp.StatusCode);
        var contacto = await contactoResp.Content.ReadFromJsonAsync<ContactoResponse>();
        Assert.NotNull(contacto);

        try
        {
            // WHEN: PUT /api/v1/contactos/{id}/cliente with valid clienteId
            var putPayload = new { clienteId = cliente.Id };
            var putResp = await _client.PutAsJsonAsync($"/api/v1/contactos/{contacto.Id}/cliente", putPayload);

            // THEN: 200 OK
            Assert.Equal(HttpStatusCode.OK, putResp.StatusCode);

            // AND: Body has updated clienteId
            var result = await putResp.Content.ReadFromJsonAsync<ContactoResponse>();
            Assert.NotNull(result);
            Assert.Equal(contacto.Id, result.Id);
            Assert.Equal(cliente.Id, result.ClienteId);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{contacto.Id}");
            await _client.DeleteAsync($"/api/v1/clientes/{cliente.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E4-4-2-API-2 (P1)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E4-4-2-API-2 (P1)
    /// GIVEN an existing contacto (optionally assigned)
    /// WHEN PUT /api/v1/contactos/{id}/cliente with { clienteId: null }
    /// THEN response is 200 OK and ContactoDto.clienteId is null
    /// AND contact still exists in the database (not deleted)
    /// </summary>
    [Fact]
    public async Task PutContactoCliente_WhenClienteIdIsNull_Returns200WithNullClienteId()
    {
        // GIVEN: Seed a contacto
        var ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 1;
        var contactoPayload = new
        {
            nombre = $"Contacto Desasoc {ts}",
            cargo = "Gerente",
            telefono = $"312{ts % 10_000_000:D7}",
            email = $"desasoc.{ts}@empresa.co"
        };
        var contactoResp = await _client.PostAsJsonAsync("/api/v1/contactos", contactoPayload);
        Assert.Equal(HttpStatusCode.Created, contactoResp.StatusCode);
        var contacto = await contactoResp.Content.ReadFromJsonAsync<ContactoResponse>();
        Assert.NotNull(contacto);

        try
        {
            // WHEN: PUT /api/v1/contactos/{id}/cliente with clienteId: null
            var putPayload = new { clienteId = (Guid?)null };
            var putResp = await _client.PutAsJsonAsync($"/api/v1/contactos/{contacto.Id}/cliente", putPayload);

            // THEN: 200 OK
            Assert.Equal(HttpStatusCode.OK, putResp.StatusCode);

            // AND: clienteId is null in the response
            var result = await putResp.Content.ReadFromJsonAsync<ContactoResponse>();
            Assert.NotNull(result);
            Assert.Equal(contacto.Id, result.Id);
            Assert.Null(result.ClienteId);

            // AND: Contact still exists in the DB (not deleted)
            var getResp = await _client.GetAsync($"/api/v1/contactos/{contacto.Id}");
            Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);
        }
        finally
        {
            await _client.DeleteAsync($"/api/v1/contactos/{contacto.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E4-4-2-API-3 (P1)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// TC-E4-4-2-API-3 (P1)
    /// GIVEN a non-existent contacto id (unknown UUID)
    /// WHEN PUT /api/v1/contactos/{id}/cliente with { clienteId: uuid }
    /// THEN response is 404
    /// AND body follows Problem Details RFC 7807
    /// </summary>
    [Fact]
    public async Task PutContactoCliente_WhenContactoNotFound_Returns404ProblemDetails()
    {
        // GIVEN: Unknown UUID
        var unknownId = Guid.NewGuid();
        var clienteId = Guid.NewGuid();

        // WHEN: PUT with non-existent id
        var putPayload = new { clienteId };
        var response = await _client.PutAsJsonAsync($"/api/v1/contactos/{unknownId}/cliente", putPayload);

        // THEN: 404
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // AND: Problem Details format (Content-Type includes problem+json or application/json)
        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        Assert.True(
            contentType.Contains("problem", StringComparison.OrdinalIgnoreCase) ||
            contentType.Contains("json", StringComparison.OrdinalIgnoreCase),
            $"Expected problem+json content type but got: {contentType}");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response DTOs
    // ─────────────────────────────────────────────────────────────────────────

    private sealed record ContactoResponse(
        Guid Id,
        string Nombre,
        string Cargo,
        string Telefono,
        string Email,
        Guid? ClienteId,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt
    );

    private sealed record ClienteResponse(
        Guid Id,
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt
    );
}
