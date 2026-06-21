using SiesaAgents.Application.Clientes.Interfaces;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClienteByIdQueryHandlerTests
{
    private static ClienteEntity BuildCliente(string nombre = "Empresa Test", string nit = "900123456-1")
        => ClienteEntity.Create(nombre, nit, "+573001234567", "Bogotá");

    // ─── Found ───────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WhenClienteExists_ReturnsCorrectDto()
    {
        // Arrange
        var entity = BuildCliente("Empresa Uno", "900111111-1");
        var repository = new FakeClienteRepository(entity);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetClienteByIdQuery(entity.Id));

        // Assert
        Assert.NotNull(result);
        Assert.Equal(entity.Id, result.Id);
        Assert.Equal("Empresa Uno", result.Nombre);
        Assert.Equal("900111111-1", result.Nit);
        Assert.Equal("+573001234567", result.Telefono);
        Assert.Equal("Bogotá", result.Ciudad);
    }

    [Fact]
    public async Task Handle_WhenClienteExists_MapsDates_AsDateTimeOffset()
    {
        // Arrange
        var entity = BuildCliente();
        var repository = new FakeClienteRepository(entity);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetClienteByIdQuery(entity.Id));

        // Assert — R-007: dates are DateTimeOffset
        Assert.NotNull(result);
        Assert.IsType<DateTimeOffset>(result.CreatedAt);
        Assert.IsType<DateTimeOffset>(result.UpdatedAt);
    }

    // ─── Not Found ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WhenClienteDoesNotExist_ReturnsNull()
    {
        // Arrange
        var repository = new FakeClienteRepository(null);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.Handle(new GetClienteByIdQuery(Guid.NewGuid()));

        // Assert
        Assert.Null(result);
    }

    // ─── Fake Repository ─────────────────────────────────────────────────────────

    private sealed class FakeClienteRepository(ClienteEntity? entity) : IClienteRepository
    {
        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<IEnumerable<ClienteEntity>>(new List<ClienteEntity>());

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.FromResult(entity is not null && entity.Id == id ? entity : null);
    }
}
