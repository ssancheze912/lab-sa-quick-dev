using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.2: Client Detail View
/// Epic 2: Client Management (Gestión de Clientes)
///
/// Unit tests for GetClienteByIdQueryHandler — RED Phase
/// Tests fail until GetClienteByIdQueryHandler, GetClienteByIdQuery,
/// and the corresponding IClienteRepository.GetByIdAsync are implemented.
///
/// Acceptance Criteria covered:
///   AC2 — GET /api/v1/clientes/:id returns the correct client DTO
///   AC3 — Returns null for a non-existing id (caller decides HTTP 404)
///   TC-E2-P3-02 — Backend returns 404 for unknown id
/// </summary>
public class GetClienteByIdQueryHandlerTests
{
    // ─────────────────────────────────────────────────────────────────────
    // AC2: Handler returns correct ClienteDto for existing id
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenClienteExists_ReturnsClienteDto()
    {
        // GIVEN: A ClienteEntity with known values is stored in the repository
        var entity = ClienteEntity.Create(
            nombre: "Acme Colombia SA",
            nit: "900111222",
            telefono: "3001234567",
            ciudad: "Bogotá"
        );
        var repository = new FakeClienteRepository(new[] { entity });
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(entity.Id);
        var ct = CancellationToken.None;

        // WHEN: HandleAsync is called with the entity's id
        var result = await handler.HandleAsync(query, ct);

        // THEN: A ClienteDto is returned (not null)
        Assert.NotNull(result);
    }

    [Fact]
    public async Task HandleAsync_WhenClienteExists_MapsAllFieldsToDtoCorrectly()
    {
        // GIVEN: A ClienteEntity with specific field values
        var entity = ClienteEntity.Create(
            nombre: "Acme Colombia SA",
            nit: "900111222",
            telefono: "3001234567",
            ciudad: "Bogotá"
        );
        var repository = new FakeClienteRepository(new[] { entity });
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(entity.Id);

        // WHEN: HandleAsync is called
        var result = await handler.HandleAsync(query, CancellationToken.None);

        // THEN: All four client fields are mapped correctly to the DTO
        Assert.NotNull(result);
        Assert.Equal(entity.Id, result!.Id);
        Assert.Equal("Acme Colombia SA", result.Nombre);
        Assert.Equal("900111222", result.Nit);
        Assert.Equal("3001234567", result.Telefono);
        Assert.Equal("Bogotá", result.Ciudad);
    }

