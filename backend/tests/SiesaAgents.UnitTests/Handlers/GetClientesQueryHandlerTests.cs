using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Handlers;

public class GetClientesQueryHandlerTests
{
    // UNIT-B-01: Handler returns all clients as ClienteDto[] when repository returns data
    [Fact]
    public async Task HandleAsync_WithClientes_ReturnsMappedDtos()
    {
        // Arrange
        var clientes = new List<ClienteEntity>
        {
            ClienteEntity.Create("Empresa Alpha SAS", "900100001-0", "+57 1 234 5678", "Bogotá"),
            ClienteEntity.Create("Empresa Beta Ltda", "900100002-1", "+57 1 234 5679", "Medellín"),
        };
        var repository = new FakeClienteRepository(clientes);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = (await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None)).ToList();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Contains(result, d => d.Nombre == "Empresa Alpha SAS" && d.Nit == "900100001-0");
        Assert.Contains(result, d => d.Nombre == "Empresa Beta Ltda" && d.Nit == "900100002-1");
    }

    // UNIT-B-02: Handler returns empty array when repository returns no records
    [Fact]
    public async Task HandleAsync_WithNoClientes_ReturnsEmptyCollection()
    {
        // Arrange
        var repository = new FakeClienteRepository(new List<ClienteEntity>());
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // Assert
        Assert.Empty(result);
    }

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
            => Task.FromResult(_data.FirstOrDefault(c => c.Id == id));

        public Task CreateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task DeleteAsync(Guid id, CancellationToken ct)
            => Task.CompletedTask;
    }
}
