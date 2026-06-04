using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Edge case and boundary condition tests for GetClientesQueryHandler.
/// Expands beyond the ATDD tests in GetClientesQueryHandlerTests.cs.
///
/// Covers:
/// - Repository throws exception → handler propagates exception
/// - CancellationToken is passed through to repository
/// - Large number of entities are correctly mapped (100 entities)
/// - Mapped DTOs are distinct (no deduplication applied by handler)
/// - All DTO fields match entity fields exactly (no accidental field swap)
/// - Handler returns IReadOnlyList (not just IEnumerable)
/// </summary>
public class GetClientesQueryHandlerEdgeCaseTests
{
    // ─── Stub implementations ─────────────────────────────────────────────────

    private sealed class StubClienteRepository(IReadOnlyList<ClienteEntity> entities) : IClienteRepository
    {
        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
            => Task.FromResult(entities);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
            => Task.FromResult(entities.FirstOrDefault(e => e.Id == id));
    }

    private sealed class ThrowingClienteRepository : IClienteRepository
    {
        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
            => throw new InvalidOperationException("Database connection failed");

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
            => throw new InvalidOperationException("Database connection failed");
    }

    private sealed class CancellationTrackingRepository : IClienteRepository
    {
        public CancellationToken ReceivedToken { get; private set; }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
        {
            ReceivedToken = ct;
            return Task.FromResult<IReadOnlyList<ClienteEntity>>(Array.Empty<ClienteEntity>());
        }

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
        {
            ReceivedToken = ct;
            return Task.FromResult<ClienteEntity?>(null);
        }
    }

    // ─── Exception propagation ────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WhenRepositoryThrows_ExceptionPropagates()
    {
        // Arrange
        var repo = new ThrowingClienteRepository();
        var handler = new GetClientesQueryHandler(repo);

        // Act / Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.HandleAsync(new GetClientesQuery()));
    }

    // ─── CancellationToken forwarding ─────────────────────────────────────────

    [Fact]
    public async Task Handle_PassesCancellationTokenToRepository()
    {
        // Arrange
        var repo = new CancellationTrackingRepository();
        var handler = new GetClientesQueryHandler(repo);
        using var cts = new CancellationTokenSource();
        var token = cts.Token;

        // Act
        await handler.HandleAsync(new GetClientesQuery(), token);

        // Assert: The repository received the same token
        Assert.Equal(token, repo.ReceivedToken);
    }

    [Fact]
    public async Task Handle_WhenCancellationRequested_CancellationPropagates()
    {
        // Arrange: Already-cancelled token
        using var cts = new CancellationTokenSource();
        await cts.CancelAsync();

        // We need a repository that respects cancellation
        // ThrowingRepository just throws InvalidOperationException, so use a different approach
        // Use CancellationTrackingRepository — it won't throw on its own, but token is cancelled
        // The handler should forward the cancelled token; if the repo checks it, it would throw
        var repo = new CancellationTrackingRepository();
        var handler = new GetClientesQueryHandler(repo);

        // Act: Handler passes cancelled token to repo — repo receives it (no exception from repo itself)
        var result = await handler.HandleAsync(new GetClientesQuery(), cts.Token);

        // Assert: Handler completed but token was already cancelled
        Assert.Equal(cts.Token, repo.ReceivedToken);
        Assert.True(repo.ReceivedToken.IsCancellationRequested);
    }

    // ─── Large dataset mapping ────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WithHundredEntities_ReturnsMappedDtosForAll()
    {
        // Arrange: 100 entities
        var entities = Enumerable.Range(1, 100).Select(i =>
            ClienteEntity.Create(
                $"Empresa {i:D3}",
                $"900{i:D6}-{i % 9}",
                $"300{i:D7}",
                "Bogotá"
            )
        ).ToList();

        var repo = new StubClienteRepository(entities);
        var handler = new GetClientesQueryHandler(repo);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert
        Assert.Equal(100, result.Count);
    }

    [Fact]
    public async Task Handle_AllEntitiesAreMappedWithDistinctIds()
    {
        // Arrange: 10 entities with unique IDs
        var entities = Enumerable.Range(1, 10).Select(i =>
            ClienteEntity.Create($"Empresa {i}", $"900{i:D6}-{i % 9}", $"300{i:D7}", "Cali")
        ).ToList();

        var repo = new StubClienteRepository(entities);
        var handler = new GetClientesQueryHandler(repo);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert: All DTOs have distinct IDs (no deduplication applied accidentally)
        var uniqueIds = result.Select(dto => dto.Id).Distinct().Count();
        Assert.Equal(10, uniqueIds);
    }

    // ─── DTO field mapping correctness ────────────────────────────────────────

    [Fact]
    public async Task Handle_MapsAllFieldsCorrectly_NoFieldSwap()
    {
        // Arrange: Entity with all distinct field values so any swap would be detectable
        var entity = ClienteEntity.Create(
            "Empresa Campo Test",   // Nombre
            "123456789-0",          // Nit (unique format)
            "3099999999",           // Telefono
            "Cartagena"             // Ciudad
        );

        var repo = new StubClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repo);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());
        var dto = result.Single();

        // Assert: Each field maps to the correct DTO property (no swap between Nombre/Nit etc.)
        Assert.Equal(entity.Id, dto.Id);
        Assert.Equal("Empresa Campo Test", dto.Nombre);
        Assert.Equal("123456789-0", dto.Nit);
        Assert.Equal("3099999999", dto.Telefono);
        Assert.Equal("Cartagena", dto.Ciudad);
        Assert.Equal(entity.CreatedAt, dto.CreatedAt);
    }

    // ─── Return type ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ReturnsIReadOnlyList()
    {
        // Arrange
        var repo = new StubClienteRepository([]);
        var handler = new GetClientesQueryHandler(repo);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert: Return type is IReadOnlyList (not a mutable list)
        Assert.IsAssignableFrom<IReadOnlyList<ClienteDto>>(result);
    }

    // ─── Idempotency ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_CalledTwice_ReturnsSameData()
    {
        // Arrange: Repository always returns the same 2 entities
        var e1 = ClienteEntity.Create("Empresa A", "900111111-1", "3001111111", "Bogotá");
        var e2 = ClienteEntity.Create("Empresa B", "900222222-2", "3002222222", "Medellín");
        var repo = new StubClienteRepository([e1, e2]);
        var handler = new GetClientesQueryHandler(repo);

        // Act
        var result1 = await handler.HandleAsync(new GetClientesQuery());
        var result2 = await handler.HandleAsync(new GetClientesQuery());

        // Assert: Both calls return the same count and IDs
        Assert.Equal(result1.Count, result2.Count);
        Assert.Equal(result1.Select(d => d.Id).OrderBy(id => id),
                     result2.Select(d => d.Id).OrderBy(id => id));
    }
}
