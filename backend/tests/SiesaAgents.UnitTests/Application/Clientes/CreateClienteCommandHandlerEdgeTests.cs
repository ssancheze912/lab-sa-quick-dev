using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.3 — Automate (Edge Cases).
///
/// Expands ATDD coverage of <see cref="CreateClienteCommandHandler"/> with
/// boundary conditions the RED-phase tests skipped:
///   * Cancellation propagation — the handler MUST NOT swallow
///     <see cref="OperationCanceledException"/> raised by the repository during
///     the pre-check or the persistence call.
///   * NIT canonical identity — the case-sensitive comparison contract
///     documented in Task 1 (upper/lower NIT variations are DISTINCT until
///     Story 2.5 revisits it).
///   * Unicode field values round-trip end-to-end (Ñoño, tildes, ampersands)
///     without corruption at the DTO mapping seam.
///   * <see cref="ClienteEntity.Create"/> factory produces a fresh
///     <see cref="Guid"/> (never <see cref="Guid.Empty"/>) and identical
///     <c>CreatedAt</c> / <c>UpdatedAt</c> — regression guard on the domain
///     invariants Story 2.1 declared.
///   * Handler bubbles up unexpected persistence failures — no swallow /
///     retry inside the Application layer (the ExceptionHandlingMiddleware
///     is the single translation seam per Story 1.3).
///   * Handler is stateless between calls (safe to reuse across DI-scoped
///     requests).
///
/// [P1] tag — the Command handler is the Clean Architecture write seam; any
/// bug here leaks through the endpoint to every consumer.
/// </summary>
public sealed class CreateClienteCommandHandlerEdgeTests
{
    // [P1] GIVEN a cancelled token, WHEN NitExistsAsync respects it, THEN the handler surfaces the exception.
    [Fact]
    public async Task HandleAsync_PropagatesCancellation_FromNitExistsAsync()
    {
        var repo = new ThrowingCancellationRepository(throwOnNitExists: true);
        var handler = new CreateClienteCommandHandler(repo);
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        var command = new CreateClienteCommand(
            new CreateClienteRequest("Acme", "900123", "3000000000", "Cali"));

        await Assert.ThrowsAsync<OperationCanceledException>(
            () => handler.HandleAsync(command, cts.Token));
        Assert.Equal(0, repo.AddAsyncCalls);
    }

    // [P1] GIVEN a cancelled token during AddAsync, THEN the exception propagates unwrapped.
    [Fact]
    public async Task HandleAsync_PropagatesCancellation_FromAddAsync()
    {
        var repo = new ThrowingCancellationRepository(throwOnNitExists: false, throwOnAdd: true);
        var handler = new CreateClienteCommandHandler(repo);
        using var cts = new CancellationTokenSource();

        var command = new CreateClienteCommand(
            new CreateClienteRequest("Acme", "900123", "3000000000", "Cali"));

        await Assert.ThrowsAsync<OperationCanceledException>(
            () => handler.HandleAsync(command, cts.Token));
        Assert.Equal(1, repo.NitExistsAsyncCalls);
    }

    // [P1] GIVEN a NIT that only differs in casing from an existing one, WHEN handled, THEN it is treated as
    // a DISTINCT identity (canonical NIT policy from Task 1 — case-sensitive until FR7 revisits it).
    [Fact]
    public async Task HandleAsync_TreatsUpperAndLowerNit_AsDistinctIdentities()
    {
        var repo = new FakeClienteRepository();
        repo.SeedExistingNit("abc123");
        var handler = new CreateClienteCommandHandler(repo);

        var command = new CreateClienteCommand(
            new CreateClienteRequest("Acme", "ABC123", "3000000000", "Cali"));

        var dto = await handler.HandleAsync(command, CancellationToken.None);

        Assert.NotNull(dto);
        Assert.Equal("ABC123", dto!.Nit);
        Assert.Equal(1, repo.AddAsyncCalls);
    }

