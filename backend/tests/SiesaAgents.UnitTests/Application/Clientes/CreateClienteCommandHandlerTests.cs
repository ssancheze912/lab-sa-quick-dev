using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Interfaces;
using SiesaAgents.Domain.Clientes.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class CreateClienteCommandHandlerTests
{
    private readonly FakeClienteRepository _repository = new();
    private readonly CreateClienteCommandHandler _handler;

    public CreateClienteCommandHandlerTests()
    {
        _handler = new CreateClienteCommandHandler(_repository);
    }

    [Fact]
    public async Task Handle_ValidRequest_ReturnsClienteDtoWithAllFields()
    {
        // Arrange
        var request = new CreateClienteRequest("Empresa Test SA", "900123456-1", "+573001234567", "Bogotá");
        var command = new CreateClienteCommand(request);

        // Act
        var result = await _handler.Handle(command);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<ClienteDto>(result);
        Assert.Equal("Empresa Test SA", result.Nombre);
        Assert.Equal("900123456-1", result.Nit);
        Assert.Equal("+573001234567", result.Telefono);
        Assert.Equal("Bogotá", result.Ciudad);
        Assert.NotEqual(Guid.Empty, result.Id);
    }

    [Fact]
    public async Task Handle_ValidRequest_CallsAddAsyncOnce()
    {
        // Arrange
        var request = new CreateClienteRequest("Empresa B", "900999888-2", "+573009998887", "Medellín");
        var command = new CreateClienteCommand(request);

        // Act
        await _handler.Handle(command);

        // Assert
        Assert.Equal(1, _repository.AddAsyncCallCount);
    }

    [Fact]
    public async Task Handle_ValidRequest_MapsDatesAsDateTimeOffset()
    {
        // Arrange
        var request = new CreateClienteRequest("Empresa C", "900111222-3", "3124567890", "Cali");
        var command = new CreateClienteCommand(request);

        // Act
        var result = await _handler.Handle(command);

        // Assert
        Assert.IsType<DateTimeOffset>(result.CreatedAt);
        Assert.IsType<DateTimeOffset>(result.UpdatedAt);
        Assert.True(result.CreatedAt > DateTimeOffset.MinValue);
    }

    // ─── Fake Repository ─────────────────────────────────────────────────────────

    private sealed class FakeClienteRepository : IClienteRepository
    {
        public int AddAsyncCallCount { get; private set; }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<IEnumerable<ClienteEntity>>(new List<ClienteEntity>());

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.FromResult<ClienteEntity?>(null);

        public Task<ClienteEntity> AddAsync(ClienteEntity entity, CancellationToken cancellationToken = default)
        {
            AddAsyncCallCount++;
            return Task.FromResult(entity);
        }
    }
}
