using Xunit;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class DeleteClienteCommandHandlerTests
{
    // ─────────────────────────────────────────────────────────────────────
    // Fake repository
    // ─────────────────────────────────────────────────────────────────────

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly List<ClienteEntity> _clientes;
        public bool DeleteAsyncWasCalled { get; private set; }
        public Guid? LastDeletedId { get; private set; }

        public FakeClienteRepository(IEnumerable<ClienteEntity>? existing = null)
        {
            _clientes = existing?.ToList() ?? [];
        }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IEnumerable<ClienteEntity>>(_clientes);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_clientes.FirstOrDefault(c => c.Id == id));

        public Task<ClienteEntity> CreateAsync(ClienteEntity cliente, CancellationToken ct)
        {
            _clientes.Add(cliente);
            return Task.FromResult(cliente);
        }

        public Task UpdateAsync(ClienteEntity entity, CancellationToken ct)
            => Task.CompletedTask;

        public Task<bool> DeleteAsync(Guid id, CancellationToken ct)
        {
            DeleteAsyncWasCalled = true;
            LastDeletedId = id;
            var existing = _clientes.FirstOrDefault(c => c.Id == id);
            if (existing is null) return Task.FromResult(false);
            _clientes.Remove(existing);
            return Task.FromResult(true);
        }

        public Task<bool> ExistsByNitAsync(string nit, CancellationToken ct)
            => Task.FromResult(_clientes.Any(c => c.Nit == nit));
    }

    private static DeleteClienteCommandHandler BuildHandler(FakeClienteRepository repo)
        => new DeleteClienteCommandHandler(repo);

    // ─────────────────────────────────────────────────────────────────────
    // AC2 — Successful deletion of existing client
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ExistingClient_CompletesWithoutException()
    {
        // Arrange
        var existing = ClienteEntity.Create("Empresa A", "900123456-1", "3001234567", "Bogotá");
        var repo = new FakeClienteRepository([existing]);
        var handler = BuildHandler(repo);
        var command = new DeleteClienteCommand(existing.Id);

        // Act & Assert: no exception thrown
        await handler.Handle(command, CancellationToken.None);
    }

    [Fact]
    public async Task Handle_ExistingClient_CallsDeleteAsyncWithCorrectId()
    {
        // Arrange
        var existing = ClienteEntity.Create("Empresa A", "900123456-1", "3001234567", "Bogotá");
        var repo = new FakeClienteRepository([existing]);
        var handler = BuildHandler(repo);
        var command = new DeleteClienteCommand(existing.Id);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(repo.DeleteAsyncWasCalled);
        Assert.Equal(existing.Id, repo.LastDeletedId);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC2 — Non-existent client throws NotFoundException (404 via middleware)
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_NonExistentClient_ThrowsNotFoundException()
    {
        // Arrange
        var repo = new FakeClienteRepository();
        var handler = BuildHandler(repo);
        var command = new DeleteClienteCommand(Guid.NewGuid());

        // Act & Assert: NotFoundException is thrown → middleware returns 404 Problem Details
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_NonExistentClient_StillCallsDeleteAsync()
    {
        // Arrange
        var repo = new FakeClienteRepository();
        var handler = BuildHandler(repo);
        var nonExistentId = Guid.NewGuid();
        var command = new DeleteClienteCommand(nonExistentId);

        // Act
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(command, CancellationToken.None));

        // Assert: DeleteAsync was attempted
        Assert.True(repo.DeleteAsyncWasCalled);
        Assert.Equal(nonExistentId, repo.LastDeletedId);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC2 — Empty Guid throws NotFoundException
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_EmptyGuidId_ThrowsNotFoundException()
    {
        // Arrange
        var repo = new FakeClienteRepository();
        var handler = BuildHandler(repo);
        var command = new DeleteClienteCommand(Guid.Empty);

        // Act & Assert: empty guid is not found → NotFoundException
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(command, CancellationToken.None));
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC4 — Contacts FK: ON DELETE SET NULL is DB-level (handler just deletes)
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ExistingClient_RemovesClientFromRepository()
    {
        // Arrange: two clients; delete one
        var clienteToDelete = ClienteEntity.Create("Empresa Eliminar", "900000001-1", "3000000001", "Bogotá");
        var clienteToKeep = ClienteEntity.Create("Empresa Conservar", "900000002-2", "3000000002", "Medellín");
        var repo = new FakeClienteRepository([clienteToDelete, clienteToKeep]);
        var handler = BuildHandler(repo);
        var command = new DeleteClienteCommand(clienteToDelete.Id);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert: deleted client is gone; the other remains
        var remaining = await repo.GetAllAsync(CancellationToken.None);
        Assert.DoesNotContain(remaining, c => c.Id == clienteToDelete.Id);
        Assert.Contains(remaining, c => c.Id == clienteToKeep.Id);
    }
}
