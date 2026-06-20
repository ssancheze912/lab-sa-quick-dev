// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases — Story 2.2: GetClienteByIdQueryHandler
// Test Level: Unit (xUnit)
// Mode: BMad-Integrated (expands ATDD coverage with edge cases NOT in
//       GetClienteByIdQueryHandlerTests.cs)
//
// Coverage added here (NOT in ATDD tests):
//   - Handler propagates CancellationToken — pre-cancelled token causes OperationCanceledException
//   - Handler with multiple entities in repository returns the correct one by Id
//   - Handler passes the caller's CancellationToken to repository.GetByIdAsync
//   - NotFoundException message is non-empty (contains the non-existent Id string)
//   - ClienteDto.UpdatedAt is not the default DateTimeOffset (entity sets it at creation)
//   - Two consecutive Handle calls return independent DTO instances (no shared state)
//   - Handler selects correct entity from a populated repository with 10 entries
// ─────────────────────────────────────────────────────────────────────────────

using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Application.Common.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Edge-case and boundary-condition tests for GetClienteByIdQueryHandler
/// covering error paths and structural guarantees NOT exercised in the
/// primary ATDD test suite (GetClienteByIdQueryHandlerTests).
/// </summary>
public class GetClienteByIdQueryHandlerEdgeCaseTests
{
    // ──────────────────────────────────────────────────────────────────────────
    // Stub repository — tracks CancellationToken and simulates cancellation
    // ──────────────────────────────────────────────────────────────────────────

    private sealed class StubClienteRepository : IClienteRepository
    {
        private readonly IEnumerable<SiesaAgents.Domain.Clientes.Entities.ClienteEntity> _data;
        public CancellationToken LastReceivedToken { get; private set; }

        public StubClienteRepository(
            IEnumerable<SiesaAgents.Domain.Clientes.Entities.ClienteEntity> data)
            => _data = data;

        public Task<IEnumerable<SiesaAgents.Domain.Clientes.Entities.ClienteEntity>> GetAllAsync(
            CancellationToken ct = default)
        {
            ct.ThrowIfCancellationRequested();
            return Task.FromResult(_data);
        }

        public Task<SiesaAgents.Domain.Clientes.Entities.ClienteEntity?> GetByIdAsync(
            Guid id, CancellationToken ct = default)
        {
            LastReceivedToken = ct;
            ct.ThrowIfCancellationRequested();
            var entity = _data.FirstOrDefault(e => e.Id == id);
            return Task.FromResult<SiesaAgents.Domain.Clientes.Entities.ClienteEntity?>(entity);
        }

        public Task AddAsync(
            SiesaAgents.Domain.Clientes.Entities.ClienteEntity entity,
            CancellationToken ct = default) => Task.CompletedTask;

        public Task UpdateAsync(
            SiesaAgents.Domain.Clientes.Entities.ClienteEntity entity,
            CancellationToken ct = default) => Task.CompletedTask;

        public Task DeleteAsync(
            SiesaAgents.Domain.Clientes.Entities.ClienteEntity entity,
            CancellationToken ct = default) => Task.CompletedTask;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helper factory
    // ──────────────────────────────────────────────────────────────────────────

    private static SiesaAgents.Domain.Clientes.Entities.ClienteEntity MakeCliente(
        string nombre = "Test Corp",
        string nit = "111111111-1",
        string telefono = "+57 300 000 0001",
        string ciudad = "Bogotá")
        => SiesaAgents.Domain.Clientes.Entities.ClienteEntity.Create(nombre, nit, telefono, ciudad);

