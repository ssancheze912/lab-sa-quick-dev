using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Domain.Exceptions;

namespace SiesaAgents.UnitTests.Handlers;

/// <summary>
/// Unit tests for CreateClienteCommandHandler, UpdateClienteCommandHandler, and DeleteClienteCommandHandler.
///
/// Test IDs: UNIT-B-04, UNIT-B-05, UNIT-B-06, UNIT-B-07, UNIT-B-08, UNIT-B-11
/// </summary>
public class ClienteHandlerTests
{
    // ---------------------------------------------------------------------------
    // UNIT-B-04: HandleAsync returns ClienteDto with UUID id on success
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_ValidCommand_ReturnsDtoWithUuidId()
    {
        var repository = new CapturingClienteRepository();
        var handler = new CreateClienteCommandHandler(repository);
        var command = new CreateClienteCommand("Empresa UNIT-B-04", "900100004-0", "3000000004", "Bogotá");

        var dto = await handler.HandleAsync(command, CancellationToken.None);

        Assert.NotEqual(Guid.Empty, dto.Id);
        Assert.Equal("Empresa UNIT-B-04", dto.Nombre);
        Assert.Equal("900100004-0", dto.Nit);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-05: HandleAsync throws ConflictException when NIT already exists
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_DuplicateNit_ThrowsConflictException()
    {
        var repository = new ThrowingCreateClienteRepository(new ConflictException("El NIT/RUC ya está registrado"));
        var handler = new CreateClienteCommandHandler(repository);
        var command = new CreateClienteCommand("Empresa UNIT-B-05", "DUPNIT-05", "3000000005", "Medellín");

        var ex = await Assert.ThrowsAsync<ConflictException>(
            () => handler.HandleAsync(command, CancellationToken.None));

        Assert.Contains("NIT/RUC", ex.Message);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-07: UpdateClienteHandler returns updated ClienteDto when client exists
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task UpdateHandleAsync_ExistingClient_ReturnsUpdatedDto()
    {
        var existing = ClienteEntity.Create("Original", "900000007-0", "3001234567", "Bogotá");
        var repository = new UpdatableClienteRepository(existing);
        var handler = new UpdateClienteCommandHandler(repository);
        var command = new UpdateClienteCommand(existing.Id, "Actualizado", "900000007-0", "3009999999", "Medellín");

        var dto = await handler.HandleAsync(command, CancellationToken.None);

        Assert.Equal(existing.Id, dto.Id);
        Assert.Equal("Actualizado", dto.Nombre);
        Assert.Equal("Medellín", dto.Ciudad);
        Assert.Equal("3009999999", dto.Telefono);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-08: UpdateClienteHandler throws KeyNotFoundException when client not found
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task UpdateHandleAsync_NotExistingClient_ThrowsKeyNotFoundException()
    {
        var repository = new CapturingClienteRepository(); // GetByIdAsync returns null
        var handler = new UpdateClienteCommandHandler(repository);
        var command = new UpdateClienteCommand(Guid.NewGuid(), "Nombre", "900000008-0", "3001234567", "Cali");

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => handler.HandleAsync(command, CancellationToken.None));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-06: DeleteClienteHandler does not throw when deleting client with 0 contacts
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task DeleteHandleAsync_ExistingClientNoContacts_CompletesWithoutException()
    {
        var existing = ClienteEntity.Create("Empresa UNIT-B-06", "900000006-0", "3001234567", "Bogotá");
        var repository = new DeletableClienteRepository(existing);
        var handler = new DeleteClienteCommandHandler(repository);
        var command = new DeleteClienteCommand(existing.Id);

        // Should complete without throwing
        await handler.HandleAsync(command, CancellationToken.None);

        Assert.True(repository.DeleteWasCalled);
        Assert.Equal(existing.Id, repository.DeletedId);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-11: DeleteClienteHandler throws KeyNotFoundException when client ID does not exist
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task DeleteHandleAsync_NotExistingClient_ThrowsKeyNotFoundException()
    {
        var repository = new CapturingClienteRepository(); // GetByIdAsync returns null
        var handler = new DeleteClienteCommandHandler(repository);
        var command = new DeleteClienteCommand(Guid.NewGuid());

        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
            () => handler.HandleAsync(command, CancellationToken.None));

        Assert.Contains("No existe un cliente", ex.Message);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-12: DeleteClienteHandler — KeyNotFoundException message contains the client ID
    // Edge case: error message must be informative enough for Problem Details mapping
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task DeleteHandleAsync_NotExistingClient_ExceptionMessageContainsId()
    {
        var targetId = Guid.NewGuid();
        var repository = new CapturingClienteRepository();
        var handler = new DeleteClienteCommandHandler(repository);
        var command = new DeleteClienteCommand(targetId);

        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
            () => handler.HandleAsync(command, CancellationToken.None));

        Assert.Contains(targetId.ToString(), ex.Message);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-13: DeleteClienteHandler — GetByIdAsync is called BEFORE DeleteAsync
    // Order contract: handler must check existence before issuing the delete
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task DeleteHandleAsync_ExistingClient_CallsGetByIdBeforeDelete()
    {
        var existing = ClienteEntity.Create("Empresa UNIT-B-13", "900000013-0", "3001234567", "Cali");
        var repository = new OrderTrackingClienteRepository(existing);
        var handler = new DeleteClienteCommandHandler(repository);
        var command = new DeleteClienteCommand(existing.Id);

        await handler.HandleAsync(command, CancellationToken.None);

        Assert.True(repository.GetByIdCalledBeforeDelete,
            "GetByIdAsync must be called before DeleteAsync to validate existence.");
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-14: DeleteClienteHandler — DeleteAsync is NOT called when client does not exist
    // Error path: repository delete must not be invoked for a missing record
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task DeleteHandleAsync_NotExistingClient_DeleteAsyncNotCalled()
    {
        var repository = new CapturingClienteRepository();
        var handler = new DeleteClienteCommandHandler(repository);
        var command = new DeleteClienteCommand(Guid.NewGuid());

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => handler.HandleAsync(command, CancellationToken.None));

        Assert.False(repository.DeleteWasCalled,
            "DeleteAsync must not be called when the client does not exist.");
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-15: DeleteClienteHandler — CancellationToken is propagated to GetByIdAsync
    // Boundary: handler must not swallow a cancelled operation
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task DeleteHandleAsync_CancelledToken_PropagatesCancellation()
    {
        var existing = ClienteEntity.Create("Empresa UNIT-B-15", "900000015-0", "3001234567", "Bogotá");
        var repository = new CancellationAwareDeletableRepository(existing);
        var handler = new DeleteClienteCommandHandler(repository);
        var command = new DeleteClienteCommand(existing.Id);

        using var cts = new CancellationTokenSource();
        cts.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => handler.HandleAsync(command, cts.Token));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-16: DeleteClienteHandler — Guid.Empty as id throws KeyNotFoundException
    // Boundary: all non-existent IDs (including zero-value GUID) should yield not-found
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task DeleteHandleAsync_EmptyGuidId_ThrowsKeyNotFoundException()
    {
        var repository = new CapturingClienteRepository(); // always returns null
        var handler = new DeleteClienteCommandHandler(repository);
        var command = new DeleteClienteCommand(Guid.Empty);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => handler.HandleAsync(command, CancellationToken.None));
    }

    // ---------------------------------------------------------------------------
    // Fakes
    // ---------------------------------------------------------------------------

    private sealed class CapturingClienteRepository : IClienteRepository
    {
        public bool DeleteWasCalled { get; private set; }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IEnumerable<ClienteEntity>>(Array.Empty<ClienteEntity>());

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult<ClienteEntity?>(null);

        public Task CreateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task DeleteAsync(Guid id, CancellationToken ct)
        {
            DeleteWasCalled = true;
            return Task.CompletedTask;
        }
    }

    private sealed class ThrowingCreateClienteRepository : IClienteRepository
    {
        private readonly Exception _exception;

        public ThrowingCreateClienteRepository(Exception exception)
        {
            _exception = exception;
        }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IEnumerable<ClienteEntity>>(Array.Empty<ClienteEntity>());

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult<ClienteEntity?>(null);

        public Task CreateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.FromException(_exception);

        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task DeleteAsync(Guid id, CancellationToken ct)
            => Task.CompletedTask;
    }

    private sealed class UpdatableClienteRepository : IClienteRepository
    {
        private readonly ClienteEntity _entity;

        public UpdatableClienteRepository(ClienteEntity entity)
        {
            _entity = entity;
        }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IEnumerable<ClienteEntity>>(new[] { _entity });

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult<ClienteEntity?>(_entity.Id == id ? _entity : null);

        public Task CreateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task DeleteAsync(Guid id, CancellationToken ct)
            => Task.CompletedTask;
    }

    private sealed class DeletableClienteRepository : IClienteRepository
    {
        private readonly ClienteEntity _entity;

        public bool DeleteWasCalled { get; private set; }
        public Guid DeletedId { get; private set; }

        public DeletableClienteRepository(ClienteEntity entity)
        {
            _entity = entity;
        }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IEnumerable<ClienteEntity>>(new[] { _entity });

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult<ClienteEntity?>(_entity.Id == id ? _entity : null);

        public Task CreateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task DeleteAsync(Guid id, CancellationToken ct)
        {
            DeleteWasCalled = true;
            DeletedId = id;
            return Task.CompletedTask;
        }
    }

    /// <summary>
    /// Tracks call order to verify GetByIdAsync is invoked before DeleteAsync.
    /// Used by UNIT-B-13.
    /// </summary>
    private sealed class OrderTrackingClienteRepository : IClienteRepository
    {
        private readonly ClienteEntity _entity;
        private readonly List<string> _callOrder = new();

        public bool GetByIdCalledBeforeDelete =>
            _callOrder.IndexOf("GetById") < _callOrder.IndexOf("Delete")
            && _callOrder.Contains("GetById")
            && _callOrder.Contains("Delete");

        public OrderTrackingClienteRepository(ClienteEntity entity)
        {
            _entity = entity;
        }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IEnumerable<ClienteEntity>>(new[] { _entity });

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
        {
            _callOrder.Add("GetById");
            return Task.FromResult<ClienteEntity?>(_entity.Id == id ? _entity : null);
        }

        public Task CreateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task DeleteAsync(Guid id, CancellationToken ct)
        {
            _callOrder.Add("Delete");
            return Task.CompletedTask;
        }
    }

    /// <summary>
    /// Throws OperationCanceledException when a cancelled CancellationToken is observed.
    /// Used by UNIT-B-15.
    /// </summary>
    private sealed class CancellationAwareDeletableRepository : IClienteRepository
    {
        private readonly ClienteEntity _entity;

        public CancellationAwareDeletableRepository(ClienteEntity entity)
        {
            _entity = entity;
        }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();
            return Task.FromResult<IEnumerable<ClienteEntity>>(new[] { _entity });
        }

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();
            return Task.FromResult<ClienteEntity?>(_entity.Id == id ? _entity : null);
        }

        public Task CreateAsync(ClienteEntity cliente, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();
            return Task.CompletedTask;
        }

        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Guid id, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();
            return Task.CompletedTask;
        }
    }
}
