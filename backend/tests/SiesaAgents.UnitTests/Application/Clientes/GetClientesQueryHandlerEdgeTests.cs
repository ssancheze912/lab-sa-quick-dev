using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.1 — Automate (Edge Cases).
///
/// Expands ATDD coverage of <see cref="GetClientesQueryHandler"/> with
/// boundary conditions:
///   * Cancellation propagation (handler must NOT swallow OperationCanceledException).
///   * Large dataset preservation (500-item fixture — NFR1 target size).
///   * Special/unicode data round-trips DTO mapping intact.
///
/// [P1] tag → handlers are near-critical: mapping errors leak to the API layer.
/// </summary>
public sealed class GetClientesQueryHandlerEdgeTests
{
    // [P1] GIVEN a cancelled token, WHEN the repo respects it, THEN the handler surfaces the exception.
    [Fact]
    public async Task HandleAsync_PropagatesCancellation_FromRepository()
    {
        var repo = new ThrowingCancellationRepository();
        var handler = new GetClientesQueryHandler(repo);
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        await Assert.ThrowsAsync<OperationCanceledException>(() =>
            handler.HandleAsync(new GetClientesQuery(), cts.Token));
    }

    // [P1] GIVEN a 500-item repository, WHEN the handler runs, THEN it maps every item.
    [Fact]
    public async Task HandleAsync_HandlesLargeDataset_500Items()
    {
        var entities = new List<ClienteEntity>(capacity: 500);
        for (var i = 0; i < 500; i++)
        {
            entities.Add(ClienteEntity.Create(
                $"Empresa {i:000}",
                $"900{i:000000}",
                $"300{i:0000000}",
                "Bogotá"));
        }
        var repo = new FakeClienteRepository(entities);
        var handler = new GetClientesQueryHandler(repo);

        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        Assert.Equal(500, result.Count);
        Assert.Equal("Empresa 000", result[0].Nombre);
        Assert.Equal("Empresa 499", result[499].Nombre);
    }

    // [P1] GIVEN unicode-heavy entities, WHEN handled, THEN DTOs preserve exact strings.
    [Fact]
    public async Task HandleAsync_PreservesUnicode_InDtoMapping()
    {
        var entity = ClienteEntity.Create("Ñoño & Peña S.A.", "900-123-456", "300 123 4567", "Cañón, Antioquia");
        var repo = new FakeClienteRepository(new[] { entity });
        var handler = new GetClientesQueryHandler(repo);

        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        var dto = Assert.Single(result);
        Assert.Equal("Ñoño & Peña S.A.", dto.Nombre);
        Assert.Equal("900-123-456", dto.Nit);
        Assert.Equal("300 123 4567", dto.Telefono);
        Assert.Equal("Cañón, Antioquia", dto.Ciudad);
    }

    // [P2] GIVEN a repository that returns exactly one item, WHEN mapped, THEN DateTimeOffset precision is preserved.
    [Fact]
    public async Task HandleAsync_PreservesDateTimeOffsetPrecision()
    {
        var precise = new DateTimeOffset(2026, 7, 8, 15, 30, 45, 123, TimeSpan.FromHours(-5));
        var entity = ClienteEntity.Create("Empresa", "900123456", "3001234567", "Bogotá");
        typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.CreatedAt))!.SetValue(entity, precise);
        typeof(ClienteEntity).GetProperty(nameof(ClienteEntity.UpdatedAt))!.SetValue(entity, precise);

        var repo = new FakeClienteRepository(new[] { entity });
        var handler = new GetClientesQueryHandler(repo);

        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);
        var dto = Assert.Single(result);

        Assert.Equal(precise, dto.CreatedAt);
        Assert.Equal(precise, dto.UpdatedAt);
        Assert.Equal(TimeSpan.FromHours(-5), dto.CreatedAt.Offset);
    }

    // [P2] GIVEN the handler executes twice, WHEN the repository returns different data, THEN each result reflects the latest state.
    [Fact]
    public async Task HandleAsync_IsStateless_Between_Calls()
    {
        var repo = new FakeClienteRepository(new List<ClienteEntity>());
        var handler = new GetClientesQueryHandler(repo);

        var first = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);
        Assert.Empty(first);

        repo.SeedMore(ClienteEntity.Create("Nuevo", "900000000", "3000000000", "Bogotá"));

        var second = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);
        Assert.Single(second);
    }

    // ─── helpers ─────────────────────────────────────────────────────────

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly List<ClienteEntity> _items;

        public FakeClienteRepository(IEnumerable<ClienteEntity> items)
        {
            _items = new List<ClienteEntity>(items);
        }

        public void SeedMore(ClienteEntity entity) => _items.Add(entity);

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IReadOnlyList<ClienteEntity>>(_items);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_items.FirstOrDefault(e => e.Id == id));
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
    }
}
