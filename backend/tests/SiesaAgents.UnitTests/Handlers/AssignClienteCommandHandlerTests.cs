using SiesaAgents.Application.Contactos.Commands;
using SiesaAgents.Domain.Contactos.Entities;
using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.UnitTests.Handlers;

/// <summary>
/// Unit tests for AssignClienteToContactoCommandHandler.
///
/// Test IDs: UNIT-B-AC-01, UNIT-B-AC-02, UNIT-B-AC-03
/// </summary>
public class AssignClienteCommandHandlerTests
{
    // ---------------------------------------------------------------------------
    // UNIT-B-AC-01 (P1)
    // Given a valid contactoId and a valid clienteId
    // When AssignClienteToContactoCommandHandler.HandleAsync is called
    // Then it sets ClienteId on the contact and persists via UpdateAsync
    //   AND returns a ContactoDto with the new clienteId
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_ValidContactoAndCliente_SetsClienteIdAndReturnsDto()
    {
        // ARRANGE
        var existing = ContactoEntity.Create("María García", "Gerente", "+57 1 234 5679", "m.garcia@empresa.com");
        var clienteId = Guid.NewGuid();
        var repository = new CapturingContactoRepository(existing);
        var handler = new AssignClienteToContactoCommandHandler(repository);
        var command = new AssignClienteToContactoCommand(existing.Id, clienteId);

        // ACT
        var dto = await handler.HandleAsync(command, CancellationToken.None);

        // ASSERT — dto has correct clienteId
        Assert.Equal(clienteId, dto.ClienteId);
        Assert.Equal(existing.Id, dto.Id);
        Assert.Equal("María García", dto.Nombre);

        // AND — UpdateAsync was called exactly once
        Assert.Equal(1, repository.UpdateCallCount);
        Assert.NotNull(repository.LastUpdated);
        Assert.Equal(clienteId, repository.LastUpdated!.ClienteId);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-AC-02 (P1)
    // Given a valid contactoId and clienteId = null (disassociation)
    // When AssignClienteToContactoCommandHandler.HandleAsync is called
    // Then it sets ClienteId = null on the contact and persists via UpdateAsync
    //   AND returns a ContactoDto with clienteId = null
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_NullClienteId_DisassociatesAndReturnsDto()
    {
        // ARRANGE
        var existingClienteId = Guid.NewGuid();
        var existing = ContactoEntity.Create("Juan Pérez", "Analista", "+57 1 234 5680", "j.perez@empresa.com", existingClienteId);
        var repository = new CapturingContactoRepository(existing);
        var handler = new AssignClienteToContactoCommandHandler(repository);
        var command = new AssignClienteToContactoCommand(existing.Id, null);

        // ACT
        var dto = await handler.HandleAsync(command, CancellationToken.None);

        // ASSERT — dto.ClienteId is null (disassociated)
        Assert.Null(dto.ClienteId);
        Assert.Equal(existing.Id, dto.Id);

        // AND — UpdateAsync was called once with null ClienteId
        Assert.Equal(1, repository.UpdateCallCount);
        Assert.Null(repository.LastUpdated!.ClienteId);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-AC-03 (P1)
    // Given a non-existent contactoId
    // When AssignClienteToContactoCommandHandler.HandleAsync is called
    // Then it throws KeyNotFoundException (→ 404)
    //   AND UpdateAsync is never called
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_NonExistentContactoId_ThrowsKeyNotFoundException()
    {
        // ARRANGE — repository returns null (contact not found)
        var repository = new CapturingContactoRepository(null);
        var handler = new AssignClienteToContactoCommandHandler(repository);
        var command = new AssignClienteToContactoCommand(Guid.NewGuid(), Guid.NewGuid());

        // ACT / ASSERT
        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => handler.HandleAsync(command, CancellationToken.None)
        );

        // AND — UpdateAsync was never called
        Assert.Equal(0, repository.UpdateCallCount);
    }

    // ---------------------------------------------------------------------------
    // Fake repository
    // ---------------------------------------------------------------------------

    private sealed class CapturingContactoRepository : IContactoRepository
    {
        private readonly ContactoEntity? _existingEntity;
        public int UpdateCallCount { get; private set; }
        public ContactoEntity? LastUpdated { get; private set; }

        public CapturingContactoRepository(ContactoEntity? existingEntity)
        {
            _existingEntity = existingEntity;
        }

        public Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_existingEntity is not null && _existingEntity.Id == id
                ? _existingEntity
                : null);

        public Task<ContactoEntity> UpdateAsync(ContactoEntity entity, CancellationToken ct)
        {
            UpdateCallCount++;
            LastUpdated = entity;
            return Task.FromResult(entity);
        }

        public Task<IEnumerable<ContactoEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IEnumerable<ContactoEntity>>(Array.Empty<ContactoEntity>());

        public Task<IEnumerable<ContactoEntity>> GetByClienteIdAsync(Guid clienteId, CancellationToken ct)
            => Task.FromResult<IEnumerable<ContactoEntity>>(Array.Empty<ContactoEntity>());

        public Task<ContactoEntity> CreateAsync(ContactoEntity entity, CancellationToken ct)
            => Task.FromResult(entity);

        public Task DeleteAsync(ContactoEntity entity, CancellationToken ct)
            => Task.CompletedTask;
    }
}
