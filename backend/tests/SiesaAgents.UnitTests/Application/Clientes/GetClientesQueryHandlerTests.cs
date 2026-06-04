using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClientesQueryHandlerTests
{
    // Simple in-memory stub for IClienteRepository
    private sealed class StubClienteRepository(IReadOnlyList<ClienteEntity> entities) : IClienteRepository
    {
        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
            => Task.FromResult(entities);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
            => Task.FromResult(entities.FirstOrDefault(e => e.Id == id));
    }

    [Fact]
    public async Task Handle_ReturnsMappedClienteDtos()
    {
        // Arrange
        var e1 = ClienteEntity.Create("Empresa A", "900111111-1", "3001111111", "Bogotá");
        var e2 = ClienteEntity.Create("Empresa B", "900222222-2", "3002222222", "Medellín");
        var repo = new StubClienteRepository([e1, e2]);
        var handler = new GetClientesQueryHandler(repo);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert
        Assert.Equal(2, result.Count);

        var dto1 = result.First(d => d.Id == e1.Id);
        Assert.Equal(e1.Nombre, dto1.Nombre);
        Assert.Equal(e1.Nit, dto1.Nit);
        Assert.Equal(e1.Telefono, dto1.Telefono);
        Assert.Equal(e1.Ciudad, dto1.Ciudad);
        Assert.Equal(e1.CreatedAt, dto1.CreatedAt);

        var dto2 = result.First(d => d.Id == e2.Id);
        Assert.Equal(e2.Nombre, dto2.Nombre);
    }

    [Fact]
    public async Task Handle_WhenRepositoryEmpty_ReturnsEmptyList()
    {
        // Arrange
        var repo = new StubClienteRepository([]);
        var handler = new GetClientesQueryHandler(repo);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert
        Assert.Empty(result);
    }
}
