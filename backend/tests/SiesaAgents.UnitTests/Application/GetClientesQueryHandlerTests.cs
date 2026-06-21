using SiesaAgents.Application.Clientes.Interfaces;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Application;

public class GetClientesQueryHandlerTests
{
    private static ClienteEntity BuildCliente(string nombre, string nit, DateTimeOffset? createdAt = null)
    {
        var entity = ClienteEntity.Create(nombre, nit, "300000000", "Bogotá");
        // Override CreatedAt using reflection for ordering tests
        if (createdAt.HasValue)
        {
            var prop = typeof(SiesaAgents.Domain.Entities.Entity).GetProperty("CreatedAt");
            prop!.SetValue(entity, createdAt.Value);
        }
        return entity;
    }

    [Fact]
    public async Task HandleAsync_ReturnsAllClientes()
    {
        // Arrange
        var clientes = new List<ClienteEntity>
        {
            BuildCliente("Empresa A", "900111111-1"),
            BuildCliente("Empresa B", "900222222-2"),
        };

        var repository = new FakeClienteRepository(clientes);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert
        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task HandleAsync_ReturnsClienteDtoWithCorrectFields()
    {
        // Arrange
        var clientes = new List<ClienteEntity>
        {
            BuildCliente("Empresa Test", "900123456-7"),
        };

        var repository = new FakeClienteRepository(clientes);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = (await handler.HandleAsync(new GetClientesQuery())).ToList();

        // Assert
        Assert.Single(result);
        var dto = result[0];
        Assert.Equal("Empresa Test", dto.Nombre);
        Assert.Equal("900123456-7", dto.Nit);
        Assert.IsType<DateTimeOffset>(dto.CreatedAt);
    }

    [Fact]
    public async Task HandleAsync_ReturnsClientesOrderedByCreatedAtDescending()
    {
        // Arrange
        var older = BuildCliente("Older", "900111000-1", DateTimeOffset.UtcNow.AddDays(-2));
        var newer = BuildCliente("Newer", "900222000-2", DateTimeOffset.UtcNow.AddDays(-1));
        var newest = BuildCliente("Newest", "900333000-3", DateTimeOffset.UtcNow);

        var repository = new FakeClienteRepository(new List<ClienteEntity> { older, newer, newest });
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = (await handler.HandleAsync(new GetClientesQuery())).ToList();

        // Assert — ordered by CreatedAt DESC
        Assert.Equal("Newest", result[0].Nombre);
        Assert.Equal("Newer", result[1].Nombre);
        Assert.Equal("Older", result[2].Nombre);
    }

    [Fact]
    public async Task HandleAsync_WithNoClientes_ReturnsEmptyEnumerable()
    {
        // Arrange
        var repository = new FakeClienteRepository(new List<ClienteEntity>());
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert
        Assert.Empty(result);
    }

    // ─── Fake Repository ────────────────────────────────────────────────────────

    private sealed class FakeClienteRepository(IEnumerable<ClienteEntity> data) : IClienteRepository
    {
        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(data);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.FromResult(data.FirstOrDefault(c => c.Id == id));

        public Task<ClienteEntity> AddAsync(ClienteEntity entity, CancellationToken cancellationToken = default)
            => Task.FromResult(entity);
    }
}