    // [P1] GIVEN unicode-heavy field values, THEN the DTO round-trips them intact (R-006 mapping seam anchor).
    [Fact]
    public async Task HandleAsync_PreservesUnicode_InAllStringFields()
    {
        var repo = new FakeClienteRepository();
        var handler = new CreateClienteCommandHandler(repo);

        var command = new CreateClienteCommand(new CreateClienteRequest(
            "Ñoño & Peña S.A. — Ãbc",
            "900-123-456",
            "300 123 4567",
            "Cañón, Antioquia"));

        var dto = await handler.HandleAsync(command, CancellationToken.None);

        Assert.NotNull(dto);
        Assert.Equal("Ñoño & Peña S.A. — Ãbc", dto!.Nombre);
        Assert.Equal("900-123-456", dto.Nit);
        Assert.Equal("300 123 4567", dto.Telefono);
        Assert.Equal("Cañón, Antioquia", dto.Ciudad);
    }

    // [P1] GIVEN a valid request, WHEN the entity factory runs, THEN the DTO Id is a fresh Guid (not empty).
    [Fact]
    public async Task HandleAsync_ProducesFreshGuid_NeverGuidEmpty()
    {
        var repo = new FakeClienteRepository();
        var handler = new CreateClienteCommandHandler(repo);

        var command = new CreateClienteCommand(
            new CreateClienteRequest("Acme", "900123", "3000000000", "Cali"));

        var dto = await handler.HandleAsync(command, CancellationToken.None);

        Assert.NotNull(dto);
        Assert.NotEqual(Guid.Empty, dto!.Id);
        // Same handler instance called twice → new id per call.
        var dto2 = await handler.HandleAsync(
            new CreateClienteCommand(new CreateClienteRequest("Acme 2", "900999", "3009999999", "Bogotá")),
            CancellationToken.None);
        Assert.NotEqual(dto.Id, dto2!.Id);
    }

    // [P1] GIVEN a valid request, WHEN the entity factory runs, THEN CreatedAt equals UpdatedAt to the tick.
    [Fact]
    public async Task HandleAsync_SetsCreatedAtAndUpdatedAt_Identically_OnCreation()
    {
        var repo = new FakeClienteRepository();
        var handler = new CreateClienteCommandHandler(repo);

        var command = new CreateClienteCommand(
            new CreateClienteRequest("Acme", "900123", "3000000000", "Cali"));

        var dto = await handler.HandleAsync(command, CancellationToken.None);

        Assert.NotNull(dto);
        Assert.Equal(dto!.CreatedAt, dto.UpdatedAt);
        // Offset is UTC (DateTimeOffset with zero offset — company standard).
        Assert.Equal(TimeSpan.Zero, dto.CreatedAt.Offset);
    }

