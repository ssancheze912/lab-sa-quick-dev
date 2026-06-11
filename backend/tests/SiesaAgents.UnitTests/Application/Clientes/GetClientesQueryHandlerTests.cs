using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClientesQueryHandlerTests
{
    private static ClienteEntity CreateTestCliente(string nombre = "Empresa Alpha", string nit = "900123456-1")
    {
        return ClienteEntity.Create(nombre, nit, "6014567890", "Bogotá");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P1-01: Handler returns DTO mapping with all fields correctly
    //
    // Given: repository returns a cliente entity
    // When:  GetClientesQuery is handled
    // Then:  returned DTO has all fields mapped, CreatedAt is DateTimeOffset
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task HandleAsync_WhenRepositoryHasClientes_ReturnsMappedDtos()
    {
        // Arrange
        var entity = CreateTestCliente();
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());
        var dtos = result.ToList();

        // Assert
        Assert.Single(dtos);
        var dto = dtos[0];
        Assert.Equal(entity.Id, dto.Id);
        Assert.Equal(entity.Nombre, dto.Nombre);
        Assert.Equal(entity.Nit, dto.Nit);
        Assert.Equal(entity.Telefono, dto.Telefono);
        Assert.Equal(entity.Ciudad, dto.Ciudad);
        Assert.IsType<DateTimeOffset>(dto.CreatedAt);
        Assert.IsType<DateTimeOffset>(dto.UpdatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Given: repository returns multiple clientes
    // When:  GetClientesQuery with no search is handled
    // Then:  all entities are returned as DTOs
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task HandleAsync_WithNoSearch_ReturnsAllClientes()
    {
        // Arrange
        var entities = new[]
        {
            CreateTestCliente("Empresa Alpha", "900123456-1"),
            CreateTestCliente("Empresa Beta", "900123456-2"),
        };
        var repository = new FakeClienteRepository(entities);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert
        Assert.Equal(2, result.Count());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P2-07: Search by name filters correctly
    //
    // Given: repository has multiple clientes
    // When:  GetClientesQuery with Search="Alpha" is handled
    // Then:  only matching clientes are returned
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task HandleAsync_WithSearchByName_FiltersResults()
    {
        // Arrange
        var entities = new[]
        {
            CreateTestCliente("Empresa Alpha", "900111111-1"),
            CreateTestCliente("Empresa Beta", "900222222-2"),
        };
        var repository = new FakeClienteRepository(entities);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery("Alpha"));
        var dtos = result.ToList();

        // Assert
        Assert.Single(dtos);
        Assert.Equal("Empresa Alpha", dtos[0].Nombre);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P2-07: Search by NIT filters correctly
    //
    // Given: repository has multiple clientes
    // When:  GetClientesQuery with Search="111" is handled
    // Then:  only clientes with matching NIT are returned
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task HandleAsync_WithSearchByNit_FiltersResults()
    {
        // Arrange
        var entities = new[]
        {
            CreateTestCliente("Empresa Alpha", "900111111-1"),
            CreateTestCliente("Empresa Beta", "900222222-2"),
        };
        var repository = new FakeClienteRepository(entities);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery("111"));
        var dtos = result.ToList();

        // Assert
        Assert.Single(dtos);
        Assert.Equal("900111111-1", dtos[0].Nit);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Given: repository is empty
    // When:  GetClientesQuery is handled
    // Then:  empty collection is returned
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task HandleAsync_WhenRepositoryIsEmpty_ReturnsEmptyCollection()
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

// ─────────────────────────────────────────────────────────────────────────
// Fake repository for unit testing (avoids EF Core/PostgreSQL dependency)
// ─────────────────────────────────────────────────────────────────────────
internal sealed class FakeClienteRepository : IClienteRepository
{
    private readonly IEnumerable<ClienteEntity> _data;

    public FakeClienteRepository(IEnumerable<ClienteEntity> data)
    {
        _data = data;
    }

    public Task<IEnumerable<ClienteEntity>> GetAll(CancellationToken cancellationToken = default)
        => Task.FromResult(_data);

    public Task<ClienteEntity?> GetById(Guid id, CancellationToken cancellationToken = default)
        => Task.FromResult(_data.FirstOrDefault(e => e.Id == id));
}
