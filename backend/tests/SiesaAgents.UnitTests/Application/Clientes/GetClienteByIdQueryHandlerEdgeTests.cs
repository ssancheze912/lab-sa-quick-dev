using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.2 — Client Detail View
/// Edge Case Tests: GetClienteByIdQueryHandler
///
/// Expands ATDD coverage with edge cases NOT covered by the primary test suite:
///   - Guid.Empty id — repository called with Guid.Empty, handler does not throw
///   - CancellationToken propagated to repository (not silently dropped)
///   - Cancelled token causes OperationCanceledException to propagate (not swallowed)
///   - Repository called with exact same cancellation token instance
///   - Multiple sequential calls — each call queries repository independently
///   - Query record equality — same id produces equal GetClienteByIdQuery instances
///   - Handler instantiated via primary constructor (no secondary constructor required)
/// </summary>
public class GetClienteByIdQueryHandlerEdgeTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Test Double — Fake IClienteRepository with CancellationToken capture
    // ─────────────────────────────────────────────────────────────────────────

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly IReadOnlyList<ClienteEntity> _clientes;
        public int GetByIdAsyncCallCount { get; private set; }
        public Guid? LastQueriedId { get; private set; }
        public CancellationToken? LastCancellationToken { get; private set; }
        public bool ShouldThrowOnGetById { get; set; }

        public FakeClienteRepository(IReadOnlyList<ClienteEntity>? clientes = null)
        {
            _clientes = clientes ?? [];
        }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(_clientes);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (ShouldThrowOnGetById)
                throw new InvalidOperationException("Simulated repository failure");

            GetByIdAsyncCallCount++;
            LastQueriedId = id;
            LastCancellationToken = cancellationToken;

            var entity = _clientes.FirstOrDefault(c => c.Id == id);
            return Task.FromResult<ClienteEntity?>(entity);
        }

        public Task AddAsync(ClienteEntity cliente, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge Case: Guid.Empty id
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WithGuidEmpty_ReturnsNull()
    {
        // GIVEN: Handler with empty repository and query using Guid.Empty
        var repository = new FakeClienteRepository();
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(Guid.Empty);

        // WHEN: Handler called with Guid.Empty (boundary value)
        var result = await handler.HandleAsync(query);

        // THEN: Returns null — Guid.Empty is a valid Guid that simply does not match any entity
        Assert.Null(result);
    }

    [Fact]
    public async Task HandleAsync_WithGuidEmpty_StillCallsRepositoryOnce()
    {
        // GIVEN: Empty repository and Guid.Empty query
        var repository = new FakeClienteRepository();
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(Guid.Empty);

        // WHEN: Handler called with Guid.Empty
        await handler.HandleAsync(query);

        // THEN: Repository is still called — handler does not special-case Guid.Empty
        Assert.Equal(1, repository.GetByIdAsyncCallCount);
    }

    [Fact]
    public async Task HandleAsync_WithGuidEmpty_PassesGuidEmptyToRepository()
    {
        // GIVEN: Guid.Empty query
        var repository = new FakeClienteRepository();
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(Guid.Empty);

        // WHEN: Handler executes
        await handler.HandleAsync(query);

        // THEN: Repository received Guid.Empty as the id — no transformation applied by handler
        Assert.Equal(Guid.Empty, repository.LastQueriedId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge Case: CancellationToken propagated to repository
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WithCancellationToken_PropagatesTokenToRepository()
    {
        // GIVEN: A specific CancellationToken from a linked source
        using var cts = new CancellationTokenSource();
        var token = cts.Token;

        var entity = ClienteEntity.Create("Empresa Token Test", "900000005", "3000000005", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(entity.Id);

        // WHEN: Handler called with a specific cancellation token
        await handler.HandleAsync(query, token);

        // THEN: Repository received the same token — it is not dropped or replaced with default
        Assert.NotNull(repository.LastCancellationToken);
        Assert.Equal(token, repository.LastCancellationToken!.Value);
    }

    [Fact]
    public async Task HandleAsync_WhenCancellationTokenAlreadyCancelled_ThrowsOperationCancelledException()
    {
        // GIVEN: Already-cancelled token
        using var cts = new CancellationTokenSource();
        await cts.CancelAsync();

        var repository = new FakeClienteRepository();
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(Guid.NewGuid());

        // WHEN/THEN: Handler propagates cancellation — does NOT swallow it
        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => handler.HandleAsync(query, cts.Token));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge Case: Multiple sequential calls are independent
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_CalledTwiceSequentially_InvokesRepositoryTwice()
    {
        // GIVEN: Repository with one entity
        var entity = ClienteEntity.Create("Empresa Multi Test", "900000006", "3000000006", "Cali");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(entity.Id);

        // WHEN: Handler called twice sequentially
        await handler.HandleAsync(query);
        await handler.HandleAsync(query);

        // THEN: Repository was called twice — handler has no internal caching
        Assert.Equal(2, repository.GetByIdAsyncCallCount);
    }

    [Fact]
    public async Task HandleAsync_CalledWithTwoDifferentIds_PassesCorrectIdEachTime()
    {
        // GIVEN: Repository with two entities
        var entity1 = ClienteEntity.Create("Primera Empresa", "900000007", "3000000007", "Bogotá");
        var entity2 = ClienteEntity.Create("Segunda Empresa", "900000008", "3000000008", "Medellín");
        var repository = new FakeClienteRepository([entity1, entity2]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // WHEN: Handler called with first id
        var result1 = await handler.HandleAsync(new GetClienteByIdQuery(entity1.Id));

        // AND WHEN: Handler called with second id
        var result2 = await handler.HandleAsync(new GetClienteByIdQuery(entity2.Id));

        // THEN: Each call returns the correct entity (handler is stateless)
        Assert.NotNull(result1);
        Assert.Equal("Primera Empresa", result1.Nombre);

        Assert.NotNull(result2);
        Assert.Equal("Segunda Empresa", result2.Nombre);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge Case: Repository exception propagates (handler does not swallow)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenRepositoryThrows_ExceptionPropagatesUpward()
    {
        // GIVEN: Repository that throws on GetByIdAsync
        var repository = new FakeClienteRepository { ShouldThrowOnGetById = true };
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(Guid.NewGuid());

        // WHEN/THEN: Handler does not catch or swallow the repository exception
        // (handler's responsibility is to delegate, not to handle infrastructure failures)
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.HandleAsync(query));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge Case: GetClienteByIdQuery record equality
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void GetClienteByIdQuery_SameId_ProducesEqualInstances()
    {
        // GIVEN: Two query instances with the same Guid id
        var id = Guid.NewGuid();
        var query1 = new GetClienteByIdQuery(id);
        var query2 = new GetClienteByIdQuery(id);

        // WHEN/THEN: Being a record, structural equality applies
        Assert.Equal(query1, query2);
        Assert.Equal(query1.Id, query2.Id);
    }

    [Fact]
    public void GetClienteByIdQuery_DifferentIds_ProducesUnequalInstances()
    {
        // GIVEN: Two query instances with different ids
        var query1 = new GetClienteByIdQuery(Guid.NewGuid());
        var query2 = new GetClienteByIdQuery(Guid.NewGuid());

        // WHEN/THEN: Structural inequality since Guid values differ
        Assert.NotEqual(query1, query2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge Case: Entity with whitespace-trimmed fields maps correctly
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenEntityHasLeadingTrailingSpacesTrimmedByCreate_DtoContainsTrimmedValues()
    {
        // GIVEN: ClienteEntity.Create trims whitespace — DTO should reflect trimmed values
        var entity = ClienteEntity.Create("  Empresa Spaces  ", " 900000009 ", " 3000000009 ", " Pereira ");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(entity.Id);

        // WHEN: Handler maps entity to DTO
        var result = await handler.HandleAsync(query);

        // THEN: DTO values are trimmed (EntityCreate trims, DTO reflects exact entity state)
        Assert.NotNull(result);
        Assert.Equal("Empresa Spaces", result.Nombre);
        Assert.Equal("900000009", result.NitRuc);
        Assert.Equal("3000000009", result.Telefono);
        Assert.Equal("Pereira", result.Ciudad);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge Case: CancellationToken.None is equivalent to default
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WithCancellationTokenNone_CompletesSuccessfully()
    {
        // GIVEN: Handler with an entity, using CancellationToken.None explicitly
        var entity = ClienteEntity.Create("Empresa None Token", "900000010", "3000000010", "Barranquilla");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(entity.Id);

        // WHEN: Handler called with CancellationToken.None (never cancelled)
        var result = await handler.HandleAsync(query, CancellationToken.None);

        // THEN: Completes successfully with correct DTO
        Assert.NotNull(result);
        Assert.Equal("Empresa None Token", result.Nombre);
    }
}
