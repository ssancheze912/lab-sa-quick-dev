using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Handlers;

/// <summary>
/// Unit tests for CreateClienteCommandHandler — Story 2.1 edge case expansion.
///
/// Test IDs: UNIT-B-CREATE-01 … UNIT-B-CREATE-05
/// </summary>
public class CreateClienteCommandHandlerTests
{
    // ---------------------------------------------------------------------------
    // UNIT-B-CREATE-01: Handler returns a ClienteDto with the same fields
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_ValidCommand_ReturnsDtoWithCorrectFields()
    {
        var repository = new CapturingClienteRepository();
        var handler = new CreateClienteCommandHandler(repository);
        var command = new CreateClienteCommand("Empresa Nueva SAS", "900200001-0", "+57 300 000 0001", "Bogotá");

        var dto = await handler.HandleAsync(command, CancellationToken.None);

        Assert.Equal("Empresa Nueva SAS", dto.Nombre);
        Assert.Equal("900200001-0", dto.Nit);
        Assert.Equal("+57 300 000 0001", dto.Telefono);
        Assert.Equal("Bogotá", dto.Ciudad);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CREATE-02: Handler returns a DTO with a valid non-empty GUID Id
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_ValidCommand_ReturnsNonEmptyId()
    {
        var repository = new CapturingClienteRepository();
        var handler = new CreateClienteCommandHandler(repository);
        var command = new CreateClienteCommand("Empresa Beta", "900200002-1", "300", "Cali");

        var dto = await handler.HandleAsync(command, CancellationToken.None);

        Assert.NotEqual(Guid.Empty, dto.Id);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CREATE-03: Handler delegates creation to repository exactly once
    // Boundary: repository.CreateAsync must be called once per command.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_Called_InvokesRepositoryCreateAsyncOnce()
    {
        var repository = new CapturingClienteRepository();
        var handler = new CreateClienteCommandHandler(repository);
        var command = new CreateClienteCommand("Empresa Gamma", "900200003-2", "301", "Medellín");

        await handler.HandleAsync(command, CancellationToken.None);

        Assert.Equal(1, repository.CreateCallCount);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CREATE-04: Handler passes the correct entity to the repository
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_Called_PassesEntityWithMatchingFieldsToRepository()
    {
        var repository = new CapturingClienteRepository();
        var handler = new CreateClienteCommandHandler(repository);
        var command = new CreateClienteCommand("Empresa Delta Ltda", "900200004-3", "+57 1 444 4444", "Barranquilla");

        await handler.HandleAsync(command, CancellationToken.None);

        Assert.NotNull(repository.LastCreated);
        Assert.Equal("Empresa Delta Ltda", repository.LastCreated!.Nombre);
        Assert.Equal("900200004-3", repository.LastCreated.Nit);
        Assert.Equal("+57 1 444 4444", repository.LastCreated.Telefono);
        Assert.Equal("Barranquilla", repository.LastCreated.Ciudad);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-CREATE-05: Handler propagates exception thrown by repository
    // Error path: if repository throws, the exception must bubble up.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_RepositoryThrows_PropagatesException()
    {
        var repository = new ThrowingClienteRepository(new InvalidOperationException("NIT ya existe"));
        var handler = new CreateClienteCommandHandler(repository);
        var command = new CreateClienteCommand("Empresa Epsilon", "DUPNIT", "302", "Bogotá");

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.HandleAsync(command, CancellationToken.None));
    }

    // ---------------------------------------------------------------------------
    // Fakes
    // ---------------------------------------------------------------------------

    private sealed class CapturingClienteRepository : IClienteRepository
    {
        public int CreateCallCount { get; private set; }
        public ClienteEntity? LastCreated { get; private set; }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IEnumerable<ClienteEntity>>(Array.Empty<ClienteEntity>());

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult<ClienteEntity?>(null);

        public Task CreateAsync(ClienteEntity cliente, CancellationToken ct)
        {
            CreateCallCount++;
            LastCreated = cliente;
            return Task.CompletedTask;
        }

        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task DeleteAsync(Guid id, CancellationToken ct)
            => Task.CompletedTask;
    }

    private sealed class ThrowingClienteRepository : IClienteRepository
    {
        private readonly Exception _exception;

        public ThrowingClienteRepository(Exception exception)
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
}
