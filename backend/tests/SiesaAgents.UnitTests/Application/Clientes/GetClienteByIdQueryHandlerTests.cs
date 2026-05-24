using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.2 — Client Detail View
/// Unit Tests: GetClienteByIdQueryHandler
///
/// RED Phase: All tests fail until GetClienteByIdQueryHandler and its dependencies are implemented.
///
/// Verifies:
///   - Handler returns correct ClienteDto when repository returns an entity
///   - Handler returns null when repository returns null (not found)
///   - Each DTO field maps correctly from the entity (Nombre, NitRuc, Telefono, Ciudad, Id, CreatedAt)
///   - Repository GetByIdAsync is called exactly once with the correct id
/// </summary>
public class GetClienteByIdQueryHandlerTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Test Double — Fake IClienteRepository (in-memory, no real DB)
    // ─────────────────────────────────────────────────────────────────────────

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly IReadOnlyList<ClienteEntity> _clientes;
        public int GetByIdAsyncCallCount { get; private set; }
        public Guid? LastQueriedId { get; private set; }

        public FakeClienteRepository(IReadOnlyList<ClienteEntity> clientes)
        {
            _clientes = clientes;
        }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(_clientes);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            GetByIdAsyncCallCount++;
            LastQueriedId = id;
            var entity = _clientes.FirstOrDefault(c => c.Id == id);
            return Task.FromResult<ClienteEntity?>(entity);
        }

        public Task AddAsync(ClienteEntity cliente, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Handler — Entity found: returns ClienteDto
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsEntity_ReturnsDtoWithCorrectNombre()
    {
        // GIVEN: Repository contains one entity with known Nombre
        var entity = ClienteEntity.Create("Empresa Ejemplo", "900111222", "3001234567", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(entity.Id);

        // WHEN: Handler is called
        var result = await handler.HandleAsync(query);

        // THEN: DTO Nombre matches entity Nombre
        Assert.NotNull(result);
        Assert.Equal("Empresa Ejemplo", result.Nombre);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsEntity_ReturnsDtoWithCorrectNitRuc()
    {
        // GIVEN: Repository contains entity with known NitRuc
        var entity = ClienteEntity.Create("Empresa NIT Test", "700444555", "3001234567", "Medellín");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(entity.Id);

        // WHEN: Handler maps entity
        var result = await handler.HandleAsync(query);

        // THEN: DTO NitRuc matches entity NitRuc
        Assert.NotNull(result);
        Assert.Equal("700444555", result.NitRuc);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsEntity_ReturnsDtoWithCorrectTelefono()
    {
        // GIVEN: Repository contains entity with known Telefono
        var entity = ClienteEntity.Create("Empresa Tel Test", "800100200", "3007654321", "Cali");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(entity.Id);

        // WHEN: Handler maps entity
        var result = await handler.HandleAsync(query);

        // THEN: DTO Telefono matches entity Telefono
        Assert.NotNull(result);
        Assert.Equal("3007654321", result.Telefono);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsEntity_ReturnsDtoWithCorrectCiudad()
    {
        // GIVEN: Repository contains entity with known Ciudad
        var entity = ClienteEntity.Create("Empresa Ciudad Test", "800300400", "3009876543", "Bucaramanga");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(entity.Id);

        // WHEN: Handler maps entity
        var result = await handler.HandleAsync(query);

        // THEN: DTO Ciudad matches entity Ciudad
        Assert.NotNull(result);
        Assert.Equal("Bucaramanga", result.Ciudad);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsEntity_ReturnsDtoWithMatchingId()
    {
        // GIVEN: Repository contains entity
        var entity = ClienteEntity.Create("Empresa ID Test", "900000099", "3000000099", "Manizales");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(entity.Id);

        // WHEN: Handler maps entity
        var result = await handler.HandleAsync(query);

        // THEN: DTO Id matches entity Id (non-empty Guid)
        Assert.NotNull(result);
        Assert.Equal(entity.Id, result.Id);
        Assert.NotEqual(Guid.Empty, result.Id);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsEntity_ReturnsDtoWithCreatedAtAsDateTimeOffset()
    {
        // GIVEN: Repository contains entity with CreatedAt
        var entity = ClienteEntity.Create("Empresa Fecha Test", "900000001", "3000000001", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(entity.Id);

        // WHEN: Handler maps entity
        var result = await handler.HandleAsync(query);

        // THEN: DTO CreatedAt is DateTimeOffset (company standard: always DateTimeOffset, never DateTime)
        Assert.NotNull(result);
        Assert.IsType<DateTimeOffset>(result.CreatedAt);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsEntity_AllFieldsMappedCorrectly()
    {
        // GIVEN: Repository with entity containing all known field values
        var entity = ClienteEntity.Create("Alpha Corp", "900100100", "3001001001", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(entity.Id);

        // WHEN: Handler maps entity to DTO
        var result = await handler.HandleAsync(query);

        // THEN: All DTO fields match entity fields
        Assert.NotNull(result);
        Assert.Equal(entity.Id, result.Id);
        Assert.Equal("Alpha Corp", result.Nombre);
        Assert.Equal("900100100", result.NitRuc);
        Assert.Equal("3001001001", result.Telefono);
        Assert.Equal("Bogotá", result.Ciudad);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Handler — Entity not found: returns null
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsNull_ReturnsNull()
    {
        // GIVEN: Repository is empty — no client with the requested id exists
        var repository = new FakeClienteRepository([]);
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(Guid.NewGuid());

        // WHEN: Handler is called for a non-existent id
        var result = await handler.HandleAsync(query);

        // THEN: Handler returns null (maps to HTTP 404 at the endpoint layer)
        Assert.Null(result);
    }

    [Fact]
    public async Task HandleAsync_WhenIdDoesNotMatchAnyEntity_ReturnsNull()
    {
        // GIVEN: Repository contains entity but a different id is requested
        var entity = ClienteEntity.Create("Empresa Existente", "900123456", "3001234567", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);
        var differentId = Guid.NewGuid();
        var query = new GetClienteByIdQuery(differentId);

        // WHEN: Handler is called with a non-matching id
        var result = await handler.HandleAsync(query);

        // THEN: Handler returns null (entity not found)
        Assert.Null(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Repository call contract: exactly once with correct id
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenCalledOnce_InvokesRepositoryGetByIdAsyncExactlyOnce()
    {
        // GIVEN: Repository with one entity
        var entity = ClienteEntity.Create("Empresa Invocacion", "900000002", "3000000002", "Cali");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(entity.Id);

        // WHEN: Handler is called once
        await handler.HandleAsync(query);

        // THEN: Repository was queried exactly once (no duplicate or N+1 calls)
        Assert.Equal(1, repository.GetByIdAsyncCallCount);
    }

    [Fact]
    public async Task HandleAsync_WhenCalled_PassesCorrectIdToRepository()
    {
        // GIVEN: Repository with one entity
        var entity = ClienteEntity.Create("Empresa Id Check", "900000003", "3000000003", "Medellín");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(entity.Id);

        // WHEN: Handler is called with a specific id
        await handler.HandleAsync(query);

        // THEN: Repository received the exact same id that was in the query
        Assert.Equal(entity.Id, repository.LastQueriedId);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsNull_StillCallsRepositoryExactlyOnce()
    {
        // GIVEN: Repository is empty (entity not found case)
        var repository = new FakeClienteRepository([]);
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(Guid.NewGuid());

        // WHEN: Handler is called (entity not found)
        await handler.HandleAsync(query);

        // THEN: Repository was still called once — handler does not short-circuit
        Assert.Equal(1, repository.GetByIdAsyncCallCount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Return type contract
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenEntityFound_ReturnTypeIsClienteDto()
    {
        // GIVEN: Repository with one entity
        var entity = ClienteEntity.Create("Empresa Tipo", "900000004", "3000000004", "Pereira");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(entity.Id);

        // WHEN: Handler returns result
        var result = await handler.HandleAsync(query);

        // THEN: Result is nullable ClienteDto (CQRS: query returns read-only DTO or null for 404)
        Assert.NotNull(result);
        Assert.IsType<ClienteDto>(result);
    }
}
