using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClienteByIdQueryHandlerTests
{
    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly ClienteEntity? _entity;

        public FakeClienteRepository(ClienteEntity? entity = null)
        {
            _entity = entity;
        }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IEnumerable<ClienteEntity>>([]);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_entity?.Id == id ? _entity : null);

        public Task AddAsync(ClienteEntity entity, CancellationToken ct)
            => Task.CompletedTask;

        public Task UpdateAsync(ClienteEntity entity, CancellationToken ct)
            => Task.CompletedTask;

        public Task DeleteAsync(Guid id, CancellationToken ct)
            => Task.CompletedTask;

        public Task<bool> NitExistsAsync(string nit, CancellationToken ct)
            => Task.FromResult(false);
    }

    [Fact]
    public async Task HandleAsync_ExistingId_ReturnsClienteDto()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900123456-7", "601 234 5678", "Bogotá");
        var repository = new FakeClienteRepository(entity);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id));

        // Assert
        Assert.NotNull(result);
        Assert.Equal(entity.Id, result.Id);
        Assert.Equal("Empresa ABC", result.Nombre);
        Assert.Equal("900123456-7", result.Nit);
        Assert.Equal("601 234 5678", result.Telefono);
        Assert.Equal("Bogotá", result.Ciudad);
        Assert.Equal(entity.CreatedAt, result.CreatedAt);
        Assert.Equal(entity.UpdatedAt, result.UpdatedAt);
    }

    [Fact]
    public async Task HandleAsync_NonExistentId_ReturnsNull()
    {
        // Arrange
        var repository = new FakeClienteRepository(entity: null);
        var handler = new GetClienteByIdQueryHandler(repository);
        var nonExistentId = Guid.NewGuid();

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(nonExistentId));

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task HandleAsync_IdBelongsToOtherEntity_ReturnsNull()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900123456-7", "601 234 5678", "Bogotá");
        var repository = new FakeClienteRepository(entity);
        var handler = new GetClienteByIdQueryHandler(repository);
        var otherId = Guid.NewGuid();

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(otherId));

        // Assert
        Assert.Null(result);
    }
}
