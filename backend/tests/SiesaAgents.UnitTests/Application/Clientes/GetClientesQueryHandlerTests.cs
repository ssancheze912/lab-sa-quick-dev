using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.1: Client List &amp; Search
/// Epic 2: Client Management (Gestión de Clientes)
///
/// Unit tests for GetClientesQueryHandler — RED Phase
/// Tests fail until GetClientesQueryHandler, IClienteRepository, ClienteEntity,
/// and ClienteDto are implemented.
///
/// Acceptance Criteria covered:
///   AC1 — GET /api/v1/clientes returns a list of all clients
///   TC-E2-P1-17 — Backend API returns client list with correct DTO shape
/// </summary>
public class GetClientesQueryHandlerTests
{
    // ─────────────────────────────────────────────────────────────────────
    // TC-E2-P1-17 — AC1: Handler returns empty list when no clients exist
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenNoClientsExist_ReturnsEmptyList()
    {
        // GIVEN: IClienteRepository returns an empty collection
        var repository = new FakeClienteRepository(Array.Empty<ClienteEntity>());
        var handler = new GetClientesQueryHandler(repository);
        var query = new GetClientesQuery();
        var ct = CancellationToken.None;

        // WHEN: HandleAsync is called
        var result = await handler.HandleAsync(query, ct);

        // THEN: The result is an empty enumerable (not null)
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    // ─────────────────────────────────────────────────────────────────────
    // TC-E2-P1-17 — AC1: Handler maps entity fields to DTO fields correctly
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenClientsExist_MapsEntityFieldsToDtoCorrectly()
    {
        // GIVEN: A ClienteEntity with known field values is returned by the repository
        var entity = ClienteEntity.Create(
            nombre: "Acme Colombia SA",
            nit: "900111222",
            telefono: "3001234567",
            ciudad: "Bogotá"
        );

        var repository = new FakeClienteRepository(new[] { entity });
        var handler = new GetClientesQueryHandler(repository);
        var query = new GetClientesQuery();
        var ct = CancellationToken.None;

        // WHEN: HandleAsync is called
        var result = await handler.HandleAsync(query, ct);
        var dtos = result.ToList();

        // THEN: DTO contains the same values as the entity
        Assert.Single(dtos);
        var dto = dtos[0];

        Assert.Equal(entity.Id, dto.Id);
        Assert.Equal("Acme Colombia SA", dto.Nombre);
        Assert.Equal("900111222", dto.Nit);
        Assert.Equal("3001234567", dto.Telefono);
        Assert.Equal("Bogotá", dto.Ciudad);
    }

    [Fact]
    public async Task HandleAsync_WhenClientsExist_DtoHasNonEmptyId()
    {
        // GIVEN: A ClienteEntity is created (Guid auto-assigned by Entity base)
        var entity = ClienteEntity.Create("Test SA", "800222333", "3109876543", "Medellín");
        var repository = new FakeClienteRepository(new[] { entity });
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: HandleAsync is called
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);
        var dtos = result.ToList();

        // THEN: DTO Id is a non-empty Guid
        Assert.Single(dtos);
        Assert.NotEqual(Guid.Empty, dtos[0].Id);
    }

    [Fact]
    public async Task HandleAsync_WhenClientsExist_DtoHasDateTimeOffsetTimestamps()
    {
        // GIVEN: A ClienteEntity is created (CreatedAt and UpdatedAt auto-assigned)
        var entity = ClienteEntity.Create("Gamma Corp", "700555666", "3207654321", "Cali");
        var repository = new FakeClienteRepository(new[] { entity });
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: HandleAsync is called
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);
        var dto = result.First();

        // THEN: DTO timestamps are DateTimeOffset and not default (architectural rule: never DateTime)
        Assert.NotEqual(default(DateTimeOffset), dto.CreatedAt);
        Assert.NotEqual(default(DateTimeOffset), dto.UpdatedAt);
        // Timestamps should be recent UTC values
        Assert.True(dto.CreatedAt > DateTimeOffset.UtcNow.AddMinutes(-1));
        Assert.True(dto.UpdatedAt > DateTimeOffset.UtcNow.AddMinutes(-1));
    }

    [Fact]
    public async Task HandleAsync_WhenMultipleClientsExist_ReturnsAllClients()
    {
        // GIVEN: Repository has 3 ClienteEntity instances
        var entities = new[]
        {
            ClienteEntity.Create("Acme Colombia SA", "900111222", "3001234567", "Bogotá"),
            ClienteEntity.Create("Beta Ltda", "800333444", "3109876543", "Medellín"),
            ClienteEntity.Create("Gamma Corp", "700555666", "3207654321", "Cali"),
        };

        var repository = new FakeClienteRepository(entities);
        var handler = new GetClientesQueryHandler(repository);

        // WHEN: HandleAsync is called
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // THEN: All 3 clients are returned as DTOs
        Assert.Equal(3, result.Count());
    }

    [Fact]
    public async Task HandleAsync_PassesCancellationToken_ToRepository()
    {
        // GIVEN: A cancellation token is provided
        var repository = new TrackingClienteRepository();
        var handler = new GetClientesQueryHandler(repository);
        var cts = new CancellationTokenSource();
        var token = cts.Token;

        // WHEN: HandleAsync is called with the token
        await handler.HandleAsync(new GetClientesQuery(), token);

        // THEN: Repository received the same cancellation token
        Assert.Equal(token, repository.ReceivedToken);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Test Doubles
    // ─────────────────────────────────────────────────────────────────────

    /// <summary>
    /// In-memory fake repository that returns a predetermined set of ClienteEntity objects.
    /// Used to isolate GetClientesQueryHandler from infrastructure dependencies.
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
    /// Tracking fake that records whether the cancellation token was correctly forwarded.
    /// </summary>
    private sealed class TrackingClienteRepository : IClienteRepository
    {
        public CancellationToken ReceivedToken { get; private set; }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
        {
            ReceivedToken = ct;
            return Task.FromResult(Enumerable.Empty<ClienteEntity>());
        }

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult<ClienteEntity?>(null);

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
            => Task.CompletedTask;

        public Task DeleteAsync(Guid id, CancellationToken ct)
            => Task.CompletedTask;
    }
}
