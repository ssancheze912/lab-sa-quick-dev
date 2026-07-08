using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.4 — Automate (Edge Cases).
///
/// Expands ATDD coverage of <see cref="UpdateClienteCommandHandler"/> with
/// boundary conditions the RED-phase suite skipped:
///   * Cancellation propagation through <c>GetByIdAsync</c>,
///     <c>NitExistsForAnotherAsync</c>, and <c>UpdateAsync</c> — the handler
///     MUST NOT swallow <see cref="OperationCanceledException"/> raised by
///     the repository (Clean Architecture: cancellation flows through).
///   * NIT canonical identity — <c>abc123</c> and <c>ABC123</c> are DISTINCT
///     identities on update (same policy as Create, Story 2.3 Task 1).
///   * Unicode preservation in ALL editable fields (Ñoño, tildes, ampersands,
///     em dashes) round-trips through the entity mutator without corruption.
///   * <c>CreatedAt</c> immutability across multiple sequential updates (AC #9
///     audit-trail regression guard).
///   * Handler bubbles unexpected persistence exceptions unwrapped
///     (<c>ExceptionHandlingMiddleware</c> is the single translation seam per
///     Story 1.3).
///   * Handler is stateless between calls (safe to reuse across DI-scoped
///     requests — same handler instance updates two DIFFERENT rows cleanly).
///   * Order of operations: <c>GetByIdAsync</c> → <c>NitExistsForAnotherAsync</c>
///     → <c>UpdateAsync</c>. A 404 SHORT-CIRCUITS before the NIT check runs
///     (AC #11 — cheapest failure first). A 409 SHORT-CIRCUITS before the
///     write runs (AC #12 — defence-in-depth).
///   * The <c>NitExistsForAnotherAsync</c> call passes the URL's
///     <see cref="Guid"/> AND the request's NIT verbatim (mapping seam).
///
/// [P1] tag — the Command handler is the Clean Architecture write seam for
/// update; any bug here leaks through the endpoint to every consumer.
///
/// Raw <c>Assert.*</c> only (company convention — no FluentAssertions).
/// </summary>
public sealed class UpdateClienteCommandHandlerEdgeTests
{
    private static UpdateClienteRequest ValidRequest(string nit = "900123456") =>
        new("Acme SAS", nit, "3001234567", "Cali");

    // [P1] GIVEN a cancelled token, WHEN GetByIdAsync respects it, THEN the handler surfaces the exception.
    [Fact]
    public async Task HandleAsync_PropagatesCancellation_FromGetByIdAsync()
    {
        var repo = new ThrowingCancellationRepository(throwOnGetById: true);
        var handler = new UpdateClienteCommandHandler(repo);
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        var command = new UpdateClienteCommand(Guid.NewGuid(), ValidRequest());

        await Assert.ThrowsAsync<OperationCanceledException>(
            () => handler.HandleAsync(command, cts.Token));

        // Downstream calls MUST NOT have run.
        Assert.Equal(0, repo.NitExistsForAnotherAsyncCalls);
        Assert.Equal(0, repo.UpdateAsyncCalls);
    }

    // [P1] GIVEN a cancelled token, WHEN NitExistsForAnotherAsync respects it, THEN the handler surfaces the exception.
    [Fact]
    public async Task HandleAsync_PropagatesCancellation_FromNitExistsForAnotherAsync()
    {
        var seeded = ClienteEntity.Create("Existing", "900111000", "3000000000", "Bogotá");
        var repo = new ThrowingCancellationRepository(throwOnNitExistsForAnother: true);
        repo.SeedEntity(seeded);
        var handler = new UpdateClienteCommandHandler(repo);
        using var cts = new CancellationTokenSource();

        var command = new UpdateClienteCommand(seeded.Id, ValidRequest());

        await Assert.ThrowsAsync<OperationCanceledException>(
            () => handler.HandleAsync(command, cts.Token));

        Assert.Equal(1, repo.GetByIdAsyncCalls);
        Assert.Equal(0, repo.UpdateAsyncCalls);
    }

    // [P1] GIVEN a cancelled token, WHEN UpdateAsync throws OCE, THEN the handler surfaces the exception unwrapped.
    [Fact]
    public async Task HandleAsync_PropagatesCancellation_FromUpdateAsync()
    {
        var seeded = ClienteEntity.Create("Existing", "900111000", "3000000000", "Bogotá");
        var repo = new ThrowingCancellationRepository(throwOnUpdate: true);
        repo.SeedEntity(seeded);
        var handler = new UpdateClienteCommandHandler(repo);
        using var cts = new CancellationTokenSource();

        var command = new UpdateClienteCommand(seeded.Id, ValidRequest());

        await Assert.ThrowsAsync<OperationCanceledException>(
            () => handler.HandleAsync(command, cts.Token));

        Assert.Equal(1, repo.GetByIdAsyncCalls);
        Assert.Equal(1, repo.NitExistsForAnotherAsyncCalls);
    }

