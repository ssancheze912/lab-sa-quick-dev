using Xunit;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClientesQueryHandlerTests
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
    }

    [Fact]
    public async Task Handle_ReturnsCorrectListOfClienteDto()
    {
        // Arrange
        var cliente1 = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");
        var cliente2 = ClienteEntity.Create("Empresa XYZ", "800456789-2", "3109876543", "Medellín");
        var repository = new FakeClienteRepository([cliente1, cliente2]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);

        // Assert
        var dtos = result.ToList();
        Assert.Equal(2, dtos.Count);
        Assert.Contains(dtos, d => d.Nombre == "Empresa ABC" && d.Nit == "900123456-1");
        Assert.Contains(dtos, d => d.Nombre == "Empresa XYZ" && d.Nit == "800456789-2");
    }

    [Fact]
    public async Task Handle_EmptyRepository_ReturnsEmptyEnumerable()
    {
        // Arrange
        var repository = new FakeClienteRepository([]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task Handle_MapsAllPropertiesCorrectly()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Test Corp", "123456789-0", "3000000000", "Cali");
        var repository = new FakeClienteRepository([cliente]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);

        // Assert
        var dto = result.Single();
        Assert.Equal(cliente.Id, dto.Id);
        Assert.Equal("Test Corp", dto.Nombre);
        Assert.Equal("123456789-0", dto.Nit);
        Assert.Equal("3000000000", dto.Telefono);
        Assert.Equal("Cali", dto.Ciudad);
        Assert.IsType<DateTimeOffset>(dto.CreatedAt);
        Assert.IsType<DateTimeOffset>(dto.UpdatedAt);
    }
}
