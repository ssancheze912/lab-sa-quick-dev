using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClientesQueryHandlerTests
{
    [Fact]
    public async Task HandleAsync_ReturnsEmptyList_WhenNoClientesExist()
    {
        // Arrange
        var repository = new FakeClienteRepository([]);
        var handler = new GetClientesQueryHandler(repository);
        var query = new GetClientesQuery();

        // Act
        var result = await handler.HandleAsync(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task HandleAsync_ReturnsMappedDtos_ForExistingClientes()
    {
        // Arrange
        var clientes = new List<ClienteEntity>
        {
            ClienteEntity.Create("Empresa Alpha", "900123456-1", "3001234567", "Bogotá"),
            ClienteEntity.Create("Empresa Beta",  "800654321-2", "3007654321", "Medellín"),
        };
        var repository = new FakeClienteRepository(clientes);
        var handler = new GetClientesQueryHandler(repository);
        var query = new GetClientesQuery();

        // Act
        var result = await handler.HandleAsync(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);

        var alpha = result.First(d => d.Nombre == "Empresa Alpha");
        Assert.Equal("900123456-1", alpha.NIT);
        Assert.Equal("Bogotá", alpha.Ciudad);

        var beta = result.First(d => d.Nombre == "Empresa Beta");
        Assert.Equal("800654321-2", beta.NIT);
        Assert.Equal("Medellín", beta.Ciudad);
    }

    [Fact]
    public async Task HandleAsync_MapsDtosWithCorrectFields()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Test Corp", "123-4", "3001111111", "Cali");
        var repository = new FakeClienteRepository([cliente]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // Assert
        var dto = Assert.Single(result);
        Assert.Equal(cliente.Id, dto.Id);
        Assert.Equal("Test Corp", dto.Nombre);
        Assert.Equal("123-4", dto.NIT);
        Assert.Equal("3001111111", dto.Telefono);
        Assert.Equal("Cali", dto.Ciudad);
        Assert.True(dto.CreatedAt > DateTimeOffset.MinValue);
        Assert.True(dto.UpdatedAt > DateTimeOffset.MinValue);
    }

    // ─── Test Double ───────────────────────────────────────────────────────────

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly IReadOnlyList<ClienteEntity> _clientes;

        public FakeClienteRepository(IReadOnlyList<ClienteEntity> clientes)
        {
            _clientes = clientes;
        }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult(_clientes);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_clientes.FirstOrDefault(c => c.Id == id));
    }
}
