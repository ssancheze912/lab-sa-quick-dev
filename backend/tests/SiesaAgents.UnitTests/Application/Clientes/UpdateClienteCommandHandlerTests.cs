// ─────────────────────────────────────────────────────────────────────────────
// ATDD — Story 2.4: Edit Client
// Test Level: Unit (xUnit)
// Phase: GREEN — tests pass with UpdateClienteCommandHandler implementation
//
// Acceptance Criteria covered:
//   AC2 — PUT /api/v1/clientes/{id} updates entity and returns ClienteDto
//   AC5 — Throws ConflictException when NIT belongs to different client
//   AC1 — Throws NotFoundException when client ID not found
//
// Pattern: Arrange / Act / Assert (AAA)
// ─────────────────────────────────────────────────────────────────────────────

using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Common.Exceptions;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Unit tests for UpdateClienteCommandHandler.
/// Repository is mocked via an in-memory stub — no EF Core, no Postgres.
/// </summary>
public class UpdateClienteCommandHandlerTests
{
    // ──────────────────────────────────────────────────────────────────────────
    // Stub repository
    // ──────────────────────────────────────────────────────────────────────────

    private sealed class StubClienteRepository : IClienteRepository
    {
        private readonly List<ClienteEntity> _store;
        public ClienteEntity? LastUpdated { get; private set; }

        public StubClienteRepository(IEnumerable<ClienteEntity>? seed = null)
            => _store = seed?.ToList() ?? [];

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
            => Task.FromResult<IEnumerable<ClienteEntity>>(_store);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
            => Task.FromResult<ClienteEntity?>(_store.FirstOrDefault(e => e.Id == id));

        public Task<ClienteEntity?> GetByNitAsync(string nit, CancellationToken ct = default)
            => Task.FromResult<ClienteEntity?>(_store.FirstOrDefault(e => e.Nit == nit));

