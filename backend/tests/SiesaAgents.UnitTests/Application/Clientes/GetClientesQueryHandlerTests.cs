using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.1 — Automate expansion.
///
/// Pure unit tests for <see cref="GetClientesQueryHandler"/> that verify the
/// entity → DTO mapping in isolation from EF Core / Postgres. These run
/// everywhere (no Docker required), complementing the Docker-guarded
/// <c>ClienteEndpointsTests</c> integration coverage.
///
/// Priorities:
///   • [P1] Handler returns exactly what the repo returns (no dropping,
///     no reshaping).
///   • [P1] Field-by-field mapping is preserved (id, nombre, nitRuc,
///     telefono, ciudad, createdAt, updatedAt).
///   • [P2] Empty repository maps to empty DTO list (never null).
///   • [P2] CancellationToken is forwarded to the repository call.
/// </summary>
public class GetClientesQueryHandlerTests
{
    [Fact]
    public async Task HandleAsync_returns_empty_list_when_repository_returns_empty()
    {
        // GIVEN: A repository that returns no entities
        var repo = new StubClienteRepository(new List<ClienteEntity>());
        var handler = new GetClientesQueryHandler(repo);

        // WHEN: HandleAsync is invoked
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: The result is a non-null, empty list
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task HandleAsync_returns_all_entities_from_repository()
    {
        // GIVEN: A repository seeded with 3 entities
        var repo = new StubClienteRepository(new List<ClienteEntity>
        {
            new() { Nombre = "A" },
            new() { Nombre = "B" },
            new() { Nombre = "C" },
        });
        var handler = new GetClientesQueryHandler(repo);

        // WHEN: HandleAsync is invoked
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: All 3 entities are mapped
        Assert.Equal(3, result.Count);
        Assert.Contains(result, dto => dto.Nombre == "A");
        Assert.Contains(result, dto => dto.Nombre == "B");
        Assert.Contains(result, dto => dto.Nombre == "C");
    }

    [Fact]
    public async Task HandleAsync_preserves_field_by_field_mapping()
    {
        // GIVEN: A repository with a single fully-populated entity
        var id = Guid.NewGuid();
        var createdAt = new DateTimeOffset(2026, 1, 15, 10, 30, 0, TimeSpan.Zero);
        var updatedAt = new DateTimeOffset(2026, 2, 20, 8, 0, 0, TimeSpan.Zero);
        var entity = new ClienteEntity
        {
            Id = id,
            Nombre = "Cliente Alfa",
            NitRuc = "900123456-7",
            Telefono = "3001112233",
            Ciudad = "Bogotá",
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
        };
        var repo = new StubClienteRepository(new List<ClienteEntity> { entity });
        var handler = new GetClientesQueryHandler(repo);

        // WHEN: HandleAsync is invoked
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: Every field is copied verbatim into the DTO
        Assert.Single(result);
        ClienteDto dto = result[0];
        Assert.Equal(id, dto.Id);
        Assert.Equal("Cliente Alfa", dto.Nombre);
        Assert.Equal("900123456-7", dto.NitRuc);
        Assert.Equal("3001112233", dto.Telefono);
        Assert.Equal("Bogotá", dto.Ciudad);
        Assert.Equal(createdAt, dto.CreatedAt);
        Assert.Equal(updatedAt, dto.UpdatedAt);
    }

    [Fact]
    public async Task HandleAsync_preserves_repository_ordering()
    {
        // GIVEN: A repository returning entities in a specific order
        var e1 = new ClienteEntity { Id = Guid.NewGuid(), Nombre = "Zeta" };
        var e2 = new ClienteEntity { Id = Guid.NewGuid(), Nombre = "Alpha" };
        var e3 = new ClienteEntity { Id = Guid.NewGuid(), Nombre = "Mike" };
        var repo = new StubClienteRepository(new List<ClienteEntity> { e1, e2, e3 });
        var handler = new GetClientesQueryHandler(repo);

        // WHEN: HandleAsync is invoked
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: The order from the repository is preserved (ordering is a
        //       repository concern, not a handler concern — the handler must
        //       not resort).
        Assert.Equal(3, result.Count);
        Assert.Equal("Zeta", result[0].Nombre);
        Assert.Equal("Alpha", result[1].Nombre);
        Assert.Equal("Mike", result[2].Nombre);
    }

    [Fact]
    public async Task HandleAsync_forwards_the_cancellation_token_to_the_repository()
    {
        // GIVEN: A repository that captures the CancellationToken it receives
        var repo = new StubClienteRepository(new List<ClienteEntity>());
        var handler = new GetClientesQueryHandler(repo);
        using var cts = new CancellationTokenSource();

        // WHEN: HandleAsync is invoked with a specific token
        await handler.HandleAsync(new GetClientesQuery(), cts.Token);

        // THEN: The repository observed that exact token instance
        Assert.Equal(cts.Token, repo.LastToken);
    }

    [Fact]
    public async Task HandleAsync_maps_a_500_entity_batch_without_data_loss()
    {
        // GIVEN: The NFR10 boundary — 500 entities
        var seed = Enumerable.Range(0, 500).Select(i => new ClienteEntity
        {
            Id = Guid.NewGuid(),
            Nombre = $"Cliente {i}",
            NitRuc = $"NIT-{i:D6}",
            Telefono = "3001112233",
            Ciudad = "Bogotá",
        }).ToList();
        var repo = new StubClienteRepository(seed);
        var handler = new GetClientesQueryHandler(repo);

        // WHEN: HandleAsync is invoked
        var result = await handler.HandleAsync(new GetClientesQuery());

        // THEN: All 500 mapped, no truncation and each nombre survives
        Assert.Equal(500, result.Count);
        Assert.Equal("Cliente 0", result[0].Nombre);
        Assert.Equal("Cliente 499", result[499].Nombre);
    }

    /// <summary>
    /// Test double for <see cref="IClienteRepository"/> that returns a canned
    /// list and captures the CancellationToken it observed.
    /// </summary>
    private sealed class StubClienteRepository : IClienteRepository
    {
        private readonly IReadOnlyList<ClienteEntity> _entities;

        public StubClienteRepository(IReadOnlyList<ClienteEntity> entities)
        {
            _entities = entities;
        }

        public CancellationToken LastToken { get; private set; }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(
            CancellationToken cancellationToken = default)
        {
            LastToken = cancellationToken;
            return Task.FromResult(_entities);
        }

        public Task<ClienteEntity?> GetByIdAsync(
            Guid id,
            CancellationToken cancellationToken = default)
        {
            LastToken = cancellationToken;
            return Task.FromResult<ClienteEntity?>(_entities.FirstOrDefault(c => c.Id == id));
        }
    }
}