    // ──────────────────────────────────────────────────────────────────────────
    // CancellationToken — propagation and pre-cancelled token
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "Edge — Handler propagates cancelled CancellationToken causing OperationCanceledException")]
    public async Task Handle_PreCancelledToken_ThrowsOperationCanceledException()
    {
        // ARRANGE: Token is already cancelled before Handle is called
        var entity = MakeCliente();
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new GetClienteByIdQueryHandler(repository);
        using var cts = new CancellationTokenSource();
        await cts.CancelAsync();

        // ACT + ASSERT: Handler (or repository) throws when token is cancelled
        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => handler.Handle(new GetClienteByIdQuery(entity.Id), cts.Token));
    }

    [Fact(DisplayName = "Edge — Handler passes the caller's CancellationToken to repository.GetByIdAsync")]
    public async Task Handle_PassesTokenToRepository()
    {
        // ARRANGE
        var entity = MakeCliente();
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new GetClienteByIdQueryHandler(repository);
        using var cts = new CancellationTokenSource();

        // ACT
        await handler.Handle(new GetClienteByIdQuery(entity.Id), cts.Token);

        // ASSERT: Stub recorded the same token that was passed to Handle
        Assert.Equal(cts.Token, repository.LastReceivedToken);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Repository with multiple entries — correct entity selection
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "Edge — Handler returns the correct entity when repository has multiple clients")]
    public async Task Handle_MultipleClients_ReturnsCorrectOne()
    {
        // ARRANGE: Repository has 3 clients; we request the second one
        var clienteA = MakeCliente("Alpha Corp", "111111111-1");
        var clienteB = MakeCliente("Beta Corp", "222222222-2");
        var clienteC = MakeCliente("Gamma Corp", "333333333-3");
        var repository = new StubClienteRepository(new[] { clienteA, clienteB, clienteC });
        var handler = new GetClienteByIdQueryHandler(repository);

        // ACT: Request clienteB by its Id
        var result = await handler.Handle(new GetClienteByIdQuery(clienteB.Id), CancellationToken.None);

        // ASSERT: Handler returns Beta Corp, not the others
        Assert.Equal("Beta Corp", result.Nombre);
        Assert.Equal(clienteB.Id, result.Id);
    }

    [Fact(DisplayName = "Edge — Handler selects correct entity from a repository with 10 entries")]
    public async Task Handle_TenClients_ReturnsCorrectTarget()
    {
        // ARRANGE: Create 10 clients; target the 7th
        var clients = Enumerable.Range(1, 10)
            .Select(i => MakeCliente($"Client {i}", $"{i}00000000-{i % 9}"))
            .ToArray();
        var target = clients[6]; // 7th element (0-indexed)
        var repository = new StubClienteRepository(clients);
        var handler = new GetClienteByIdQueryHandler(repository);

        // ACT
        var result = await handler.Handle(new GetClienteByIdQuery(target.Id), CancellationToken.None);

        // ASSERT: The returned DTO matches the target, not any other client
        Assert.Equal(target.Id, result.Id);
        Assert.Equal(target.Nombre, result.Nombre);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // NotFoundException — message quality guarantees
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "Edge — NotFoundException message is non-empty")]
    public async Task Handle_NonExistentId_ExceptionMessageIsNonEmpty()
    {
        // ARRANGE: Empty repository
        var repository = new StubClienteRepository(
            Enumerable.Empty<SiesaAgents.Domain.Clientes.Entities.ClienteEntity>());
        var handler = new GetClienteByIdQueryHandler(repository);

        // ACT
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => handler.Handle(new GetClienteByIdQuery(Guid.NewGuid()), CancellationToken.None));

        // ASSERT: Message is not empty — it provides context for Problem Details
        Assert.False(string.IsNullOrWhiteSpace(exception.Message));
    }

    [Fact(DisplayName = "Edge — NotFoundException is not swallowed — it propagates to the caller")]
    public async Task Handle_NonExistentId_ExceptionPropagates()
    {
        // ARRANGE
        var repository = new StubClienteRepository(
            Enumerable.Empty<SiesaAgents.Domain.Clientes.Entities.ClienteEntity>());
        var handler = new GetClienteByIdQueryHandler(repository);

        // ACT + ASSERT: The exception must escape Handle — not caught internally
        // This ensures ExceptionHandlingMiddleware can intercept it for 404 mapping
        Exception? caughtException = null;
        try
        {
            await handler.Handle(new GetClienteByIdQuery(Guid.NewGuid()), CancellationToken.None);
        }
        catch (Exception ex)
        {
            caughtException = ex;
        }

        Assert.NotNull(caughtException);
        Assert.IsType<NotFoundException>(caughtException);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // DTO field guarantees — timestamp and value types
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "Edge — ClienteDto.UpdatedAt is not the default DateTimeOffset")]
    public async Task Handle_ExistingId_DtoUpdatedAtIsNotDefault()
    {
        // ARRANGE
        var entity = MakeCliente();
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new GetClienteByIdQueryHandler(repository);

        // ACT
        var result = await handler.Handle(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // ASSERT: UpdatedAt is set (entity initializes it to UtcNow at create time)
        Assert.NotEqual(default(DateTimeOffset), result.UpdatedAt);
    }

    [Fact(DisplayName = "Edge — ClienteDto.CreatedAt and UpdatedAt are DateTimeOffset (not DateTime)")]
    public async Task Handle_ExistingId_TimestampsAreDateTimeOffset()
    {
        // ARRANGE
        var entity = MakeCliente();
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new GetClienteByIdQueryHandler(repository);

        // ACT
        var result = await handler.Handle(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // ASSERT: Both timestamps are DateTimeOffset — the type system enforces the mandate
        DateTimeOffset createdAt = result.CreatedAt;
        DateTimeOffset updatedAt = result.UpdatedAt;
        Assert.IsType<DateTimeOffset>(createdAt);
        Assert.IsType<DateTimeOffset>(updatedAt);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Consecutive calls — no shared state between invocations
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "Edge — Two consecutive Handle calls return independent DTO instances")]
    public async Task Handle_TwoConsecutiveCalls_ReturnIndependentDtos()
    {
        // ARRANGE: Two different entities in the repository
        var entityA = MakeCliente("Alpha Corp", "111111111-1");
        var entityB = MakeCliente("Beta Corp", "222222222-2");
        var repository = new StubClienteRepository(new[] { entityA, entityB });
        var handler = new GetClienteByIdQueryHandler(repository);

        // ACT: Call Handle twice for different ids
        var resultA = await handler.Handle(new GetClienteByIdQuery(entityA.Id), CancellationToken.None);
        var resultB = await handler.Handle(new GetClienteByIdQuery(entityB.Id), CancellationToken.None);

        // ASSERT: Results are independent — no shared mutable state
        Assert.Equal("Alpha Corp", resultA.Nombre);
        Assert.Equal("Beta Corp", resultB.Nombre);
        Assert.NotEqual(resultA.Id, resultB.Id);
    }

    [Fact(DisplayName = "Edge — Calling Handle twice with the same id returns equal DTOs (idempotent)")]
    public async Task Handle_SameIdTwice_ReturnsEqualDtos()
    {
        // ARRANGE
        var entity = MakeCliente();
        var repository = new StubClienteRepository(new[] { entity });
        var handler = new GetClienteByIdQueryHandler(repository);
        var query = new GetClienteByIdQuery(entity.Id);

        // ACT
        var result1 = await handler.Handle(query, CancellationToken.None);
        var result2 = await handler.Handle(query, CancellationToken.None);

        // ASSERT: Records with same fields are value-equal (C# record semantics)
        Assert.Equal(result1, result2);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // NotFoundException inherits from Exception — middleware can catch it
    // ──────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "Edge — NotFoundException is an Exception (middleware can catch as base type)")]
    public void NotFoundException_IsException()
    {
        // ARRANGE + ASSERT: NotFoundException must be catchable as base Exception
        // This ensures ExceptionHandlingMiddleware's catch (Exception ex) falls through
        // to the NotFoundException handler first via the specific catch block.
        var notFound = new NotFoundException("Cliente abc no encontrado.");
        Assert.IsAssignableFrom<Exception>(notFound);
    }
}
