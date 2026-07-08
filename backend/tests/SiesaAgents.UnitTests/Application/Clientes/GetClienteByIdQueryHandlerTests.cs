using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.2 — ATDD (RED phase).
///
/// Verifies the <see cref="GetClienteByIdQueryHandler"/> Application-layer
/// contract from Task 1:
///   * Returns null when the repository has no matching client (AC #9).
///   * Maps every field of <see cref="ClienteEntity"/> to <see cref="ClienteDto"/>
///     when a client with the requested id exists (AC #8).
///   * Passes the requested id verbatim to the repository lookup (AC #8, #9).
///
/// All tests use a hand-rolled <see cref="FakeClienteRepository"/> — no
/// mocking library — per the Story 2.1/2.2 Testing Standards ("hand-rolled fake
/// class implementing IClienteRepository is preferred over mocking libraries").
///
/// RED until the following symbols exist:
///   - SiesaAgents.Application.Clientes.Queries.GetClienteByIdQuery
///   - SiesaAgents.Application.Clientes.Queries.GetClienteByIdQueryHandler
/// </summary>
public sealed class GetClienteByIdQueryHandlerTests
{
    // GIVEN: repository returns null (no cliente with the requested id).
    // WHEN:  the handler runs.
    // THEN:  the DTO result is null (the endpoint layer converts this into 404).
    [Fact]
    public async Task HandleAsync_ReturnsNull_WhenRepositoryReturnsNull()
    {
        var repo = new FakeClienteRepository();
        var handler = new GetClienteByIdQueryHandler(repo);

        var result = await handler.HandleAsync(
            new GetClienteByIdQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.Null(result);
    }

    // GIVEN: repository returns a single entity with known values.
    // WHEN:  the handler runs.
    // THEN:  every DTO field equals the corresponding entity field (verbatim mapping — AC #8).
    [Fact]
    public async Task HandleAsync_MapsAllFields_FromEntityToDto_WhenFound()
    {
        var id = Guid.NewGuid();
        var createdAt = new DateTimeOffset(2026, 1, 1, 10, 0, 0, TimeSpan.Zero);
        var updatedAt = new DateTimeOffset(2026, 1, 2, 10, 0, 0, TimeSpan.Zero);

        var entity = CreateEntityWith(id, "Empresa Uno", "900123456", "3001234567", "Bogotá",
            createdAt, updatedAt);

        var repo = new FakeClienteRepository();
        repo.Seed(entity);
        var handler = new GetClienteByIdQueryHandler(repo);

        var result = await handler.HandleAsync(
            new GetClienteByIdQuery(id), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(id, result!.Id);
        Assert.Equal("Empresa Uno", result.Nombre);
        Assert.Equal("900123456", result.Nit);
        Assert.Equal("3001234567", result.Telefono);
        Assert.Equal("Bogotá", result.Ciudad);
        Assert.Equal(createdAt, result.CreatedAt);
        Assert.Equal(updatedAt, result.UpdatedAt);
    }

    // GIVEN: a specific Guid on the query.
    // WHEN:  the handler runs.
    // THEN:  the repository is invoked with that same id (no transformation).
    [Fact]
    public async Task HandleAsync_UsesRequestedId_ForRepositoryLookup()
    {
        var requestedId = Guid.NewGuid();
        var repo = new FakeClienteRepository();
        var handler = new GetClienteByIdQueryHandler(repo);

        await handler.HandleAsync(new GetClienteByIdQuery(requestedId), CancellationToken.None);

        Assert.NotNull(repo.LastRequestedId);
        Assert.Equal(requestedId, repo.LastRequestedId);
    }

    // ─── helpers ─────────────────────────────────────────────────────────

    private static ClienteEntity CreateEntityWith(
        Guid id, string nombre, string nit, string telefono, string ciudad,
        DateTimeOffset? createdAt = null, DateTimeOffset? updatedAt = null)
    {
        var entity = ClienteEntity.Create(nombre, nit, telefono, ciudad);
        var type = typeof(ClienteEntity);
        type.GetProperty(nameof(ClienteEntity.Id))!.SetValue(entity, id);
        if (createdAt.HasValue)
            type.GetProperty(nameof(ClienteEntity.CreatedAt))!.SetValue(entity, createdAt.Value);
        if (updatedAt.HasValue)
            type.GetProperty(nameof(ClienteEntity.UpdatedAt))!.SetValue(entity, updatedAt.Value);
        return entity;
    }

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
}
