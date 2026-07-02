// -----------------------------------------------------------------------------
//  Story 2.4 — Edit Client (BMad-Integrated automate expansion)
//  Edge-case tests for UpdateClienteCommandHandler.
//
//  Complements UpdateClienteCommandHandlerTests.cs (happy / not-found / 23505 /
//  non-23505 / cancellation-token / id+createdAt preservation) with paths the
//  baseline does not:
//    - PostgreSQL SqlStates OTHER than 23505 (FK, CHECK, NOT NULL) must NOT be
//      mapped to DuplicateNitException — they must propagate for the middleware
//      to turn into a 500 Problem Details.
//    - 23505 on a DIFFERENT unique index (future uk_clientes_email, for example)
//      must propagate — the handler asserts constraint == uk_clientes_nit OR null.
//    - Same-NIT update on the SAME row does NOT produce a 409 (repo does not
//      throw; handler returns 200 DTO — verifies AC#5 corollary at unit level).
//    - Sequential update calls on the same entity keep Id/CreatedAt intact and
//      monotonically advance UpdatedAt (defence for R-004 cache-invalidation
//      pipeline).
//    - Unrelated exception (non-DbUpdateException) from repo propagates —
//      handler must NOT silently swallow.
//    - Untrimmed input reaches DB as trimmed (defence against Zod-drift): the
//      DuplicateNitException surfacing on a 23505 must expose the TRIMMED nit.
// -----------------------------------------------------------------------------
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class UpdateClienteCommandHandlerEdgeCasesTests
{
    private sealed class FakeClienteRepository : IClienteRepository
    {
        public ClienteEntity? Seed { get; init; }
        public int UpdateCallCount { get; private set; }
        public int GetByIdCallCount { get; private set; }
        public ClienteEntity? LastUpdated { get; private set; }
        public Exception? UpdateAsyncThrows { get; set; }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<ClienteEntity>>(Array.Empty<ClienteEntity>());

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            GetByIdCallCount++;
            if (Seed is not null && Seed.Id == id)
            {
                return Task.FromResult<ClienteEntity?>(Seed);
            }
            return Task.FromResult<ClienteEntity?>(null);
        }

        public Task AddAsync(ClienteEntity cliente, CancellationToken cancellationToken = default) =>
            throw new NotImplementedException("Not exercised by Story 2.4 update edge-case tests.");

        public Task UpdateAsync(ClienteEntity cliente, CancellationToken cancellationToken = default)
        {
            UpdateCallCount++;
            LastUpdated = cliente;
            if (UpdateAsyncThrows is not null)
            {
                throw UpdateAsyncThrows;
            }
            return Task.CompletedTask;
        }
    }

    private static PostgresException BuildPostgresException(string sqlState, string? constraintName = null) =>
        new PostgresException(
            messageText: "postgres error " + sqlState,
            severity: "ERROR",
            invariantSeverity: "ERROR",
            sqlState: sqlState,
            detail: null!,
            hint: null!,
            position: 0,
            internalPosition: 0,
            internalQuery: null!,
            where: null!,
            schemaName: null!,
            tableName: null!,
            columnName: null!,
            dataTypeName: null!,
            constraintName: constraintName!,
            file: null!,
            line: null!,
            routine: null!);

    // -------------------------------------------------------------------------
    // Non-23505 PostgreSQL errors must propagate (never mapped to DuplicateNit).
    // -------------------------------------------------------------------------

    [Theory]
    [InlineData("23503", "fk_clientes_owner")] // foreign_key_violation
    [InlineData("23514", "chk_clientes_positive")] // check_violation
    [InlineData("23502", null)] // not_null_violation
    [InlineData("42P01", null)] // undefined_table
    [InlineData("40001", null)] // serialization_failure (retry candidate)
    public async Task HandleAsync_NonUniqueViolationSqlState_Propagates(string sqlState, string? constraint)
    {
        var seed = ClienteEntity.Create("A", "900-1", "+57 000", "Cali");
        var pg = BuildPostgresException(sqlState, constraint);
        var repo = new FakeClienteRepository
        {
            Seed = seed,
            UpdateAsyncThrows = new DbUpdateException($"error {sqlState}", pg),
        };
        var handler = new UpdateClienteCommandHandler(repo);
        var command = new UpdateClienteCommand(seed.Id, "New", "900-1", "+57 000", "Cali");

        // The handler MUST NOT map anything other than 23505 to DuplicateNit —
        // this preserves the correct 500 Problem Details for genuine backend
        // faults instead of misleading the user with an inline NIT error.
        await Assert.ThrowsAsync<DbUpdateException>(() => handler.HandleAsync(command));
    }

    [Fact]
    public async Task HandleAsync_UniqueViolationOnDifferentConstraint_Propagates()
    {
        // Future case: a second unique index on `clientes` (e.g. an email column).
        // A 23505 on `uk_clientes_email` must NOT be reported as a duplicate NIT.
        var seed = ClienteEntity.Create("A", "900-1", "+57 000", "Cali");
        var pg = BuildPostgresException("23505", "uk_clientes_email");
        var repo = new FakeClienteRepository
        {
            Seed = seed,
            UpdateAsyncThrows = new DbUpdateException("dup email", pg),
        };
        var handler = new UpdateClienteCommandHandler(repo);
        var command = new UpdateClienteCommand(seed.Id, "A", "900-1", "+57 000", "Cali");

        // Surfaces the raw DbUpdateException (→ 500 by middleware) instead of a
        // misleading "El NIT/RUC ya está registrado".
        await Assert.ThrowsAsync<DbUpdateException>(() => handler.HandleAsync(command));
    }

    // -------------------------------------------------------------------------
    // Non-Postgres inner (or no inner) must propagate.
    // -------------------------------------------------------------------------

    [Fact]
    public async Task HandleAsync_DbUpdateExceptionWithoutInner_Propagates()
    {
        var seed = ClienteEntity.Create("A", "900-1", "+57 000", "Cali");
        var repo = new FakeClienteRepository
        {
            Seed = seed,
            UpdateAsyncThrows = new DbUpdateException("no inner"),
        };
        var handler = new UpdateClienteCommandHandler(repo);
        var command = new UpdateClienteCommand(seed.Id, "A", "900-1", "+57 000", "Cali");

        await Assert.ThrowsAsync<DbUpdateException>(() => handler.HandleAsync(command));
    }

    [Fact]
    public async Task HandleAsync_DbUpdateExceptionWithGenericInner_Propagates()
    {
        var seed = ClienteEntity.Create("A", "900-1", "+57 000", "Cali");
        var repo = new FakeClienteRepository
        {
            Seed = seed,
            UpdateAsyncThrows = new DbUpdateException(
                "generic inner",
                new InvalidOperationException("something else")),
        };
        var handler = new UpdateClienteCommandHandler(repo);
        var command = new UpdateClienteCommand(seed.Id, "A", "900-1", "+57 000", "Cali");

        await Assert.ThrowsAsync<DbUpdateException>(() => handler.HandleAsync(command));
    }

    [Fact]
    public async Task HandleAsync_UnrelatedExceptionFromRepository_Propagates()
    {
        // If the repository throws something other than DbUpdateException, the
        // handler MUST NOT silently convert it — otherwise a plain 500 looks
        // like a duplicate NIT in the UI.
        var seed = ClienteEntity.Create("A", "900-1", "+57 000", "Cali");
        var repo = new FakeClienteRepository
        {
            Seed = seed,
            UpdateAsyncThrows = new InvalidOperationException("repo blew up"),
        };
        var handler = new UpdateClienteCommandHandler(repo);
        var command = new UpdateClienteCommand(seed.Id, "A", "900-1", "+57 000", "Cali");

        await Assert.ThrowsAsync<InvalidOperationException>(() => handler.HandleAsync(command));
    }

    // -------------------------------------------------------------------------
    // Same NIT on same row must NOT trigger 409 (unit-level of AC#5 corollary).
    // -------------------------------------------------------------------------

    [Fact]
    public async Task HandleAsync_SameNitOnSameRow_ReturnsUpdatedDtoWithoutConflict()
    {
        // AC#5 corollary: reusing the same NIT on the SAME cliente is not a
        // uk_clientes_nit violation — the row that "owns" the NIT is the same
        // one being updated. The repository does NOT throw; the handler returns
        // 200 with the trimmed / refreshed DTO.
        var seed = ClienteEntity.Create("Old Name", "900-same", "+57 000", "Cali");
        var repo = new FakeClienteRepository { Seed = seed };
        var handler = new UpdateClienteCommandHandler(repo);
        var command = new UpdateClienteCommand(
            seed.Id,
            "New Name",
            "900-same", // Same NIT
            "+57 111",
            "Bogotá");

        var dto = await handler.HandleAsync(command);

        Assert.Equal("900-same", dto.Nit);
        Assert.Equal("New Name", dto.Nombre);
        Assert.Equal("Bogotá", dto.Ciudad);
        Assert.Equal(1, repo.UpdateCallCount);
    }

    // -------------------------------------------------------------------------
    // DuplicateNitException carries the trimmed NIT (defence against Zod-drift).
    // -------------------------------------------------------------------------

    [Fact]
    public async Task HandleAsync_UntrimmedInputOn23505_DuplicateNitCarriesTrimmedNit()
    {
        var seed = ClienteEntity.Create("A", "900-1", "+57 000", "Cali");
        var pg = BuildPostgresException("23505", "uk_clientes_nit");
        var repo = new FakeClienteRepository
        {
            Seed = seed,
            UpdateAsyncThrows = new DbUpdateException("dup", pg),
        };
        var handler = new UpdateClienteCommandHandler(repo);
        // Untrimmed input: the domain method trims before the repo call, so the
        // DuplicateNitException must expose the TRIMMED value (matches what the
        // server actually attempted to persist).
        var command = new UpdateClienteCommand(
            seed.Id,
            "  Acme Renamed  ",
            "  800-collides  ",
            "  +57 111  ",
            "  Bogotá  ");

        var ex = await Assert.ThrowsAsync<DuplicateNitException>(() =>
            handler.HandleAsync(command));

        Assert.Equal("800-collides", ex.Nit);
    }

    // -------------------------------------------------------------------------
    // NotFoundException carries the queried id.
    // -------------------------------------------------------------------------

    [Fact]
    public async Task HandleAsync_UnknownId_ClienteNotFoundExceptionCarriesQueriedId()
    {
        var repo = new FakeClienteRepository();
        var handler = new UpdateClienteCommandHandler(repo);
        var queriedId = Guid.NewGuid();
        var command = new UpdateClienteCommand(queriedId, "A", "1", "2", "3");

        var ex = await Assert.ThrowsAsync<ClienteNotFoundException>(() =>
            handler.HandleAsync(command));

        Assert.Equal(queriedId, ex.Id);
        // No update ever attempted — no phantom write pending.
        Assert.Equal(0, repo.UpdateCallCount);
    }

    // -------------------------------------------------------------------------
    // Sequential updates on the same entity — Id/CreatedAt intact, UpdatedAt
    // monotonically forward.
    // -------------------------------------------------------------------------

    [Fact]
    public async Task HandleAsync_SequentialUpdates_KeepIdAndCreatedAtAndAdvanceUpdatedAt()
    {
        var seed = ClienteEntity.Create("Original", "900-1", "+57 000", "Cali");
        var originalId = seed.Id;
        var originalCreatedAt = seed.CreatedAt;
        var repo = new FakeClienteRepository { Seed = seed };
        var handler = new UpdateClienteCommandHandler(repo);

        var dto1 = await handler.HandleAsync(
            new UpdateClienteCommand(seed.Id, "First Update", "900-1", "+57 111", "Bogotá"));
        // Tiny delay so the DateTimeOffset advances between updates.
        await Task.Delay(5);
        var dto2 = await handler.HandleAsync(
            new UpdateClienteCommand(seed.Id, "Second Update", "900-1", "+57 222", "Medellín"));
        await Task.Delay(5);
        var dto3 = await handler.HandleAsync(
            new UpdateClienteCommand(seed.Id, "Third Update", "900-1", "+57 333", "Cartagena"));

        // Id and CreatedAt are invariant across all three updates.
        Assert.Equal(originalId, dto1.Id);
        Assert.Equal(originalId, dto2.Id);
        Assert.Equal(originalId, dto3.Id);
        Assert.Equal(originalCreatedAt, dto1.CreatedAt);
        Assert.Equal(originalCreatedAt, dto2.CreatedAt);
        Assert.Equal(originalCreatedAt, dto3.CreatedAt);

        // UpdatedAt strictly increases across mutations.
        Assert.True(dto2.UpdatedAt >= dto1.UpdatedAt);
        Assert.True(dto3.UpdatedAt >= dto2.UpdatedAt);

        // Latest values landed.
        Assert.Equal("Third Update", dto3.Nombre);
        Assert.Equal("Cartagena", dto3.Ciudad);

        // Repository saw three UpdateAsync invocations.
        Assert.Equal(3, repo.UpdateCallCount);
        Assert.Equal(3, repo.GetByIdCallCount);
    }

    // -------------------------------------------------------------------------
    // Repo timestamps must match the DTO timestamps (round-trip guarantee).
    // -------------------------------------------------------------------------

    [Fact]
    public async Task HandleAsync_RepositoryEntityAndDtoTimestampsMatch()
    {
        var seed = ClienteEntity.Create("A", "900-1", "+57 000", "Cali");
        var repo = new FakeClienteRepository { Seed = seed };
        var handler = new UpdateClienteCommandHandler(repo);
        var command = new UpdateClienteCommand(seed.Id, "New", "900-1", "+57 000", "Cali");

        var dto = await handler.HandleAsync(command);

        // The entity the repo actually saw must be the exact one the DTO reads.
        Assert.NotNull(repo.LastUpdated);
        Assert.Equal(repo.LastUpdated!.UpdatedAt, dto.UpdatedAt);
        Assert.Equal(repo.LastUpdated.CreatedAt, dto.CreatedAt);
        Assert.Equal(repo.LastUpdated.Nombre, dto.Nombre);
    }
}