    // [P1] GIVEN a NIT that only differs in casing from a NIT on ANOTHER row, THEN the exclude-self check
    // treats them as DISTINCT identities (case-sensitive policy per Story 2.3 Task 1).
    [Fact]
    public async Task HandleAsync_TreatsUpperAndLowerNit_AsDistinctIdentities_OnAnotherRow()
    {
        var target = ClienteEntity.Create("Target", "abc123", "3000000000", "Cali");
        var repo = new FakeClienteRepository();
        repo.SeedEntity(target);
        // Seed a DIFFERENT row whose NIT is upper-case variant.
        repo.SeedNitOnAnotherRow("ABC123");
        var handler = new UpdateClienteCommandHandler(repo);

        // Trying to steal the ABC123 (upper) NIT — the exclude-self check compares
        // case-sensitively → NitExistsForAnotherAsync returns true → 409.
        var request = new UpdateClienteRequest("Target", "ABC123", "3000000000", "Cali");
        var command = new UpdateClienteCommand(target.Id, request);

        await Assert.ThrowsAsync<ClienteNitConflictException>(
            () => handler.HandleAsync(command, CancellationToken.None));
    }

    // [P1] GIVEN unicode-heavy request values, THEN the entity round-trips them intact (R-006 mapping seam).
    [Fact]
    public async Task HandleAsync_PreservesUnicode_InAllStringFields()
    {
        var seeded = ClienteEntity.Create("Old", "900000000", "3000000000", "Cali");
        var repo = new FakeClienteRepository();
        repo.SeedEntity(seeded);
        var handler = new UpdateClienteCommandHandler(repo);

        var request = new UpdateClienteRequest(
            "Ñoño & Peña S.A. — Ãbc",
            "900-123-456",
            "300 123 4567",
            "Cañón, Antioquia");
        var command = new UpdateClienteCommand(seeded.Id, request);

        var dto = await handler.HandleAsync(command, CancellationToken.None);

        Assert.NotNull(dto);
        Assert.Equal("Ñoño & Peña S.A. — Ãbc", dto!.Nombre);
        Assert.Equal("900-123-456", dto.Nit);
        Assert.Equal("300 123 4567", dto.Telefono);
        Assert.Equal("Cañón, Antioquia", dto.Ciudad);
    }

    // [P1] GIVEN two sequential updates on the SAME entity, THEN CreatedAt is preserved
    // across BOTH calls (audit-trail immutability regression guard, AC #9).
    [Fact]
    public async Task HandleAsync_PreservesCreatedAt_AcrossMultipleUpdates()
    {
        var seeded = ClienteEntity.Create("Old", "900000000", "3000000000", "Cali");
        var originalCreatedAt = seeded.CreatedAt;
        var repo = new FakeClienteRepository();
        repo.SeedEntity(seeded);
        var handler = new UpdateClienteCommandHandler(repo);

        await Task.Delay(2);
        var first = await handler.HandleAsync(
            new UpdateClienteCommand(seeded.Id, new UpdateClienteRequest("First", "900000000", "3000000000", "Cali")),
            CancellationToken.None);
        await Task.Delay(2);
        var second = await handler.HandleAsync(
            new UpdateClienteCommand(seeded.Id, new UpdateClienteRequest("Second", "900000000", "3000000000", "Cali")),
            CancellationToken.None);

        Assert.NotNull(first);
        Assert.NotNull(second);
        Assert.Equal(originalCreatedAt, first!.CreatedAt);
        Assert.Equal(originalCreatedAt, second!.CreatedAt);
        // UpdatedAt strictly monotonic across the two calls.
        Assert.True(second.UpdatedAt >= first.UpdatedAt);
        Assert.Equal(2, repo.UpdateAsyncCalls);
    }

