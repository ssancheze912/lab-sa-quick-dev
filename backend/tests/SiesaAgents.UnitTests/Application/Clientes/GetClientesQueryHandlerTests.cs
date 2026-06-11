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

    // ─────────────────────────────────────────────────────────────────────────
    // EXPANDED COVERAGE — Edge cases NOT in ATDD tests
    // Generated by TEA testarch-automate (BMad-Integrated mode)
    // ─────────────────────────────────────────────────────────────────────────

    // [P2] Case-insensitive search: lowercase query matches uppercase nombre
    //
    // Given: repository has a client with uppercase nombre "EMPRESA ALPHA"
    // When:  GetClientesQuery with Search="empresa" (lowercase) is handled
    // Then:  the client is returned (case-insensitive match)
    [Fact]
    public async Task HandleAsync_WithLowercaseSearchMatchingUppercaseNombre_ReturnsMatch()
    {
        // Arrange
        var entities = new[]
        {
            CreateTestCliente("EMPRESA ALPHA", "900111111-1"),
            CreateTestCliente("Beta Corp", "900222222-2"),
        };
        var repository = new FakeClienteRepository(entities);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery("empresa"));
        var dtos = result.ToList();

        // Assert — case-insensitive match returns "EMPRESA ALPHA"
        Assert.Single(dtos);
        Assert.Equal("EMPRESA ALPHA", dtos[0].Nombre);
    }

    // [P2] Search with no match returns empty collection
    //
    // Given: repository has clientes
    // When:  GetClientesQuery with Search="ZZZNOMATCH" is handled
    // Then:  empty collection is returned
    [Fact]
    public async Task HandleAsync_WithSearchMatchingNothing_ReturnsEmptyCollection()
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
        var result = await handler.HandleAsync(new GetClientesQuery("ZZZNOMATCH"));

        // Assert
        Assert.Empty(result);
    }

    // [P2] Search with whitespace-only string returns all clients
    //
    // Given: repository has clientes
    // When:  GetClientesQuery with Search="   " (whitespace) is handled
    // Then:  all clientes are returned (whitespace = no filter)
    [Fact]
    public async Task HandleAsync_WithWhitespaceSearch_ReturnsAllClientes()
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
        var result = await handler.HandleAsync(new GetClientesQuery("   "));

        // Assert — whitespace-only search treated as empty → returns all
        Assert.Equal(2, result.Count());
    }

    // [P2] Search that matches by partial NIT is case-insensitive
    //
    // Given: repository has a client with NIT containing letters (e.g., Colombian format "900123456-1")
    // When:  GetClientesQuery with Search matching partial NIT is handled
    // Then:  the matching client is returned
    [Fact]
    public async Task HandleAsync_WithPartialNitSearch_ReturnsMatchingCliente()
    {
        // Arrange
        var entities = new[]
        {
            CreateTestCliente("Empresa Alpha", "900-ALPHA-001"),
            CreateTestCliente("Empresa Beta", "900-BETA-002"),
        };
        var repository = new FakeClienteRepository(entities);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery("ALPHA"));
        var dtos = result.ToList();

        // Assert
        Assert.Single(dtos);
        Assert.Equal("900-ALPHA-001", dtos[0].Nit);
    }

    // [P1] DTO fields include all required properties (boundary: single entity)
    //
    // Given: repository returns one client
    // When:  GetClientesQuery is handled
    // Then:  the DTO contains all required fields (Id, Nombre, Nit, Telefono, Ciudad, CreatedAt, UpdatedAt)
    [Fact]
    public async Task HandleAsync_SingleEntity_DtoContainsAllRequiredFields()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa Completa", "900999999-9", "6019999999", "Cali");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());
        var dto = result.Single();

        // Assert — all fields must be present and non-default
        Assert.Equal(entity.Id, dto.Id);
        Assert.Equal("Empresa Completa", dto.Nombre);
        Assert.Equal("900999999-9", dto.Nit);
        Assert.Equal("6019999999", dto.Telefono);
        Assert.Equal("Cali", dto.Ciudad);
        Assert.NotEqual(default(DateTimeOffset), dto.CreatedAt);
        Assert.NotEqual(default(DateTimeOffset), dto.UpdatedAt);
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
