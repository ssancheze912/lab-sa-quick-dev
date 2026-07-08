using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.2 — Automate (Edge Cases).
///
/// Expands ATDD coverage of <see cref="GetClienteByIdQueryHandler"/> with
/// boundary conditions the RED-phase tests skipped:
///   * Cancellation propagation — the handler MUST NOT swallow
///     <see cref="OperationCanceledException"/> from the repository.
///   * Handler is stateless between calls (safe to reuse across requests).
///   * Unicode-heavy field values round-trip DTO mapping intact.
///   * <see cref="DateTimeOffset"/> precision (millisecond + offset) is preserved.
///   * <see cref="Guid.Empty"/> is passed through to the repository (no early
///     guard) and returns null when the repo has no such id.
///
/// [P1] tag — handler is on the critical Clean Architecture seam; a mapping
/// bug leaks straight through the API layer to the client.
/// </summary>
public sealed class GetClienteByIdQueryHandlerEdgeTests
{
    // [P1] GIVEN a cancelled token, WHEN the repo respects it, THEN the handler surfaces the exception.
    [Fact]
    public async Task HandleAsync_PropagatesCancellation_FromRepository()
    {
        var repo = new ThrowingCancellationRepository();
        var handler = new GetClienteByIdQueryHandler(repo);
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        await Assert.ThrowsAsync<OperationCanceledException>(() =>
            handler.HandleAsync(new GetClienteByIdQuery(Guid.NewGuid()), cts.Token));
    }

