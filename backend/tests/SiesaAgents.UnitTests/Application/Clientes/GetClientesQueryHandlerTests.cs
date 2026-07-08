using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.1 — ATDD (RED phase).
///
/// Verifies the <see cref="GetClientesQueryHandler"/> Application-layer
/// contract from Task 3:
///   * Returns an empty list when the repository has no clients (AC #4, #8).
///   * Maps every field of <see cref="ClienteEntity"/> to <see cref="ClienteDto"/>
///     without transformation (AC #8).
///   * Preserves the ordering already applied by the repository (AC #1, #8).
///
/// All tests use a hand-rolled <see cref="FakeClienteRepository"/> — no
/// mocking library — per the Story 2.1 Testing Standards ("hand-rolled fake
/// class implementing IClienteRepository is preferred over mocking libraries").
/// </summary>
public sealed class GetClientesQueryHandlerTests
{
    // GIVEN: repository returns an empty list.
    // WHEN:  the handler is asked to process a GetClientesQuery.
    // THEN:  the resulting DTO list is empty.
    [Fact]
    public async Task HandleAsync_ReturnsEmpty_WhenRepositoryEmpty()
    {
        var repo = new FakeClienteRepository();
        var handler = new GetClientesQueryHandler(repo);

        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Empty(result);
    }

    // GIVEN: repository returns a single entity with known values.
    // WHEN:  the handler runs.
    // THEN:  every DTO field equals the corresponding entity field.
    [Fact]
    public async Task HandleAsync_MapsAllFields_FromEntityToDto()
    {
        var id = Guid.NewGuid();
        var createdAt = new DateTimeOffset(2026, 1, 1, 10, 0, 0, TimeSpan.Zero);
        var updatedAt = new DateTimeOffset(2026, 1, 2, 10, 0, 0, TimeSpan.Zero);

        var entity = CreateEntityWith(id, "Empresa Uno", "900123456", "3001234567", "Bogotá",
            createdAt, updatedAt);

        var repo = new FakeClienteRepository();
        repo.Seed(entity);
        var handler = new GetClientesQueryHandler(repo);

        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        var dto = Assert.Single(result);
        Assert.Equal(id, dto.Id);
        Assert.Equal("Empresa Uno", dto.Nombre);
        Assert.Equal("900123456", dto.Nit);
        Assert.Equal("3001234567", dto.Telefono);
        Assert.Equal("Bogotá", dto.Ciudad);
        Assert.Equal(createdAt, dto.CreatedAt);
        Assert.Equal(updatedAt, dto.UpdatedAt);
    }

    // GIVEN: repository returns a list in a specific order (C, A, B).
    // WHEN:  the handler runs.
    // THEN:  the DTOs are returned in the same order (the handler must NOT reorder).
    [Fact]
    public async Task HandleAsync_PreservesRepositoryOrder()
    {
        var repo = new FakeClienteRepository();
        var c = CreateEntityWith(Guid.NewGuid(), "C-Client", "300000000", "3000000000", "Cali");
        var a = CreateEntityWith(Guid.NewGuid(), "A-Client", "100000000", "3001111111", "Cali");
        var b = CreateEntityWith(Guid.NewGuid(), "B-Client", "200000000", "3002222222", "Cali");
        repo.Seed(c, a, b);

        var handler = new GetClientesQueryHandler(repo);

        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        Assert.Equal(3, result.Count);
        Assert.Equal("C-Client", result[0].Nombre);
        Assert.Equal("A-Client", result[1].Nombre);
        Assert.Equal("B-Client", result[2].Nombre);
    }

    // ─── helpers ─────────────────────────────────────────────────────────

    /// <summary>
    /// Constructs a <see cref="ClienteEntity"/> with fully-controlled fields.
    /// Uses reflection on private setters — acceptable in tests to avoid
    /// mutating the production factory contract.
    /// </summary>
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

        public void Seed(params ClienteEntity[] items) => _items.AddRange(items);

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IReadOnlyList<ClienteEntity>>(_items);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_items.FirstOrDefault(e => e.Id == id));

        // Story 2.3 additions — this fake is only used by read tests.
        public Task AddAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
        public Task<bool> NitExistsAsync(string nit, CancellationToken ct) => Task.FromResult(false);
        // Story 2.4 additions — this fake is only used by read tests.
        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
        public Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct) => Task.FromResult(false);
    }
}
