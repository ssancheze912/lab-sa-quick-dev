using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Domain.Exceptions;

namespace SiesaAgents.UnitTests.Handlers;

/// <summary>
/// Unit tests for CreateClienteCommandHandler and UpdateClienteCommandHandler.
///
/// Test IDs: UNIT-B-04, UNIT-B-05, UNIT-B-07, UNIT-B-08
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
    // UNIT-B-11 (edge): UpdateClienteHandler throws ValidationException BEFORE
    //   attempting repository lookup when command is invalid — no repository call.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task UpdateHandleAsync_InvalidCommand_ThrowsValidationExceptionBeforeRepositoryCall()
    {
        var repository = new TrackingGetByIdRepository();
        var handler = new UpdateClienteCommandHandler(repository);
        // Empty Nombre triggers ValidationException from the validator
        var command = new UpdateClienteCommand(Guid.NewGuid(), string.Empty, "900000011-0", "3001234567", "Bogotá");

        await Assert.ThrowsAsync<FluentValidation.ValidationException>(
            () => handler.HandleAsync(command, CancellationToken.None));

        // GetByIdAsync must NOT have been called (guard-early pattern)
        Assert.False(repository.GetByIdWasCalled);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-12 (edge): UpdateClienteHandler returns Dto with all updated field values,
    //   including the new Ciudad and Telefono, not stale/original ones.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task UpdateHandleAsync_ExistingClient_ReturnsDtoWithAllUpdatedFields()
    {
        var existing = ClienteEntity.Create("Original Nombre", "900000012-0", "3000000000", "Bogotá");
        var repository = new UpdatableClienteRepository(existing);
        var handler = new UpdateClienteCommandHandler(repository);
        var command = new UpdateClienteCommand(
            existing.Id,
            "Nuevo Nombre",
            "900000012-0",
            "+57 321 999 8888",
            "Cartagena");

        var dto = await handler.HandleAsync(command, CancellationToken.None);

        Assert.Equal(existing.Id, dto.Id);
        Assert.Equal("Nuevo Nombre", dto.Nombre);
        Assert.Equal("+57 321 999 8888", dto.Telefono);
        Assert.Equal("Cartagena", dto.Ciudad);
        Assert.Equal("900000012-0", dto.Nit);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-13 (edge): UpdateClienteHandler KeyNotFoundException message includes
    //   the requested client ID, so callers can log actionable context.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task UpdateHandleAsync_NotExistingClient_ExceptionMessageContainsId()
    {
        var repository = new CapturingClienteRepository();
        var handler = new UpdateClienteCommandHandler(repository);
        var targetId = Guid.NewGuid();
        var command = new UpdateClienteCommand(targetId, "Nombre", "900000013-0", "3001234567", "Cali");

        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
            () => handler.HandleAsync(command, CancellationToken.None));

        Assert.Contains(targetId.ToString(), ex.Message);
    }

    // ---------------------------------------------------------------------------
    // Fakes
    // ---------------------------------------------------------------------------

    private sealed class CapturingClienteRepository : IClienteRepository
    {
        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IEnumerable<ClienteEntity>>(Array.Empty<ClienteEntity>());

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult<ClienteEntity?>(null);

        public Task CreateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task DeleteAsync(Guid id, CancellationToken ct)
            => Task.CompletedTask;
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

    private sealed class TrackingGetByIdRepository : IClienteRepository
    {
        public bool GetByIdWasCalled { get; private set; }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IEnumerable<ClienteEntity>>(Array.Empty<ClienteEntity>());

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
        {
            GetByIdWasCalled = true;
            return Task.FromResult<ClienteEntity?>(null);
        }

        public Task CreateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

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
}
