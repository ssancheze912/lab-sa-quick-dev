// -----------------------------------------------------------------------------
//  Story 2.2 — Client Detail View
//  Unit tests for GetClienteByIdQueryHandler CQRS handler (AC #5, #8, #9).
//  Uses a hand-rolled fake IClienteRepository — no external mock library.
// -----------------------------------------------------------------------------
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClienteByIdQueryHandlerTests
{
    private sealed class FakeClienteRepository : IClienteRepository
    {
        public ClienteEntity? SeedOne { get; init; }
        public int GetByIdCallCount { get; private set; }
        public Guid? LastRequestedId { get; private set; }
        public CancellationToken LastCancellationToken { get; private set; }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<ClienteEntity>>(Array.Empty<ClienteEntity>());
        }

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            GetByIdCallCount++;
            LastRequestedId = id;
            LastCancellationToken = cancellationToken;
            if (SeedOne is not null && SeedOne.Id == id)
            {
                return Task.FromResult<ClienteEntity?>(SeedOne);
            }
            return Task.FromResult<ClienteEntity?>(null);
        }
    }

    [Fact]
    public async Task HandleAsync_ExistingId_ReturnsDtoWithAllSevenFields()
    {
        var entity = ClienteEntity.Create("Acme Corp", "900123456-7", "+57 300 111 1111", "Cali");
        var repo = new FakeClienteRepository { SeedOne = entity };
        var handler = new GetClienteByIdQueryHandler(repo);

        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id));

        Assert.NotNull(result);
        Assert.Equal(entity.Id, result!.Id);
        Assert.Equal(entity.Nombre, result.Nombre);
        Assert.Equal(entity.Nit, result.Nit);
        Assert.Equal(entity.Telefono, result.Telefono);
        Assert.Equal(entity.Ciudad, result.Ciudad);
        Assert.Equal(entity.CreatedAt, result.CreatedAt);
        Assert.Equal(entity.UpdatedAt, result.UpdatedAt);
        Assert.Equal(1, repo.GetByIdCallCount);
        Assert.Equal(entity.Id, repo.LastRequestedId);
    }

    [Fact]
    public async Task HandleAsync_UnknownId_ReturnsNull()
    {
        var repo = new FakeClienteRepository();
        var handler = new GetClienteByIdQueryHandler(repo);
        var unknownId = Guid.NewGuid();

        var result = await handler.HandleAsync(new GetClienteByIdQuery(unknownId));

        Assert.Null(result);
        Assert.Equal(1, repo.GetByIdCallCount);
        Assert.Equal(unknownId, repo.LastRequestedId);
    }

    [Fact]
    public async Task HandleAsync_PassesCancellationTokenToRepository()
    {
        var repo = new FakeClienteRepository();
        var handler = new GetClienteByIdQueryHandler(repo);
        using var cts = new CancellationTokenSource();

        var result = await handler.HandleAsync(new GetClienteByIdQuery(Guid.NewGuid()), cts.Token);

        Assert.Null(result);
        Assert.Equal(cts.Token, repo.LastCancellationToken);
    }

    [Fact]
    public async Task HandleAsync_TimestampsRoundTripAsDateTimeOffset()
    {
        var entity = ClienteEntity.Create("Beta", "800987654-3", "+57 301", "Bogotá");
        var repo = new FakeClienteRepository { SeedOne = entity };
        var handler = new GetClienteByIdQueryHandler(repo);

        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id));

        Assert.NotNull(result);
        Assert.IsType<DateTimeOffset>(result!.CreatedAt);
        Assert.IsType<DateTimeOffset>(result.UpdatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Edge cases / expansions (Story 2.2 automate pass)
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_GuidEmpty_QueriesRepositoryAndReturnsNull()
    {
        // GIVEN: An empty repo (no seed) and Guid.Empty as the requested id.
        var repo = new FakeClienteRepository();
        var handler = new GetClienteByIdQueryHandler(repo);

        // WHEN: Handler is invoked with Guid.Empty
        var result = await handler.HandleAsync(new GetClienteByIdQuery(Guid.Empty));

        // THEN: The handler still consults the repo (no short-circuit) and
        // returns null so the endpoint maps that to 404 uniformly (endpoint
        // never crashes on a caller passing all-zero guids).
        Assert.Null(result);
        Assert.Equal(1, repo.GetByIdCallCount);
        Assert.Equal(Guid.Empty, repo.LastRequestedId);
    }

    [Fact]
    public async Task HandleAsync_TwoDifferentIds_MakesTwoRepositoryCalls()
    {
        // GIVEN: A repo with one seed cliente and a handler that shouldn't cache.
        var entity = ClienteEntity.Create("Acme Corp", "900123456-7", "+57 300", "Cali");
        var repo = new FakeClienteRepository { SeedOne = entity };
        var handler = new GetClienteByIdQueryHandler(repo);

        // WHEN: The same handler is invoked twice with two distinct ids
        var first = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id));
        var second = await handler.HandleAsync(new GetClienteByIdQuery(Guid.NewGuid()));

        // THEN: Both queries reached the repository — application layer is
        // stateless (the caching contract lives in TanStack Query, not here).
        Assert.NotNull(first);
        Assert.Null(second);
        Assert.Equal(2, repo.GetByIdCallCount);
    }

    [Fact]
    public async Task HandleAsync_ExistingId_ProducesRecordEqualityForRepeatCalls()
    {
        // GIVEN: A repo seeded with one entity
        var entity = ClienteEntity.Create("Gamma Industrial", "901234567-8", "+57 302", "Medellín");
        var repo = new FakeClienteRepository { SeedOne = entity };
        var handler = new GetClienteByIdQueryHandler(repo);

        // WHEN: The handler is invoked twice with the same id
        var first = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id));
        var second = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id));

        // THEN: Both DTOs are structurally equal — ClienteDto is a record with
        // value semantics; the handler must not mutate anything between calls.
        Assert.NotNull(first);
        Assert.NotNull(second);
        Assert.Equal(first, second);
    }

    [Fact]
    public async Task HandleAsync_ExistingId_ReturnsDtoWithExactSevenFieldStructure()
    {
        // GIVEN: A repo with one seed entity and the ClienteDto record definition.
        var entity = ClienteEntity.Create("Delta", "900000000-1", "+57 000", "Cali");
        var repo = new FakeClienteRepository { SeedOne = entity };
        var handler = new GetClienteByIdQueryHandler(repo);

        // WHEN: The handler produces the DTO
        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id));

        // THEN: ClienteDto records expose exactly 7 public read-model members
        // (Id, Nombre, Nit, Telefono, Ciudad, CreatedAt, UpdatedAt).
        // If Story 2.4 (edit) adds a field this test will fail on purpose —
        // the wire contract must be re-validated.
        Assert.NotNull(result);
        var properties = typeof(SiesaAgents.Application.Clientes.DTOs.ClienteDto)
            .GetProperties(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
        Assert.Equal(7, properties.Length);
        // AND: the property NAMES match the DTO contract (case-sensitive)
        var names = properties.Select(p => p.Name).OrderBy(n => n).ToArray();
        Assert.Equal(
            new[] { "Ciudad", "CreatedAt", "Id", "Nit", "Nombre", "Telefono", "UpdatedAt" },
            names);
    }
}
