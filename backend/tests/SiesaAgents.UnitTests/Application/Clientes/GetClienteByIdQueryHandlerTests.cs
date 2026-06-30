using Xunit;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClienteByIdQueryHandlerTests
{
    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly IEnumerable<ClienteEntity> _clientes;

        public FakeClienteRepository(IEnumerable<ClienteEntity> clientes)
        {
            _clientes = clientes;
        }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult(_clientes);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_clientes.FirstOrDefault(c => c.Id == id));

        public Task<ClienteEntity> CreateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.FromResult(cliente);

        public Task<bool> DeleteAsync(Guid id, CancellationToken ct)
            => Task.FromResult(true);

        public Task<bool> ExistsByNitAsync(string nit, CancellationToken ct)
            => Task.FromResult(_clientes.Any(c => c.Nit == nit));
    }

    [Fact]
    public async Task Handle_ExistingId_ReturnsClienteDtoWithCorrectFields()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");
        var repository = new FakeClienteRepository([cliente]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetClienteByIdQuery(cliente.Id), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(cliente.Id, result.Id);
        Assert.Equal("Empresa ABC", result.Nombre);
        Assert.Equal("900123456-1", result.Nit);
        Assert.Equal("3001234567", result.Telefono);
        Assert.Equal("Bogotá", result.Ciudad);
        Assert.IsType<DateTimeOffset>(result.CreatedAt);
        Assert.IsType<DateTimeOffset>(result.UpdatedAt);
    }

    [Fact]
    public async Task Handle_NonExistingId_ReturnsNull()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");
        var repository = new FakeClienteRepository([cliente]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetClienteByIdQuery(Guid.NewGuid()), CancellationToken.None);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task Handle_EmptyGuid_ReturnsNull()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");
        var repository = new FakeClienteRepository([cliente]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetClienteByIdQuery(Guid.Empty), CancellationToken.None);

        // Assert
        Assert.Null(result);
    }
}
