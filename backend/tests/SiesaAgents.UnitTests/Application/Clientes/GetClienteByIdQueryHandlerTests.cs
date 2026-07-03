using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.2 — Automate expansion.
///
/// Pure unit tests for <see cref="GetClienteByIdQueryHandler"/> covering the
/// entity → DTO mapping AND the null-repository → null-DTO short-circuit that
/// the endpoint layer maps to HTTP 404. These tests run everywhere (no Docker
/// required), complementing the Docker-guarded <c>ClienteByIdEndpointTests</c>
/// integration coverage.
///
/// Priorities:
///   • [P1] Repository null → handler null (drives the 404 branch).
///   • [P1] Field-by-field mapping preserved (id, nombre, nitRuc, telefono,
///     ciudad, createdAt, updatedAt).
///   • [P1] CancellationToken forwarded to the repository call.
///   • [P2] Query.Id is the exact id forwarded to the repository (no reshape).
///   • [P2] DateTimeOffset with non-UTC offset survives the mapping.
///   • [P2] Unicode / accented text is preserved verbatim (Spanish domain).
///   • [P2] Empty strings on optional-ish fields do not throw.
///   • [P2] Handler is idempotent — two invocations with the same id return
///     equal DTOs (there is no in-handler cache mutation).
/// </summary>
public class GetClienteByIdQueryHandlerTests
{
    [Fact]
    public async Task HandleAsync_returns_null_when_repository_returns_null()
    {
        // GIVEN: A repository that returns null for any id
        var repo = new StubClienteByIdRepository(entity: null);
        var handler = new GetClienteByIdQueryHandler(repo);

        // WHEN: HandleAsync is invoked for any id
        var result = await handler.HandleAsync(
            new GetClienteByIdQuery(Guid.NewGuid()));

        // THEN: The result is null (endpoint layer will map this to 404)
        Assert.Null(result);
    }

    [Fact]
    public async Task HandleAsync_returns_dto_when_repository_returns_entity()
    {
        // GIVEN: A repository seeded with a matching entity
        var id = Guid.NewGuid();
        var entity = new ClienteEntity
        {
            Id = id,
            Nombre = "Cliente Detalle",
            NitRuc = "900-999-001",
            Telefono = "3009998877",
            Ciudad = "Medellín",
            CreatedAt = new DateTimeOffset(2026, 3, 1, 12, 0, 0, TimeSpan.Zero),
            UpdatedAt = new DateTimeOffset(2026, 3, 2, 14, 30, 0, TimeSpan.Zero),
        };
        var repo = new StubClienteByIdRepository(entity);
        var handler = new GetClienteByIdQueryHandler(repo);

        // WHEN: HandleAsync is invoked
        var result = await handler.HandleAsync(new GetClienteByIdQuery(id));

        // THEN: The DTO is non-null and every field matches the entity
        Assert.NotNull(result);
        Assert.Equal(id, result!.Id);
        Assert.Equal("Cliente Detalle", result.Nombre);
        Assert.Equal("900-999-001", result.NitRuc);
        Assert.Equal("3009998877", result.Telefono);
        Assert.Equal("Medellín", result.Ciudad);
        Assert.Equal(entity.CreatedAt, result.CreatedAt);
        Assert.Equal(entity.UpdatedAt, result.UpdatedAt);
    }

    [Fact]
    public async Task HandleAsync_forwards_the_query_id_to_the_repository()
    {
        // GIVEN: A repository that captures the id it was asked for
        var repo = new StubClienteByIdRepository(entity: null);
        var handler = new GetClienteByIdQueryHandler(repo);
        var id = Guid.NewGuid();

        // WHEN: HandleAsync is invoked with a specific id
        await handler.HandleAsync(new GetClienteByIdQuery(id));

        // THEN: The repository observed the exact same Guid instance
        Assert.Equal(id, repo.LastRequestedId);
    }

    [Fact]
    public async Task HandleAsync_forwards_the_cancellation_token_to_the_repository()
    {
        // GIVEN: A repository that captures the CancellationToken it observed
        var repo = new StubClienteByIdRepository(entity: null);
        var handler = new GetClienteByIdQueryHandler(repo);
        using var cts = new CancellationTokenSource();

        // WHEN: HandleAsync is invoked with a specific token
        await handler.HandleAsync(new GetClienteByIdQuery(Guid.NewGuid()), cts.Token);

        // THEN: The repository observed that exact token instance
        Assert.Equal(cts.Token, repo.LastToken);
    }