    [Fact]
    public async Task HandleAsync_WhenClienteExists_DtoHasNonEmptyGuidId()
    {
        // GIVEN: A ClienteEntity (Guid auto-assigned by factory method)
        var entity = ClienteEntity.Create("Test SA", "800222333", "3109876543", "Medellín");
        var repository = new FakeClienteRepository(new[] { entity });
        var handler = new GetClienteByIdQueryHandler(repository);

        // WHEN: HandleAsync is called with the entity's id
        var result = await handler.HandleAsync(
            new GetClienteByIdQuery(entity.Id),
            CancellationToken.None
        );

        // THEN: DTO Id is a non-empty Guid (never Guid.Empty)
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result!.Id);
    }

    [Fact]
    public async Task HandleAsync_WhenClienteExists_DtoHasDateTimeOffsetTimestamps()
    {
        // GIVEN: A ClienteEntity with auto-assigned timestamps
        var entity = ClienteEntity.Create("Gamma Corp", "700555666", "3207654321", "Cali");
        var repository = new FakeClienteRepository(new[] { entity });
        var handler = new GetClienteByIdQueryHandler(repository);

        // WHEN: HandleAsync is called
        var result = await handler.HandleAsync(
            new GetClienteByIdQuery(entity.Id),
            CancellationToken.None
        );

        // THEN: DTO timestamps are DateTimeOffset (never DateTime — architectural rule)
        Assert.NotNull(result);
        Assert.NotEqual(default(DateTimeOffset), result!.CreatedAt);
        Assert.NotEqual(default(DateTimeOffset), result!.UpdatedAt);
        // Timestamps must be recent UTC values
        Assert.True(result.CreatedAt > DateTimeOffset.UtcNow.AddMinutes(-1));
        Assert.True(result.UpdatedAt > DateTimeOffset.UtcNow.AddMinutes(-1));
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC3 / TC-E2-P3-02: Handler returns null for non-existing id
    // (caller is responsible for returning HTTP 404)
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenClienteDoesNotExist_ReturnsNull()
    {
        // GIVEN: The repository has no clients
        var repository = new FakeClienteRepository(Array.Empty<ClienteEntity>());
        var handler = new GetClienteByIdQueryHandler(repository);
        var nonExistentId = Guid.NewGuid();
        var query = new GetClienteByIdQuery(nonExistentId);
        var ct = CancellationToken.None;

        // WHEN: HandleAsync is called with a non-existent id
        var result = await handler.HandleAsync(query, ct);

        // THEN: Result is null (caller — endpoint — maps this to HTTP 404)
        Assert.Null(result);
    }

    [Fact]
    public async Task HandleAsync_WhenClienteDoesNotExistAmongMultiple_ReturnsNull()
    {
        // GIVEN: The repository has clients, but not the requested one
        var entities = new[]
        {
            ClienteEntity.Create("Acme Colombia SA", "900111222", "3001234567", "Bogotá"),
            ClienteEntity.Create("Beta Ltda", "800333444", "3109876543", "Medellín"),
        };
        var repository = new FakeClienteRepository(entities);
        var handler = new GetClienteByIdQueryHandler(repository);
        var nonExistentId = Guid.NewGuid(); // a Guid not matching any entity
        var query = new GetClienteByIdQuery(nonExistentId);

        // WHEN: HandleAsync is called with an id that exists in no entity
        var result = await handler.HandleAsync(query, CancellationToken.None);

        // THEN: Result is null (graceful handling — no exception thrown)
        Assert.Null(result);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AC2: Handler passes CancellationToken to repository
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_PassesCancellationToken_ToRepository()
    {
        // GIVEN: A tracking repository that records the cancellation token
        var trackingRepository = new TrackingClienteRepository();
        var handler = new GetClienteByIdQueryHandler(trackingRepository);
        var cts = new CancellationTokenSource();
        var token = cts.Token;
        var id = Guid.NewGuid();

        // WHEN: HandleAsync is called with a specific token
        await handler.HandleAsync(new GetClienteByIdQuery(id), token);

        // THEN: The repository received the same cancellation token
        Assert.Equal(token, trackingRepository.ReceivedToken);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Test Doubles
    // ─────────────────────────────────────────────────────────────────────

    /// <summary>
    /// In-memory fake repository that stores entities and responds to GetByIdAsync.
    /// Used to isolate GetClienteByIdQueryHandler from infrastructure dependencies.
    /// </summary>
    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly IEnumerable<ClienteEntity> _clientes;

        public FakeClienteRepository(IEnumerable<ClienteEntity> clientes)
        {
            _clientes = clientes;
        }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult(_clientes);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_clientes.FirstOrDefault(c => c.Id == id));

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task DeleteAsync(Guid id, CancellationToken ct)
            => Task.CompletedTask;
    }

    /// <summary>
    /// Tracking fake that records the cancellation token passed to GetByIdAsync.
    /// </summary>
    private sealed class TrackingClienteRepository : IClienteRepository
    {
        public CancellationToken ReceivedToken { get; private set; }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult(Enumerable.Empty<ClienteEntity>());

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
        {
            ReceivedToken = ct;
            return Task.FromResult<ClienteEntity?>(null);
        }

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task DeleteAsync(Guid id, CancellationToken ct)
            => Task.CompletedTask;
    }
}