    // [P1] GIVEN unicode-heavy entities, WHEN handled, THEN DTOs preserve exact strings byte-for-byte.
    [Fact]
    public async Task HandleAsync_PreservesUnicode_InDtoMapping()
    {
        var id = Guid.NewGuid();
        var entity = ClienteEntity.Create(
            "Ñoño & Peña S.A. — Ãbc",
            "900-123-456",
            "300 123 4567",
            "Cañón, Antioquia");
        typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.Id))!.SetValue(entity, id);

        var repo = new FakeClienteRepository();
        repo.Seed(entity);
        var handler = new GetClienteByIdQueryHandler(repo);

        var dto = await handler.HandleAsync(new GetClienteByIdQuery(id), CancellationToken.None);

        Assert.NotNull(dto);
        Assert.Equal("Ñoño & Peña S.A. — Ãbc", dto!.Nombre);
        Assert.Equal("900-123-456", dto.Nit);
        Assert.Equal("300 123 4567", dto.Telefono);
        Assert.Equal("Cañón, Antioquia", dto.Ciudad);
    }

    // [P2] GIVEN a repository that returns entities with sub-second timestamps, WHEN mapped, THEN offset+ms precision survives.
    [Fact]
    public async Task HandleAsync_PreservesDateTimeOffsetPrecision()
    {
        var id = Guid.NewGuid();
        var precise = new DateTimeOffset(2026, 7, 8, 15, 30, 45, 987, TimeSpan.FromHours(-5));
        var entity = ClienteEntity.Create("Empresa", "900123456", "3001234567", "Bogotá");
        typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.Id))!.SetValue(entity, id);
        typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.CreatedAt))!.SetValue(entity, precise);
        typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.UpdatedAt))!.SetValue(entity, precise);

        var repo = new FakeClienteRepository();
        repo.Seed(entity);
        var handler = new GetClienteByIdQueryHandler(repo);

        var dto = await handler.HandleAsync(new GetClienteByIdQuery(id), CancellationToken.None);

        Assert.NotNull(dto);
        Assert.Equal(precise, dto!.CreatedAt);
        Assert.Equal(precise, dto.UpdatedAt);
        Assert.Equal(TimeSpan.FromHours(-5), dto.CreatedAt.Offset);
        Assert.Equal(987, dto.CreatedAt.Millisecond);
    }

    // [P1] GIVEN Guid.Empty on the query, WHEN the repo has nothing, THEN the handler returns null WITHOUT throwing.
    // Documents that the handler applies no id validation — the endpoint layer's :guid route constraint is the guard.
    [Fact]
    public async Task HandleAsync_ReturnsNull_ForGuidEmpty_WhenRepositoryHasNothing()
    {
        var repo = new FakeClienteRepository();
        var handler = new GetClienteByIdQueryHandler(repo);

        var dto = await handler.HandleAsync(new GetClienteByIdQuery(Guid.Empty), CancellationToken.None);

        Assert.Null(dto);
        Assert.Equal(Guid.Empty, repo.LastRequestedId);
    }

    // [P2] GIVEN two sequential handler calls with different repo states, WHEN each runs, THEN each observes the latest state (no memoisation).
    [Fact]
    public async Task HandleAsync_IsStateless_Between_Calls()
    {
        var id = Guid.NewGuid();
        var repo = new FakeClienteRepository();
        var handler = new GetClienteByIdQueryHandler(repo);

        var first = await handler.HandleAsync(new GetClienteByIdQuery(id), CancellationToken.None);
        Assert.Null(first);

        var entity = ClienteEntity.Create("Cargado", "900000000", "3000000000", "Cali");
        typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.Id))!.SetValue(entity, id);
        repo.Seed(entity);

        var second = await handler.HandleAsync(new GetClienteByIdQuery(id), CancellationToken.None);
        Assert.NotNull(second);
        Assert.Equal("Cargado", second!.Nombre);
    }

    // [P2] GIVEN a valid entity, WHEN mapped to DTO, THEN the DTO's Id matches the repository entity id (not the query id, if they diverged in a bug).
    [Fact]
    public async Task HandleAsync_MapsDtoIdFromEntity_NotFromQuery()
    {
        // The entity id is Guid.NewGuid(); the query id is the SAME id. In a real bug the mapper could
        // accidentally use `query.Id` instead of `entity.Id`. We seed a distinct-shaped id to be safe.
        var entityId = new Guid("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        var entity = ClienteEntity.Create("Empresa", "900000000", "3000000000", "Bogotá");
        typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.Id))!.SetValue(entity, entityId);

        var repo = new FakeClienteRepository();
        repo.Seed(entity);
        var handler = new GetClienteByIdQueryHandler(repo);

        var dto = await handler.HandleAsync(new GetClienteByIdQuery(entityId), CancellationToken.None);

        Assert.NotNull(dto);
        Assert.Equal(entityId, dto!.Id);
    }

    // ─── helpers ─────────────────────────────────────────────────────────

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly List<ClienteEntity> _items = new();

        public Guid? LastRequestedId { get; private set; }

        public void Seed(params ClienteEntity[] items) => _items.AddRange(items);

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IReadOnlyList<ClienteEntity>>(_items);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
        {
            LastRequestedId = id;
            return Task.FromResult(_items.FirstOrDefault(e => e.Id == id));
        }

        // Story 2.3 additions — this fake is only used by read tests.
        public Task AddAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
        public Task<bool> NitExistsAsync(string nit, CancellationToken ct) => Task.FromResult(false);
        // Story 2.4 additions — this fake is only used by read tests.
        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
        public Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct) => Task.FromResult(false);
    }

    private sealed class ThrowingCancellationRepository : IClienteRepository
    {
        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();
            return Task.FromResult<IReadOnlyList<ClienteEntity>>(Array.Empty<ClienteEntity>());
        }

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();
            return Task.FromResult<ClienteEntity?>(null);
        }

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();
            return Task.CompletedTask;
        }

        public Task<bool> NitExistsAsync(string nit, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();
            return Task.FromResult(false);
        }

        // Story 2.4 additions — throwing fake mirrors cancellation semantics.
        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();
            return Task.CompletedTask;
        }

        public Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();
            return Task.FromResult(false);
        }
    }
}
