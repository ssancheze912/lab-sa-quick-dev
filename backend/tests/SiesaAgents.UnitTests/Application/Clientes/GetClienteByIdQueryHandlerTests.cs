using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClienteByIdQueryHandlerTests
{
    private sealed class StubClienteRepository(IReadOnlyList<ClienteEntity> entities) : IClienteRepository
    {
        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
            => Task.FromResult(entities);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
            => Task.FromResult(entities.FirstOrDefault(e => e.Id == id));
    }

    [Fact]
    public async Task Handle_WithExistingId_ReturnsClienteDto()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");
        var repo = new StubClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repo);

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id));

        // Assert
        Assert.NotNull(result);
        Assert.Equal(entity.Id, result.Id);
        Assert.Equal(entity.Nombre, result.Nombre);
        Assert.Equal(entity.Nit, result.Nit);
        Assert.Equal(entity.Telefono, result.Telefono);
        Assert.Equal(entity.Ciudad, result.Ciudad);
        Assert.Equal(entity.CreatedAt, result.CreatedAt);
    }

    [Fact]
    public async Task Handle_WithNonExistentId_ReturnsNull()
    {
        // Arrange
        var repo = new StubClienteRepository([]);
        var handler = new GetClienteByIdQueryHandler(repo);
        var nonExistentId = Guid.NewGuid();

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(nonExistentId));

        // Assert
        Assert.Null(result);
    }
}
