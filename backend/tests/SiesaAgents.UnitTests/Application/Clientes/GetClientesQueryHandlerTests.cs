using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

// ─── Fake repository for unit testing ────────────────────────────────────────

internal sealed class FakeClienteRepository : IClienteRepository
{
    private readonly IReadOnlyList<ClienteEntity> _entities;

    public FakeClienteRepository(IReadOnlyList<ClienteEntity> entities)
        => _entities = entities;

    public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
        => Task.FromResult(_entities);

    public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
        => Task.FromResult(_entities.FirstOrDefault(e => e.Id == id));

    public Task AddAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
    public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
    public Task DeleteAsync(Guid id, CancellationToken ct) => Task.CompletedTask;
    public Task<bool> ExistsByNitAsync(string nit, CancellationToken ct) => Task.FromResult(false);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

public class GetClientesQueryHandlerTests
{
    [Fact]
    public async Task HandleAsync_ReturnsMatchingClienteDtoList()
    {
        // Arrange
        var entity1 = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");
        var entity2 = ClienteEntity.Create("Distribuidora XYZ", "800999000-2", "3109876543", "Medellín");

        var repository = new FakeClienteRepository([entity1, entity2]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task HandleAsync_MapsNombreCorrectly()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // Assert
        Assert.Equal("Empresa ABC", result[0].Nombre);
    }

    [Fact]
    public async Task HandleAsync_MapsNitCorrectly()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // Assert
        Assert.Equal("900123456-1", result[0].Nit);
    }

    [Fact]
    public async Task HandleAsync_MapsTelefonoAndCiudadCorrectly()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // Assert
        Assert.Equal("3001234567", result[0].Telefono);
        Assert.Equal("Bogotá", result[0].Ciudad);
    }

    [Fact]
    public async Task HandleAsync_MapsIdCorrectly()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // Assert
        Assert.Equal(entity.Id, result[0].Id);
    }

    [Fact]
    public async Task HandleAsync_MapsDateTimeOffsetTimestamps()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // Assert: timestamps are DateTimeOffset (not DateTime)
        Assert.IsType<DateTimeOffset>(result[0].CreatedAt);
        Assert.IsType<DateTimeOffset>(result[0].UpdatedAt);
    }

    [Fact]
    public async Task HandleAsync_ReturnsEmptyListWhenNoClientes()
    {
        // Arrange
        var repository = new FakeClienteRepository([]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task HandleAsync_ReturnTypeIsReadOnlyListOfClienteDto()
    {
        // Arrange
        var repository = new FakeClienteRepository([]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // Assert
        Assert.IsAssignableFrom<IReadOnlyList<ClienteDto>>(result);
    }
}