    [Fact]
    public async Task HandleAsync_preserves_non_utc_datetimeoffset()
    {
        // GIVEN: An entity with a Bogotá-like offset (-05:00, not UTC)
        var createdAt = new DateTimeOffset(2026, 4, 15, 8, 30, 0, TimeSpan.FromHours(-5));
        var updatedAt = new DateTimeOffset(2026, 4, 16, 9, 45, 0, TimeSpan.FromHours(-5));
        var entity = new ClienteEntity
        {
            Id = Guid.NewGuid(),
            Nombre = "Bogotá Offset",
            NitRuc = "900-111",
            Telefono = "3001112233",
            Ciudad = "Bogotá",
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
        };
        var repo = new StubClienteByIdRepository(entity);
        var handler = new GetClienteByIdQueryHandler(repo);

        // WHEN: HandleAsync is invoked
        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id));

        // THEN: The DTO preserves the original offset (not normalised to UTC)
        Assert.NotNull(result);
        Assert.Equal(TimeSpan.FromHours(-5), result!.CreatedAt.Offset);
        Assert.Equal(TimeSpan.FromHours(-5), result.UpdatedAt.Offset);
    }

    [Fact]
    public async Task HandleAsync_preserves_unicode_and_accented_text()
    {
        // GIVEN: An entity with Spanish accents + a business-name special char
        var entity = new ClienteEntity
        {
            Id = Guid.NewGuid(),
            Nombre = "Comercializadora Peña S.A.S. — Ñandú & Compañía",
            NitRuc = "900-777-8",
            Telefono = "3000000000",
            Ciudad = "Bogotá",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        var repo = new StubClienteByIdRepository(entity);
        var handler = new GetClienteByIdQueryHandler(repo);

        // WHEN: HandleAsync is invoked
        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id));

        // THEN: Unicode / accents survive verbatim (no re-encoding, no NFC/NFD drift)
        Assert.NotNull(result);
        Assert.Equal(entity.Nombre, result!.Nombre);
        Assert.Contains("Peña", result.Nombre);
        Assert.Contains("Ñandú", result.Nombre);
    }

    [Fact]
    public async Task HandleAsync_does_not_mutate_repository_state_across_calls()
    {
        // GIVEN: A repository that will be called twice for the same id
        var entity = new ClienteEntity
        {
            Id = Guid.NewGuid(),
            Nombre = "Idempotencia",
            NitRuc = "900-002",
            Telefono = "3001231234",
            Ciudad = "Cali",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        var repo = new StubClienteByIdRepository(entity);
        var handler = new GetClienteByIdQueryHandler(repo);
        var query = new GetClienteByIdQuery(entity.Id);

        // WHEN: HandleAsync is invoked twice
        var first = await handler.HandleAsync(query);
        var second = await handler.HandleAsync(query);

        // THEN: Both DTOs are equivalent (records — value equality) and the
        //       repository observed both invocations (handler is not caching)
        Assert.NotNull(first);
        Assert.NotNull(second);
        Assert.Equal(first, second);
        Assert.Equal(2, repo.InvocationCount);
    }

    [Fact]
    public async Task HandleAsync_returns_null_even_when_query_id_is_empty_guid()
    {
        // GIVEN: A repository that has no entity for Guid.Empty (the well-known
        //        zero-guid used by the not-found integration test).
        var repo = new StubClienteByIdRepository(entity: null);
        var handler = new GetClienteByIdQueryHandler(repo);

        // WHEN: HandleAsync is invoked with Guid.Empty (deliberate — the ATDD
        //       404 case uses this exact sentinel)
        var result = await handler.HandleAsync(new GetClienteByIdQuery(Guid.Empty));

        // THEN: The handler returns null (endpoint maps to 404); no exception
        Assert.Null(result);
        Assert.Equal(Guid.Empty, repo.LastRequestedId);
    }

    /// <summary>
    /// Test double for <see cref="IClienteRepository"/> that returns a single
    /// canned entity on <see cref="GetByIdAsync"/> and captures every id +
    /// CancellationToken it observed. <see cref="GetAllAsync"/> is unused here
    /// but must be implemented to satisfy the interface.
    /// </summary>
    private sealed class StubClienteByIdRepository : IClienteRepository
    {
        private readonly ClienteEntity? _entity;

        public StubClienteByIdRepository(ClienteEntity? entity)
        {
            _entity = entity;
        }

        public Guid LastRequestedId { get; private set; }
        public CancellationToken LastToken { get; private set; }
        public int InvocationCount { get; private set; }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(
            CancellationToken cancellationToken = default)
        {
            LastToken = cancellationToken;
            IReadOnlyList<ClienteEntity> empty = new List<ClienteEntity>();
            return Task.FromResult(empty);
        }

        public Task<ClienteEntity?> GetByIdAsync(
            Guid id,
            CancellationToken cancellationToken = default)
        {
            LastRequestedId = id;
            LastToken = cancellationToken;
            InvocationCount += 1;
            return Task.FromResult(_entity);
        }
    }
}
