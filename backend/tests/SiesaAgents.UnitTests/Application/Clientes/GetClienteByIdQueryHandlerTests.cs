using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClienteByIdQueryHandlerTests
{
    [Fact]
    public async Task HandleAsync_ReturnsClienteDto_WhenClienteExists()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Test Corp", "900111111-1", "3001111111", "Bogotá");
        var repository = new FakeClienteRepository(cliente);
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(cliente.Id);

        // Act
        var result = await handler.HandleAsync(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(cliente.Id, result.Id);
        Assert.Equal("Test Corp", result.Nombre);
        Assert.Equal("900111111-1", result.NIT);
        Assert.Equal("3001111111", result.Telefono);
        Assert.Equal("Bogotá", result.Ciudad);
        Assert.True(result.CreatedAt > DateTimeOffset.MinValue);
        Assert.True(result.UpdatedAt > DateTimeOffset.MinValue);
    }

    [Fact]
    public async Task HandleAsync_ReturnsNull_WhenClienteDoesNotExist()
    {
        // Arrange
        var repository = new FakeClienteRepository(null);
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(Guid.NewGuid());

        // Act
        var result = await handler.HandleAsync(query, CancellationToken.None);

        // Assert
        Assert.Null(result);
    }

    // ─── Test Double ───────────────────────────────────────────────────────────

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly ClienteEntity? _cliente;

        public FakeClienteRepository(ClienteEntity? cliente)
        {
            _cliente = cliente;
        }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IReadOnlyList<ClienteEntity>>(Array.Empty<ClienteEntity>());

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_cliente);
    }
}
