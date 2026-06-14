using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClientesQueryHandlerTests
{
    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly IEnumerable<ClienteEntity> _data;

        public FakeClienteRepository(IEnumerable<ClienteEntity> data)
        {
            _data = data;
        }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult(_data);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult<ClienteEntity?>(null);

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
    public async Task HandleAsync_WithTwoEntities_ReturnsTwoDtos()
    {
        // Arrange
        var entities = new[]
        {
            ClienteEntity.Create("Empresa ABC", "900123456-7", "601 234 5678", "Bogotá"),
            ClienteEntity.Create("Garcia & Co", "800654321-3", "602 987 6543", "Medellín"),
        };

        var repository = new FakeClienteRepository(entities);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert
        var dtos = result.ToList();
        Assert.Equal(2, dtos.Count);
    }

    [Fact]
    public async Task HandleAsync_MapsAllFieldsCorrectly()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900123456-7", "601 234 5678", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert
        var dto = result.Single();
        Assert.Equal(entity.Id, dto.Id);
        Assert.Equal("Empresa ABC", dto.Nombre);
        Assert.Equal("900123456-7", dto.Nit);
        Assert.Equal("601 234 5678", dto.Telefono);
        Assert.Equal("Bogotá", dto.Ciudad);
        Assert.Equal(entity.CreatedAt, dto.CreatedAt);
        Assert.Equal(entity.UpdatedAt, dto.UpdatedAt);
    }

    [Fact]
    public async Task HandleAsync_WithEmptyRepository_ReturnsEmptyCollection()
    {
        // Arrange
        var repository = new FakeClienteRepository([]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert
        Assert.Empty(result);
    }
}
