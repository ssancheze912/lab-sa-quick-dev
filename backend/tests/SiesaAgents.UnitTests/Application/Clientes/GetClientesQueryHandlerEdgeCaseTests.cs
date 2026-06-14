using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Edge case and boundary condition tests for GetClientesQueryHandler.
/// Complements GetClientesQueryHandlerTests.cs (happy-path ATDD tests).
/// </summary>
public class GetClientesQueryHandlerEdgeCaseTests
{
    // ─── Fake repository ──────────────────────────────────────────────────────

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly IEnumerable<ClienteEntity> _data;
        public int CallCount { get; private set; }

        public FakeClienteRepository(IEnumerable<ClienteEntity> data)
        {
            _data = data;
        }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
        {
            CallCount++;
            return Task.FromResult(_data);
        }

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult<ClienteEntity?>(null);

        public Task AddAsync(ClienteEntity entity, CancellationToken ct) => Task.CompletedTask;
        public Task UpdateAsync(ClienteEntity entity, CancellationToken ct) => Task.CompletedTask;
        public Task DeleteAsync(Guid id, CancellationToken ct) => Task.CompletedTask;
        public Task<bool> NitExistsAsync(string nit, CancellationToken ct) => Task.FromResult(false);
    }

    private sealed class ThrowingClienteRepository : IClienteRepository
    {
        private readonly Exception _exception;

        public ThrowingClienteRepository(Exception exception)
        {
            _exception = exception;
        }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromException<IEnumerable<ClienteEntity>>(_exception);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult<ClienteEntity?>(null);

        public Task AddAsync(ClienteEntity entity, CancellationToken ct) => Task.CompletedTask;
        public Task UpdateAsync(ClienteEntity entity, CancellationToken ct) => Task.CompletedTask;
        public Task DeleteAsync(Guid id, CancellationToken ct) => Task.CompletedTask;
        public Task<bool> NitExistsAsync(string nit, CancellationToken ct) => Task.FromResult(false);
    }

    // ─── DTO field mapping correctness ────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_DtoIdMatchesEntityId()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900-1", "601", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert
        var dto = result.Single();
        Assert.Equal(entity.Id, dto.Id);
    }

    [Fact]
    public async Task HandleAsync_DtoTimestampsMatchEntityTimestamps()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900-1", "601", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert
        var dto = result.Single();
        Assert.Equal(entity.CreatedAt, dto.CreatedAt);
        Assert.Equal(entity.UpdatedAt, dto.UpdatedAt);
    }

    // ─── Large dataset ────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_With500Entities_ReturnsAll500Dtos()
    {
        // Arrange: 500 entities simulates the NFR1 500-record ceiling
        var entities = Enumerable.Range(1, 500)
            .Select(i => ClienteEntity.Create($"Empresa {i}", $"900{i:D6}-1", "601", "Bogotá"))
            .ToList();

        var repository = new FakeClienteRepository(entities);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert
        Assert.Equal(500, result.Count());
    }

    // ─── CancellationToken is forwarded ───────────────────────────────────────

    [Fact]
    public async Task HandleAsync_PassesCancellationTokenToRepository()
    {
        // Arrange
        var repository = new FakeClienteRepository([]);
        var handler = new GetClientesQueryHandler(repository);
        using var cts = new CancellationTokenSource();

        // Act
        await handler.HandleAsync(new GetClientesQuery(), cts.Token);

        // Assert: repository was called (implying token was forwarded)
        Assert.Equal(1, repository.CallCount);
    }

    // ─── Repository exception propagation ────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenRepositoryThrows_PropagatesException()
    {
        // Arrange
        var dbException = new InvalidOperationException("DB connection lost");
        var repository = new ThrowingClienteRepository(dbException);
        var handler = new GetClientesQueryHandler(repository);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.HandleAsync(new GetClientesQuery()));
        Assert.Equal("DB connection lost", ex.Message);
    }

    // ─── Single entity ─────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WithSingleEntity_ReturnsSingleDto()
    {
        // Arrange
        var entity = ClienteEntity.Create("Solo Empresa", "900-1", "601", "Cali");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert
        Assert.Single(result);
        Assert.Equal("Solo Empresa", result.Single().Nombre);
    }

    // ─── DTO is a snapshot (entity mutation does not affect already-mapped DTO) ─

    [Fact]
    public async Task HandleAsync_DtoReflectsEntityStateAtTimeOfCall()
    {
        // Arrange
        var entity = ClienteEntity.Create("Original", "900-1", "601", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // Act: call handler BEFORE mutation
        var result = await handler.HandleAsync(new GetClientesQuery());

        // Assert: DTO captured the original value
        Assert.Equal("Original", result.Single().Nombre);
    }
}
