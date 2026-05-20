using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Handlers;

/// <summary>
/// Unit tests for GetClienteByIdQueryHandler — Story 2.2 expansion.
///
/// Test IDs: UNIT-B-BID-01 … UNIT-B-BID-06
/// </summary>
public class GetClienteByIdQueryHandlerTests
{
    // ---------------------------------------------------------------------------
    // UNIT-B-BID-01: Handler returns a ClienteDto when the entity exists
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_ExistingId_ReturnsMappedDto()
    {
        var entity = ClienteEntity.Create("Empresa Detalle SAS", "900300001-0", "+57 1 234 5678", "Bogotá");
        var repository = new FakeClienteRepository(entity);
        var handler = new GetClienteByIdQueryHandler(repository);

        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(entity.Id, result!.Id);
        Assert.Equal("Empresa Detalle SAS", result.Nombre);
        Assert.Equal("900300001-0", result.Nit);
        Assert.Equal("+57 1 234 5678", result.Telefono);
        Assert.Equal("Bogotá", result.Ciudad);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-BID-02: Handler returns null when the entity does not exist
    // Boundary: 404 guard in the endpoint depends on null being returned
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_NonExistingId_ReturnsNull()
    {
        var repository = new FakeClienteRepository(null);
        var handler = new GetClienteByIdQueryHandler(repository);

        var result = await handler.HandleAsync(new GetClienteByIdQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.Null(result);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-BID-03: Handler maps CreatedAt and UpdatedAt as DateTimeOffset (with offset)
    // Boundary: serialization contract requires DateTimeOffset (not plain DateTime)
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_ExistingId_MapsCreatedAtAndUpdatedAtAsDateTimeOffset()
    {
        var entity = ClienteEntity.Create("Empresa Fechas", "900300002-1", "300", "Cali");
        var repository = new FakeClienteRepository(entity);
        var handler = new GetClienteByIdQueryHandler(repository);

        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(TimeSpan.Zero, result!.CreatedAt.Offset);
        Assert.Equal(TimeSpan.Zero, result.UpdatedAt.Offset);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-BID-04: Handler propagates exception thrown by repository
    // Error path: DB failure must surface as an exception, not as null
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_RepositoryThrows_PropagatesException()
    {
        var repository = new ThrowingClienteRepository(new Exception("DB connection lost"));
        var handler = new GetClienteByIdQueryHandler(repository);

        await Assert.ThrowsAsync<Exception>(
            () => handler.HandleAsync(new GetClienteByIdQuery(Guid.NewGuid()), CancellationToken.None));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-BID-05: Handler passes the correct ID to the repository
    // Boundary: the query ID must be forwarded exactly, not re-created
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_Called_PassesCorrectIdToRepository()
    {
        var entity = ClienteEntity.Create("Empresa ID Check", "900300003-2", "301", "Medellín");
        var repository = new CapturingClienteRepository(entity);
        var handler = new GetClienteByIdQueryHandler(repository);
        var expectedId = entity.Id;

        await handler.HandleAsync(new GetClienteByIdQuery(expectedId), CancellationToken.None);

        Assert.Equal(expectedId, repository.LastRequestedId);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-BID-06: Handler returns null for Guid.Empty (treated as non-existing)
    // Boundary: Guid.Empty is a valid Guid value and must not throw; null is returned
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task HandleAsync_EmptyGuid_ReturnsNull()
    {
        var repository = new FakeClienteRepository(null);
        var handler = new GetClienteByIdQueryHandler(repository);

        var result = await handler.HandleAsync(new GetClienteByIdQuery(Guid.Empty), CancellationToken.None);

        Assert.Null(result);
    }

    // ---------------------------------------------------------------------------
    // Fakes
    // ---------------------------------------------------------------------------

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly ClienteEntity? _entity;

        public FakeClienteRepository(ClienteEntity? entity) => _entity = entity;

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IEnumerable<ClienteEntity>>(Array.Empty<ClienteEntity>());

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_entity?.Id == id ? _entity : null);

        public Task CreateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task DeleteAsync(Guid id, CancellationToken ct)
            => Task.CompletedTask;
    }

    private sealed class CapturingClienteRepository : IClienteRepository
    {
        private readonly ClienteEntity? _entity;
        public Guid LastRequestedId { get; private set; }

        public CapturingClienteRepository(ClienteEntity? entity) => _entity = entity;

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IEnumerable<ClienteEntity>>(Array.Empty<ClienteEntity>());

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
        {
            LastRequestedId = id;
            return Task.FromResult(_entity?.Id == id ? _entity : null);
        }

        public Task CreateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task DeleteAsync(Guid id, CancellationToken ct)
            => Task.CompletedTask;
    }

    private sealed class ThrowingClienteRepository : IClienteRepository
    {
        private readonly Exception _exception;

        public ThrowingClienteRepository(Exception exception) => _exception = exception;

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IEnumerable<ClienteEntity>>(Array.Empty<ClienteEntity>());

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromException<ClienteEntity?>(_exception);

        public Task CreateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task DeleteAsync(Guid id, CancellationToken ct)
            => Task.CompletedTask;
    }
}
