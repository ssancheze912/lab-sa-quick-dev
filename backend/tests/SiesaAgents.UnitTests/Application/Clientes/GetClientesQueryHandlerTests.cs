// -----------------------------------------------------------------------------
//  Story 2.1 — Client List & Search
//  Unit tests for GetClientesQueryHandler CQRS handler (AC #8).
//  Uses a hand-rolled fake IClienteRepository — no external mock library needed.
// -----------------------------------------------------------------------------
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClientesQueryHandlerTests
{
    private sealed class FakeClienteRepository : IClienteRepository
    {
        public IReadOnlyList<ClienteEntity> Seed { get; init; } = Array.Empty<ClienteEntity>();
        public int GetAllCallCount { get; private set; }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            GetAllCallCount++;
            return Task.FromResult(Seed);
        }

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return Task.FromResult<ClienteEntity?>(Seed.FirstOrDefault(c => c.Id == id));
        }
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsEmpty_ReturnsEmptyList()
    {
        var repo = new FakeClienteRepository();
        var handler = new GetClientesQueryHandler(repo);

        var result = await handler.HandleAsync(new GetClientesQuery());

        Assert.Empty(result);
        Assert.Equal(1, repo.GetAllCallCount);
    }

    [Fact]
    public async Task HandleAsync_WithSeededClientes_ProjectsEachToClienteDto()
    {
        var seed = new List<ClienteEntity>
        {
            ClienteEntity.Create("Acme Corp", "900123456-7", "+57 300 111 1111", "Cali"),
            ClienteEntity.Create("Beta Ltda", "800987654-3", "+57 301 222 2222", "Bogotá"),
        };
        var repo = new FakeClienteRepository { Seed = seed };
        var handler = new GetClientesQueryHandler(repo);

        var result = await handler.HandleAsync(new GetClientesQuery());

        Assert.Equal(2, result.Count);

        var acme = result.Single(c => c.Nombre == "Acme Corp");
        Assert.Equal("900123456-7", acme.Nit);
        Assert.Equal("+57 300 111 1111", acme.Telefono);
        Assert.Equal("Cali", acme.Ciudad);
        // Timestamps propagate as DateTimeOffset — never DateTime.
        Assert.IsType<DateTimeOffset>(acme.CreatedAt);
        Assert.IsType<DateTimeOffset>(acme.UpdatedAt);
    }

    [Fact]
    public async Task HandleAsync_PassesCancellationTokenToRepository()
    {
        var repo = new FakeClienteRepository();
        var handler = new GetClientesQueryHandler(repo);
        using var cts = new CancellationTokenSource();

        var result = await handler.HandleAsync(new GetClientesQuery(), cts.Token);

        Assert.NotNull(result);
        Assert.Equal(1, repo.GetAllCallCount);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Edge cases / expansions (Story 2.1 automate pass)
    // ─────────────────────────────────────────────────────────────────────

    /// <summary>
    /// P1 — Every field of ClienteEntity round-trips onto ClienteDto with no
    /// truncation, no reordering, no accidental defaulting. Locks the projection
    /// map inside GetClientesQueryHandler.
    /// </summary>
    [Fact]
    public async Task HandleAsync_MapsAllSevenFieldsFromEntityToDto()
    {
        var entity = ClienteEntity.Create(
            "Acme Corp",
            "900123456-7",
            "+57 300 111 1111",
            "Cali");
        var repo = new FakeClienteRepository { Seed = new[] { entity } };
        var handler = new GetClientesQueryHandler(repo);

        var result = await handler.HandleAsync(new GetClientesQuery());

        var dto = Assert.Single(result);
        Assert.Equal(entity.Id, dto.Id);
        Assert.Equal(entity.Nombre, dto.Nombre);
        Assert.Equal(entity.Nit, dto.Nit);
        Assert.Equal(entity.Telefono, dto.Telefono);
        Assert.Equal(entity.Ciudad, dto.Ciudad);
        Assert.Equal(entity.CreatedAt, dto.CreatedAt);
        Assert.Equal(entity.UpdatedAt, dto.UpdatedAt);
    }

    /// <summary>
    /// P1 — Ordering is preserved: the handler must not re-sort. Sort behavior
    /// belongs to the repository (Story 2.6 will add explicit ordering).
    /// </summary>
    [Fact]
    public async Task HandleAsync_PreservesRepositoryOrder()
    {
        var a = ClienteEntity.Create("Zeta", "999", "300", "Cali");
        var b = ClienteEntity.Create("Alpha", "888", "301", "Bogotá");
        var c = ClienteEntity.Create("Mango", "777", "302", "Medellín");

        var repo = new FakeClienteRepository { Seed = new[] { a, b, c } };
        var handler = new GetClientesQueryHandler(repo);

        var result = await handler.HandleAsync(new GetClientesQuery());

        Assert.Equal(3, result.Count);
        Assert.Equal("Zeta", result[0].Nombre);
        Assert.Equal("Alpha", result[1].Nombre);
        Assert.Equal("Mango", result[2].Nombre);
    }

    /// <summary>
    /// P1 — The returned type MUST be IReadOnlyList so the API endpoint can't
    /// mutate the projection accidentally. Also verifies the DTO is a record
    /// (value-based equality — useful for downstream deduplication).
    /// </summary>
    [Fact]
    public async Task HandleAsync_ReturnsIReadOnlyListOfClienteDto()
    {
        var repo = new FakeClienteRepository
        {
            Seed = new[] { ClienteEntity.Create("A", "1", "2", "Cali") },
        };
        var handler = new GetClientesQueryHandler(repo);

        var result = await handler.HandleAsync(new GetClientesQuery());

        Assert.IsAssignableFrom<IReadOnlyList<ClienteDto>>(result);
    }

    /// <summary>
    /// P2 — Two identical repository invocations yield DTO instances that are
    /// value-equal (record semantics). This guards the record declaration.
    /// </summary>
    [Fact]
    public async Task HandleAsync_TwoCallsWithSameSeed_ProduceEqualDtos()
    {
        var seed = new[]
        {
            ClienteEntity.Create("Acme Corp", "900123456-7", "+57 300 111 1111", "Cali"),
        };
        var repoA = new FakeClienteRepository { Seed = seed };
        var repoB = new FakeClienteRepository { Seed = seed };

        var resultA = await new GetClientesQueryHandler(repoA).HandleAsync(new GetClientesQuery());
        var resultB = await new GetClientesQueryHandler(repoB).HandleAsync(new GetClientesQuery());

        var dtoA = Assert.Single(resultA);
        var dtoB = Assert.Single(resultB);
        Assert.Equal(dtoA, dtoB); // record equality
    }

    /// <summary>
    /// P2 — Handles a large seed without materializing intermediate collections
    /// twice (regression guard for the .ToList() at the end of the pipeline).
    /// </summary>
    [Fact]
    public async Task HandleAsync_WithLargeSeed_ProjectsEveryEntity()
    {
        var seed = Enumerable
            .Range(1, 250)
            .Select(i => ClienteEntity.Create(
                $"Cliente {i}",
                $"900{i:D6}-1",
                $"+57 300 {i:D4}",
                "Cali"))
            .ToList();
        var repo = new FakeClienteRepository { Seed = seed };
        var handler = new GetClientesQueryHandler(repo);

        var result = await handler.HandleAsync(new GetClientesQuery());

        Assert.Equal(250, result.Count);
        Assert.Equal("Cliente 1", result[0].Nombre);
        Assert.Equal("Cliente 250", result[^1].Nombre);
    }
}
