using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.1 — Client List &amp; Search
/// Unit Tests: GetClientesQueryHandler
///
/// RED Phase: All tests fail until GetClientesQueryHandler and its dependencies are implemented.
///
/// Verifies:
///   - Handler returns empty list when repository returns no clients
///   - Handler returns correct number of DTOs when repository returns entities
///   - Each DTO maps all fields from the entity correctly (Nombre, NitRuc, Telefono, Ciudad, CreatedAt)
///   - Handler calls GetAllAsync on the repository exactly once
/// </summary>
public class GetClientesQueryHandlerTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Test Double — In-Memory IClienteRepository
    // ─────────────────────────────────────────────────────────────────────────

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly IReadOnlyList<ClienteEntity> _clientes;
        public int GetAllAsyncCallCount { get; private set; }

        public FakeClienteRepository(IReadOnlyList<ClienteEntity> clientes)
        {
            _clientes = clientes;
        }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            GetAllAsyncCallCount++;
            return Task.FromResult(_clientes);
        }

        public Task AddAsync(ClienteEntity cliente, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Handler — Empty repository
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsEmptyList_ReturnsEmptyDtoList()
    {
        // GIVEN: Repository returns empty list (no clients in system)
        var repository = new FakeClienteRepository([]);
        var handler = new GetClientesQueryHandler(repository);
        var query = new GetClientesQuery();

        // WHEN: Handler is called
        var result = await handler.HandleAsync(query);

        // THEN: An empty list of DTOs is returned
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Handler — Entity → DTO mapping
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsTwoEntities_ReturnsTwoDtos()
    {
        // GIVEN: Repository seeded with 2 cliente entities
        var entities = new List<ClienteEntity>
        {
            ClienteEntity.Create("Empresa Uno", "900001001", "3001111111", "Bogotá"),
            ClienteEntity.Create("Empresa Dos", "900002002", "3002222222", "Medellín"),
        };
        var repository = new FakeClienteRepository(entities);
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: Handler is called
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: Exactly 2 DTOs are returned
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsEntity_DtoHasCorrectNombre()
    {
        // GIVEN: Repository with 1 entity with known Nombre
        var entity = ClienteEntity.Create("Empresa Ejemplo", "900123456", "3001234567", "Cali");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: Handler maps entity to DTO
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: DTO Nombre matches entity Nombre
        Assert.Equal("Empresa Ejemplo", result[0].Nombre);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsEntity_DtoHasCorrectNitRuc()
    {
        // GIVEN: Repository with 1 entity with known NitRuc
        var entity = ClienteEntity.Create("Empresa Test NIT", "700444555", "3003333333", "Barranquilla");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: Handler maps entity to DTO
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: DTO NitRuc matches entity NitRuc
        Assert.Equal("700444555", result[0].NitRuc);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsEntity_DtoHasCorrectTelefono()
    {
        // GIVEN: Repository with 1 entity with known Telefono
        var entity = ClienteEntity.Create("Empresa Tel", "800100200", "3007654321", "Pereira");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: Handler maps entity to DTO
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: DTO Telefono matches entity Telefono
        Assert.Equal("3007654321", result[0].Telefono);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsEntity_DtoHasCorrectCiudad()
    {
        // GIVEN: Repository with 1 entity with known Ciudad
        var entity = ClienteEntity.Create("Empresa Ciudad", "800300400", "3009876543", "Bucaramanga");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: Handler maps entity to DTO
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: DTO Ciudad matches entity Ciudad
        Assert.Equal("Bucaramanga", result[0].Ciudad);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsEntity_DtoIdMatchesEntityId()
    {
        // GIVEN: Repository with 1 entity
        var entity = ClienteEntity.Create("Empresa ID Check", "900000099", "3000000099", "Manizales");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: Handler maps entity to DTO
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: DTO Id matches entity Id (UUID — non-empty)
        Assert.Equal(entity.Id, result[0].Id);
        Assert.NotEqual(Guid.Empty, result[0].Id);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsEntity_DtoHasCreatedAtAsDateTimeOffset()
    {
        // GIVEN: Repository with 1 entity
        var entity = ClienteEntity.Create("Empresa Fecha", "900000001", "3000000001", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: Handler maps entity to DTO
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: DTO CreatedAt is DateTimeOffset (company standard: always DateTimeOffset, never DateTime)
        Assert.IsType<DateTimeOffset>(result[0].CreatedAt);
    }

    [Fact]
    public async Task HandleAsync_WhenCalledOnce_InvokesRepositoryGetAllAsyncExactlyOnce()
    {
        // GIVEN: Repository with 1 entity
        var entity = ClienteEntity.Create("Empresa Invocacion", "900000002", "3000000002", "Cali");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: Handler is called once
        await handler.HandleAsync(new GetClientesQuery());

        // THEN: Repository was queried exactly once (no N+1 or duplicate calls)
        Assert.Equal(1, repository.GetAllAsyncCallCount);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsTwoEntities_DtosMaintainCorrectFieldMapping()
    {
        // GIVEN: Two entities with distinct data
        var entity1 = ClienteEntity.Create("Alpha Corp", "900100100", "3001001001", "Bogotá");
        var entity2 = ClienteEntity.Create("Beta SA", "900200200", "3002002002", "Medellín");
        var repository = new FakeClienteRepository([entity1, entity2]);
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: Handler maps both entities
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: Each DTO maps correctly to its corresponding entity (order preserved)
        var dto1 = result.First(d => d.Id == entity1.Id);
        var dto2 = result.First(d => d.Id == entity2.Id);

        Assert.Equal("Alpha Corp", dto1.Nombre);
        Assert.Equal("900100100", dto1.NitRuc);
        Assert.Equal("3001001001", dto1.Telefono);
        Assert.Equal("Bogotá", dto1.Ciudad);

        Assert.Equal("Beta SA", dto2.Nombre);
        Assert.Equal("900200200", dto2.NitRuc);
        Assert.Equal("3002002002", dto2.Telefono);
        Assert.Equal("Medellín", dto2.Ciudad);
    }

    [Fact]
    public async Task HandleAsync_ReturnType_ImplementsIReadOnlyList()
    {
        // GIVEN: Repository with 1 entity
        var entity = ClienteEntity.Create("Empresa Readonly", "900000099", "3000000001", "Cali");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: Handler returns result
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: Result is IReadOnlyList<ClienteDto> (CQRS read pattern — query returns read-only view)
        Assert.IsAssignableFrom<IReadOnlyList<ClienteDto>>(result);
    }
}
