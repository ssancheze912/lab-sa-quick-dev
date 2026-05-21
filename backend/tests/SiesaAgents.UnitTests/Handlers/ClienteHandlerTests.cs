using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Domain.Exceptions;

namespace SiesaAgents.UnitTests.Handlers;

/// <summary>
/// Unit tests for CreateClienteCommandHandler — Story 2.3.
///
/// Test IDs: UNIT-B-04, UNIT-B-05
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
        var repository = new ThrowingClienteRepository(new ConflictException("El NIT/RUC ya está registrado"));
        var handler = new CreateClienteCommandHandler(repository);
        var command = new CreateClienteCommand("Empresa UNIT-B-05", "DUPNIT-05", "3000000005", "Medellín");

        var ex = await Assert.ThrowsAsync<ConflictException>(
            () => handler.HandleAsync(command, CancellationToken.None));

        Assert.Contains("NIT/RUC", ex.Message);
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

        public Task DeleteAsync(Guid id, CancellationToken ct)
            => Task.CompletedTask;
    }
}