    // [P1] GIVEN AddAsync throws an unexpected InvalidOperationException, THEN the handler bubbles it
    // up untouched (no swallowing, no retry — ExceptionHandlingMiddleware is the single translation seam).
    [Fact]
    public async Task HandleAsync_BubblesUp_UnexpectedPersistenceExceptions_Untouched()
    {
        var repo = new ThrowingAddRepository();
        var handler = new CreateClienteCommandHandler(repo);

        var command = new CreateClienteCommand(
            new CreateClienteRequest("Acme", "900123", "3000000000", "Cali"));

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.HandleAsync(command, CancellationToken.None));
        Assert.Equal("Simulated DB failure", ex.Message);
        // No hidden translation to ClienteNitConflictException.
        Assert.IsNotType<ClienteNitConflictException>(ex);
    }

    // [P2] GIVEN the same handler instance, WHEN called twice with different NITs, THEN each call is isolated.
    [Fact]
    public async Task HandleAsync_IsStateless_BetweenCalls()
    {
        var repo = new FakeClienteRepository();
        var handler = new CreateClienteCommandHandler(repo);

        var first = await handler.HandleAsync(
            new CreateClienteCommand(new CreateClienteRequest("A", "111", "3001111111", "Cali")),
            CancellationToken.None);
        var second = await handler.HandleAsync(
            new CreateClienteCommand(new CreateClienteRequest("B", "222", "3002222222", "Bogotá")),
            CancellationToken.None);

        Assert.NotNull(first);
        Assert.NotNull(second);
        Assert.NotEqual(first!.Id, second!.Id);
        Assert.Equal(2, repo.AddAsyncCalls);
        Assert.Equal(2, repo.NitExistsAsyncCalls);
    }

    // [P2] GIVEN NIT conflict on the second call only, THEN the first Add persists and the second throws.
    [Fact]
    public async Task HandleAsync_FirstCallSucceeds_SecondCallWithSameNit_ThrowsConflict()
    {
        var repo = new FakeClienteRepository();
        var handler = new CreateClienteCommandHandler(repo);

        var first = await handler.HandleAsync(
            new CreateClienteCommand(new CreateClienteRequest("A", "900123", "3001111111", "Cali")),
            CancellationToken.None);
        Assert.NotNull(first);

        var ex = await Assert.ThrowsAsync<ClienteNitConflictException>(() =>
            handler.HandleAsync(
                new CreateClienteCommand(new CreateClienteRequest("B", "900123", "3002222222", "Bogotá")),
                CancellationToken.None));

        Assert.Equal("900123", ex.Nit);
        Assert.Equal(1, repo.AddAsyncCalls);
    }

    // ─── helpers ─────────────────────────────────────────────────────────

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly HashSet<string> _existingNits = new(StringComparer.Ordinal);
        private readonly List<ClienteEntity> _items = new();

        public int AddAsyncCalls { get; private set; }
        public int NitExistsAsyncCalls { get; private set; }

        public void SeedExistingNit(string nit) => _existingNits.Add(nit);

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IReadOnlyList<ClienteEntity>>(_items);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_items.FirstOrDefault(e => e.Id == id));

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct)
        {
            AddAsyncCalls += 1;
            _items.Add(cliente);
            _existingNits.Add(cliente.Nit);
            return Task.CompletedTask;
        }

        public Task<bool> NitExistsAsync(string nit, CancellationToken ct)
        {
            NitExistsAsyncCalls += 1;
            return Task.FromResult(_existingNits.Contains(nit));
        }

        // Story 2.4 additions — create-edge tests do not exercise updates.
        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
        public Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct) => Task.FromResult(false);
    }

    private sealed class ThrowingCancellationRepository : IClienteRepository
    {
        private readonly bool _throwOnNitExists;
        private readonly bool _throwOnAdd;

        public int NitExistsAsyncCalls { get; private set; }
        public int AddAsyncCalls { get; private set; }

        public ThrowingCancellationRepository(bool throwOnNitExists = false, bool throwOnAdd = false)
        {
            _throwOnNitExists = throwOnNitExists;
            _throwOnAdd = throwOnAdd;
        }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => throw new NotSupportedException("Not used in this test.");

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => throw new NotSupportedException("Not used in this test.");

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct)
        {
            AddAsyncCalls += 1;
            if (_throwOnAdd) throw new OperationCanceledException(ct);
            return Task.CompletedTask;
        }

        public Task<bool> NitExistsAsync(string nit, CancellationToken ct)
        {
            NitExistsAsyncCalls += 1;
            if (_throwOnNitExists) throw new OperationCanceledException(ct);
            return Task.FromResult(false);
        }

        // Story 2.4 additions — cancellation tests do not exercise updates.
        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
        public Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct) => Task.FromResult(false);
    }

    private sealed class ThrowingAddRepository : IClienteRepository
    {
        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => throw new NotSupportedException("Not used in this test.");

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => throw new NotSupportedException("Not used in this test.");

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct)
            => throw new InvalidOperationException("Simulated DB failure");

        public Task<bool> NitExistsAsync(string nit, CancellationToken ct)
            => Task.FromResult(false);

        // Story 2.4 additions — throwing-add tests do not exercise updates.
        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
        public Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct) => Task.FromResult(false);
    }
}