        public Task AddAsync(ClienteEntity entity, CancellationToken ct = default)
        {
            _store.Add(entity);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(ClienteEntity entity, CancellationToken ct = default)
        {
            LastUpdated = entity;
            return Task.CompletedTask;
        }

        public Task DeleteAsync(ClienteEntity entity, CancellationToken ct = default)
        {
            _store.Remove(entity);
            return Task.CompletedTask;
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helper factory
    // ──────────────────────────────────────────────────────────────────────────

    private static ClienteEntity MakeCliente(
        string nombre = "Empresa Original",
        string nit = "900123456-1",
        string telefono = "3001234567",
        string ciudad = "Bogotá")
        => ClienteEntity.Create(nombre, nit, telefono, ciudad);

    // ──────────────────────────────────────────────────────────────────────────
    // AC2 — Updates entity and returns ClienteDto when data is valid
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC2 — Handle updates entity and returns ClienteDto when data is valid")]
    public async Task Handle_ValidData_UpdatesEntityAndReturnsDto()
    {
        // ARRANGE
        var entity = MakeCliente();
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new UpdateClienteCommandHandler(repository);
        var command = new UpdateClienteCommand(entity.Id, "Empresa Actualizada", entity.Nit, "3009876543", "Medellín");

        // ACT
        var result = await handler.Handle(command, CancellationToken.None);

        // ASSERT: Returns ClienteDto with updated values
        Assert.NotNull(result);
        Assert.IsType<ClienteDto>(result);
        Assert.Equal("Empresa Actualizada", result.Nombre);
        Assert.Equal("3009876543", result.Telefono);
        Assert.Equal("Medellín", result.Ciudad);
        Assert.Equal(entity.Id, result.Id);
    }

    [Fact(DisplayName = "AC2 — Handle calls repository.UpdateAsync with the modified entity")]
    public async Task Handle_ValidData_CallsRepositoryUpdateAsync()
    {
        // ARRANGE
        var entity = MakeCliente();
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new UpdateClienteCommandHandler(repository);
        var command = new UpdateClienteCommand(entity.Id, "Nuevo Nombre", entity.Nit, entity.Telefono, entity.Ciudad);

        // ACT
        await handler.Handle(command, CancellationToken.None);

        // ASSERT: UpdateAsync was called with the entity
        Assert.NotNull(repository.LastUpdated);
        Assert.Equal(entity.Id, repository.LastUpdated.Id);
    }

    [Fact(DisplayName = "AC2 — Handle returns ClienteDto with DateTimeOffset UpdatedAt (not default)")]
    public async Task Handle_ValidData_ReturnsDtoWithNonDefaultUpdatedAt()
    {
        // ARRANGE
        var entity = MakeCliente();
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new UpdateClienteCommandHandler(repository);
        var command = new UpdateClienteCommand(entity.Id, "Updated", entity.Nit, entity.Telefono, entity.Ciudad);

        // ACT
        var result = await handler.Handle(command, CancellationToken.None);

        // ASSERT: UpdatedAt is set (not default)
        Assert.NotEqual(default(DateTimeOffset), result.UpdatedAt);
    }

    [Fact(DisplayName = "AC2 — Handle allows same NIT when updating the same client (no conflict)")]
    public async Task Handle_SameNitSameClient_DoesNotThrowConflict()
    {
        // ARRANGE: Client exists; updating with the same NIT it already has
        var entity = MakeCliente(nit: "900123456-1");
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new UpdateClienteCommandHandler(repository);
        var command = new UpdateClienteCommand(entity.Id, "Nuevo Nombre", "900123456-1", entity.Telefono, entity.Ciudad);

        // ACT + ASSERT: No ConflictException — same client can keep its NIT
        var exception = await Record.ExceptionAsync(
            () => handler.Handle(command, CancellationToken.None));
        Assert.Null(exception);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC1 — Throws NotFoundException when client ID not found
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC1 — Handle throws NotFoundException when client ID does not exist")]
    public async Task Handle_NonExistentId_ThrowsNotFoundException()
    {
        // ARRANGE: Empty repository
        var repository = new StubClienteRepository();
        var handler = new UpdateClienteCommandHandler(repository);
        var nonExistentId = Guid.NewGuid();
        var command = new UpdateClienteCommand(nonExistentId, "Nombre", "111111111-1", "3001234567", "Bogotá");

        // ACT + ASSERT: NotFoundException is thrown (maps to 404)
        await Assert.ThrowsAsync<NotFoundException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact(DisplayName = "AC1 — NotFoundException message contains the non-existent client ID")]
    public async Task Handle_NonExistentId_ExceptionMessageContainsId()
    {
        // ARRANGE
        var repository = new StubClienteRepository();
        var handler = new UpdateClienteCommandHandler(repository);
        var nonExistentId = Guid.NewGuid();
        var command = new UpdateClienteCommand(nonExistentId, "Nombre", "111111111-1", "3001234567", "Bogotá");

        // ACT
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => handler.Handle(command, CancellationToken.None));

        // ASSERT: Message mentions the ID for Problem Details context
        Assert.Contains(nonExistentId.ToString(), exception.Message);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AC5 — Throws ConflictException when NIT belongs to different client
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "AC5 — Handle throws ConflictException when new NIT belongs to a different client")]
    public async Task Handle_NitBelongsToDifferentClient_ThrowsConflictException()
    {
        // ARRANGE: Two clients; second client tries to use first client's NIT
        var existingClient = MakeCliente("Cliente A", "900000001-1");
        var targetClient = MakeCliente("Cliente B", "900000002-2");
        var repository = new StubClienteRepository(new[] { existingClient, targetClient });
        var handler = new UpdateClienteCommandHandler(repository);
        var command = new UpdateClienteCommand(targetClient.Id, "Cliente B Updated", "900000001-1", "3001234567", "Cali");

        // ACT + ASSERT: ConflictException thrown because "900000001-1" belongs to existingClient
        await Assert.ThrowsAsync<ConflictException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact(DisplayName = "AC5 — ConflictException message contains the conflicting NIT")]
    public async Task Handle_NitBelongsToDifferentClient_ExceptionMessageContainsNit()
    {
        // ARRANGE
        var existingClient = MakeCliente("Cliente A", "900000001-1");
        var targetClient = MakeCliente("Cliente B", "900000002-2");
        var repository = new StubClienteRepository(new[] { existingClient, targetClient });
        var handler = new UpdateClienteCommandHandler(repository);
        var command = new UpdateClienteCommand(targetClient.Id, "Cliente B", "900000001-1", "3001234567", "Cali");

        // ACT
        var exception = await Assert.ThrowsAsync<ConflictException>(
            () => handler.Handle(command, CancellationToken.None));

        // ASSERT: Message contains the conflicting NIT
        Assert.Contains("900000001-1", exception.Message);
    }

    [Fact(DisplayName = "AC5 — Handle does NOT call UpdateAsync when NIT conflict is detected")]
    public async Task Handle_NitConflict_DoesNotCallUpdateAsync()
    {
        // ARRANGE
        var existingClient = MakeCliente("Cliente A", "900000001-1");
        var targetClient = MakeCliente("Cliente B", "900000002-2");
        var repository = new StubClienteRepository(new[] { existingClient, targetClient });
        var handler = new UpdateClienteCommandHandler(repository);
        var command = new UpdateClienteCommand(targetClient.Id, "Cliente B", "900000001-1", "3001234567", "Cali");

        // ACT: Catch the expected exception
        await Record.ExceptionAsync(() => handler.Handle(command, CancellationToken.None));

        // ASSERT: UpdateAsync was never called
        Assert.Null(repository.LastUpdated);
    }
}