    // [P1] GIVEN UpdateAsync throws an unexpected InvalidOperationException, THEN the handler bubbles it
    // up untouched (no swallow, no retry — ExceptionHandlingMiddleware is the single translation seam).
    [Fact]
    public async Task HandleAsync_BubblesUp_UnexpectedPersistenceExceptions_Untouched()
    {
        var seeded = ClienteEntity.Create("Old", "900000000", "3000000000", "Cali");
        var repo = new ThrowingUpdateRepository();
        repo.SeedEntity(seeded);
        var handler = new UpdateClienteCommandHandler(repo);

        var command = new UpdateClienteCommand(seeded.Id, ValidRequest());

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.HandleAsync(command, CancellationToken.None));
        Assert.Equal("Simulated DB failure", ex.Message);
        // NOT translated to any domain exception.
        Assert.IsNotType<ClienteNitConflictException>(ex);
    }

    // [P2] GIVEN the same handler instance updates two DIFFERENT rows sequentially, THEN each call is isolated.
    [Fact]
    public async Task HandleAsync_IsStateless_BetweenCallsOnDifferentRows()
    {
        var rowA = ClienteEntity.Create("A", "111", "3001111111", "Cali");
        var rowB = ClienteEntity.Create("B", "222", "3002222222", "Bogotá");
        var repo = new FakeClienteRepository();
        repo.SeedEntity(rowA);
        repo.SeedEntity(rowB);
        var handler = new UpdateClienteCommandHandler(repo);

        var first = await handler.HandleAsync(
            new UpdateClienteCommand(rowA.Id, new UpdateClienteRequest("A-new", "111", "3001111111", "Cali")),
            CancellationToken.None);
        var second = await handler.HandleAsync(
            new UpdateClienteCommand(rowB.Id, new UpdateClienteRequest("B-new", "222", "3002222222", "Bogotá")),
            CancellationToken.None);

        Assert.NotNull(first);
        Assert.NotNull(second);
        Assert.Equal(rowA.Id, first!.Id);
        Assert.Equal(rowB.Id, second!.Id);
        Assert.Equal("A-new", first.Nombre);
        Assert.Equal("B-new", second.Nombre);
        Assert.Equal(2, repo.UpdateAsyncCalls);
        Assert.Equal(2, repo.NitExistsForAnotherAsyncCalls);
    }

    // [P2] GIVEN a 404 (row missing), THEN NitExistsForAnotherAsync is NEVER called (short-circuit before check).
    [Fact]
    public async Task HandleAsync_ShortCircuits_NitExistsCheck_When404()
    {
        var repo = new FakeClienteRepository();
        var handler = new UpdateClienteCommandHandler(repo);

        var command = new UpdateClienteCommand(Guid.NewGuid(), ValidRequest());
        var dto = await handler.HandleAsync(command, CancellationToken.None);

        Assert.Null(dto);
        Assert.Equal(1, repo.GetByIdAsyncCalls);
        Assert.Equal(0, repo.NitExistsForAnotherAsyncCalls);
        Assert.Equal(0, repo.UpdateAsyncCalls);
    }

    // [P2] GIVEN a NIT collision on ANOTHER row, THEN UpdateAsync is NEVER called (defence-in-depth, AC #12).
    [Fact]
    public async Task HandleAsync_ShortCircuits_UpdateAsync_When409()
    {
        var seeded = ClienteEntity.Create("Target", "900111000", "3000000000", "Bogotá");
        var repo = new FakeClienteRepository();
        repo.SeedEntity(seeded);
        repo.SeedNitOnAnotherRow("800000000");
        var handler = new UpdateClienteCommandHandler(repo);

        var request = new UpdateClienteRequest("Target", "800000000", "3000000000", "Bogotá");
        var command = new UpdateClienteCommand(seeded.Id, request);

        await Assert.ThrowsAsync<ClienteNitConflictException>(
            () => handler.HandleAsync(command, CancellationToken.None));

        Assert.Equal(1, repo.GetByIdAsyncCalls);
        Assert.Equal(1, repo.NitExistsForAnotherAsyncCalls);
        Assert.Equal(0, repo.UpdateAsyncCalls);
    }

    // [P2] GIVEN the mapping seam, THEN NitExistsForAnotherAsync is called with the URL id AND the request NIT verbatim.
    [Fact]
    public async Task HandleAsync_PassesCommandId_AndRequestNit_ToNitExistsForAnotherAsync()
    {
        var seeded = ClienteEntity.Create("Target", "900111000", "3000000000", "Bogotá");
        var repo = new FakeClienteRepository();
        repo.SeedEntity(seeded);
        var handler = new UpdateClienteCommandHandler(repo);

        var request = new UpdateClienteRequest("Target", "999888777", "3000000000", "Bogotá");
        var command = new UpdateClienteCommand(seeded.Id, request);

        await handler.HandleAsync(command, CancellationToken.None);

        Assert.Equal(seeded.Id, repo.LastNitExistsForAnotherIdArg);
        Assert.Equal("999888777", repo.LastNitExistsForAnotherNitArg);
    }

    // ─── helpers ─────────────────────────────────────────────────────────

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly List<ClienteEntity> _items = new();
        private readonly HashSet<string> _nitsOnOtherRows = new(StringComparer.Ordinal);

        public int GetByIdAsyncCalls { get; private set; }
        public int NitExistsForAnotherAsyncCalls { get; private set; }
        public int UpdateAsyncCalls { get; private set; }
        public Guid? LastNitExistsForAnotherIdArg { get; private set; }
        public string? LastNitExistsForAnotherNitArg { get; private set; }

        public void SeedEntity(ClienteEntity entity) => _items.Add(entity);
        public void SeedNitOnAnotherRow(string nit) => _nitsOnOtherRows.Add(nit);

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => Task.FromResult<IReadOnlyList<ClienteEntity>>(_items);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
        {
            GetByIdAsyncCalls += 1;
            return Task.FromResult(_items.FirstOrDefault(e => e.Id == id));
        }

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct)
        {
            _items.Add(cliente);
            return Task.CompletedTask;
        }

        public Task<bool> NitExistsAsync(string nit, CancellationToken ct)
            => Task.FromResult(_items.Any(e => e.Nit == nit));

        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
        {
            UpdateAsyncCalls += 1;
            return Task.CompletedTask;
        }

        public Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct)
        {
            NitExistsForAnotherAsyncCalls += 1;
            LastNitExistsForAnotherIdArg = id;
            LastNitExistsForAnotherNitArg = nit;
            if (_nitsOnOtherRows.Contains(nit)) return Task.FromResult(true);
            var other = _items.FirstOrDefault(e => e.Nit == nit && e.Id != id);
            return Task.FromResult(other is not null);
        }
    }

    private sealed class ThrowingCancellationRepository : IClienteRepository
    {
        private readonly bool _throwOnGetById;
        private readonly bool _throwOnNitExistsForAnother;
        private readonly bool _throwOnUpdate;
        private readonly List<ClienteEntity> _items = new();

        public int GetByIdAsyncCalls { get; private set; }
        public int NitExistsForAnotherAsyncCalls { get; private set; }
        public int UpdateAsyncCalls { get; private set; }

        public ThrowingCancellationRepository(
            bool throwOnGetById = false,
            bool throwOnNitExistsForAnother = false,
            bool throwOnUpdate = false)
        {
            _throwOnGetById = throwOnGetById;
            _throwOnNitExistsForAnother = throwOnNitExistsForAnother;
            _throwOnUpdate = throwOnUpdate;
        }

        public void SeedEntity(ClienteEntity entity) => _items.Add(entity);

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => throw new NotSupportedException("Not used in this test.");

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
        {
            GetByIdAsyncCalls += 1;
            if (_throwOnGetById) throw new OperationCanceledException(ct);
            return Task.FromResult(_items.FirstOrDefault(e => e.Id == id));
        }

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct)
            => throw new NotSupportedException("Not used in this test.");

        public Task<bool> NitExistsAsync(string nit, CancellationToken ct)
            => throw new NotSupportedException("Not used in this test.");

        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
        {
            UpdateAsyncCalls += 1;
            if (_throwOnUpdate) throw new OperationCanceledException(ct);
            return Task.CompletedTask;
        }

        public Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct)
        {
            NitExistsForAnotherAsyncCalls += 1;
            if (_throwOnNitExistsForAnother) throw new OperationCanceledException(ct);
            return Task.FromResult(false);
        }
    }

    private sealed class ThrowingUpdateRepository : IClienteRepository
    {
        private readonly List<ClienteEntity> _items = new();

        public void SeedEntity(ClienteEntity entity) => _items.Add(entity);

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
            => throw new NotSupportedException("Not used in this test.");

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
            => Task.FromResult(_items.FirstOrDefault(e => e.Id == id));

        public Task AddAsync(ClienteEntity cliente, CancellationToken ct)
            => throw new NotSupportedException("Not used in this test.");

        public Task<bool> NitExistsAsync(string nit, CancellationToken ct)
            => Task.FromResult(false);

        public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct)
            => throw new InvalidOperationException("Simulated DB failure");

        public Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct)
            => Task.FromResult(false);
    }
}
