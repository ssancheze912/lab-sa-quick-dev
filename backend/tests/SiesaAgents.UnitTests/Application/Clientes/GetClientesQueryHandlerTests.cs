using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

// Manual mock — no external mocking library required
internal sealed class FakeClienteRepository(IReadOnlyList<ClienteEntity> data) : IClienteRepository
{
    public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
        => Task.FromResult(data);
}

public class GetClientesQueryHandlerTests
{
    private static ClienteEntity BuildCliente(string nombre = "Empresa Test", string nit = "900100200-1")
        => ClienteEntity.Create(nombre, nit, "3001234567", "Bogotá");

    [Fact]
    public async Task HandleAsync_ReturnsAllClientes_WhenRepositoryHasRecords()
    {
        // Arrange
        var entities = new List<ClienteEntity>
        {
            BuildCliente("Empresa A", "111-111"),
            BuildCliente("Empresa B", "222-222"),
        };
        var repo = new FakeClienteRepository(entities.AsReadOnly());
        var handler = new GetClientesQueryHandler(repo);

        // Act
        var result = await handler.HandleAsync();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal("Empresa A", result[0].Nombre);
        Assert.Equal("111-111", result[0].NIT);
        Assert.Equal("Empresa B", result[1].Nombre);
        Assert.Equal("222-222", result[1].NIT);
    }

    [Fact]
    public async Task HandleAsync_ReturnsEmptyList_WhenRepositoryIsEmpty()
    {
        // Arrange
        var repo = new FakeClienteRepository(new List<ClienteEntity>().AsReadOnly());
        var handler = new GetClientesQueryHandler(repo);

        // Act
        var result = await handler.HandleAsync();

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task HandleAsync_MapsDtoFields_Correctly()
    {
        // Arrange
        var entity = BuildCliente("Empresa Ejemplo", "900100200-1");
        var repo = new FakeClienteRepository(new List<ClienteEntity> { entity }.AsReadOnly());
        var handler = new GetClientesQueryHandler(repo);

        // Act
        var result = await handler.HandleAsync();

        // Assert
        var dto = result[0];
        Assert.Equal(entity.Id, dto.Id);
        Assert.Equal(entity.Nombre, dto.Nombre);
        Assert.Equal(entity.NIT, dto.NIT);
        Assert.Equal(entity.Telefono, dto.Telefono);
        Assert.Equal(entity.Ciudad, dto.Ciudad);
        Assert.Equal(entity.CreatedAt, dto.CreatedAt);
        Assert.Equal(entity.UpdatedAt, dto.UpdatedAt);
    }
}
