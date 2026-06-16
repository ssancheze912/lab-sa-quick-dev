using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

public sealed class GetClientesQueryHandlerTests
{
    private sealed class InMemoryClienteRepository : IClienteRepository
    {
        private readonly List<ClienteEntity> _clientes;

        public InMemoryClienteRepository(IEnumerable<ClienteEntity>? clientes = null)
        {
            _clientes = clientes?.ToList() ?? [];
        }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<ClienteEntity>>(_clientes.AsReadOnly());

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
            => Task.FromResult(_clientes.FirstOrDefault(c => c.Id == id));

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct = default)
        {
            _clientes.Add(cliente);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(ClienteEntity cliente, CancellationToken ct = default)
        {
            _clientes.Remove(cliente);
            return Task.CompletedTask;
        }

        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }

    [Fact]
    public async Task Handle_ReturnsEmptyList_WhenNoClientesExist()
    {
        // Arrange
        var repo = new InMemoryClienteRepository();
        var handler = new GetClientesQueryHandler(repo);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task Handle_ReturnsMappedDtos_ForExistingClientes()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Empresa Test", "900123456", "3001234567", "Bogotá");
        var repo = new InMemoryClienteRepository([cliente]);
        var handler = new GetClientesQueryHandler(repo);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);
        var dto = result[0];
        Assert.Equal(cliente.Id, dto.Id);
        Assert.Equal("Empresa Test", dto.Nombre);
        Assert.Equal("900123456", dto.NIT);
        Assert.Equal("3001234567", dto.Telefono);
        Assert.Equal("Bogotá", dto.Ciudad);
    }

    [Fact]
    public async Task Handle_ReturnsClientesOrderedByCreatedAtDescending()
    {
        // Arrange
        var older = ClienteEntity.Create("Empresa Antigua", "800000001", "3000000001", "Cali");
        await Task.Delay(10); // ensure timestamp difference
        var newer = ClienteEntity.Create("Empresa Nueva", "800000002", "3000000002", "Medellín");

        var repo = new InMemoryClienteRepository([older, newer]);
        var handler = new GetClientesQueryHandler(repo);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert — newest first
        Assert.Equal(newer.Id, result[0].Id);
        Assert.Equal(older.Id, result[1].Id);
    }
}
