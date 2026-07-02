// -----------------------------------------------------------------------------
//  Story 2.3 — Create Client (BMad-Integrated automate expansion)
//  Edge-case tests for CreateClienteCommandHandler.
//
//  Complements CreateClienteCommandHandlerTests.cs (happy / trim / 23505 with &
//  without constraint name / non-23505 propagates / CT forwarded) with paths
//  the baseline does not:
//    - PostgreSQL SQLSTATEs OTHER than 23505 (FK, CHECK, NOT NULL) must NOT be
//      mapped to DuplicateNitException — they must propagate for the middleware
//      to turn into a 500 Problem Details.
//    - A DbUpdateException with a NON-PostgresException inner (or no inner)
//      must propagate — never swallowed.
//    - Concurrent independent handler calls create distinct entities (no shared
//      state on the handler itself; the entity id is unique per call).
//    - A unique-violation on a DIFFERENT (future) constraint name must NOT be
//      mapped to DuplicateNit — the handler asserts the constraint name matches
//      uk_clientes_nit (or is null, per the existing defensive path).
// -----------------------------------------------------------------------------
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class CreateClienteCommandHandlerEdgeCasesTests
{
    private sealed class FakeClienteRepository : IClienteRepository
    {
        public int AddCallCount { get; private set; }
        public List<ClienteEntity> Added { get; } = new();
        public Exception? AddAsyncThrows { get; init; }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<ClienteEntity>>(Array.Empty<ClienteEntity>());

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult<ClienteEntity?>(null);

        public Task AddAsync(ClienteEntity cliente, CancellationToken cancellationToken = default)
        {
            AddCallCount++;
            Added.Add(cliente);
            if (AddAsyncThrows is not null)
            {
                throw AddAsyncThrows;
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
    [InlineData("40001", null)] // serialization_failure
    public async Task HandleAsync_NonUniqueViolationSqlState_Propagates(string sqlState, string? constraint)
    {
        var pg = BuildPostgresException(sqlState, constraint);
        var repo = new FakeClienteRepository
        {
            AddAsyncThrows = new DbUpdateException($"error {sqlState}", pg),
        };
        var handler = new CreateClienteCommandHandler(repo);
        var command = new CreateClienteCommand("Acme", "900-1", "300", "Cali");

        await Assert.ThrowsAsync<DbUpdateException>(() => handler.HandleAsync(command));
    }

    [Fact]
    public async Task HandleAsync_UniqueViolationOnDifferentConstraint_Propagates()
    {
        // Future case: another unique index on the clientes table (e.g. an email
        // column). A 23505 on `uk_clientes_email` must NOT be reported as a
        // duplicate NIT — the handler asserts the constraint name match.
        var pg = BuildPostgresException("23505", "uk_clientes_email");
        var repo = new FakeClienteRepository
        {
            AddAsyncThrows = new DbUpdateException("dup email", pg),
        };
        var handler = new CreateClienteCommandHandler(repo);
        var command = new CreateClienteCommand("Acme", "900-1", "300", "Cali");

        // Should surface the raw DbUpdateException, not DuplicateNitException,
        // so the middleware can decide (500 by default). The frontend will not
        // see a misleading "El NIT/RUC ya está registrado" for a different
        // unique key.
        await Assert.ThrowsAsync<DbUpdateException>(() => handler.HandleAsync(command));
    }

    // -------------------------------------------------------------------------
    // Non-Postgres inner (or no inner) must propagate.
    // -------------------------------------------------------------------------

    [Fact]
    public async Task HandleAsync_DbUpdateExceptionWithoutInner_Propagates()
    {
        var repo = new FakeClienteRepository
        {
            AddAsyncThrows = new DbUpdateException("no inner"),
        };
        var handler = new CreateClienteCommandHandler(repo);
        var command = new CreateClienteCommand("Acme", "900-1", "300", "Cali");

        await Assert.ThrowsAsync<DbUpdateException>(() => handler.HandleAsync(command));
    }

    [Fact]
    public async Task HandleAsync_DbUpdateExceptionWithGenericInner_Propagates()
    {
        // Simulate EF Core wrapping some non-Npgsql exception (defensive path).
        var repo = new FakeClienteRepository
        {
            AddAsyncThrows = new DbUpdateException(
                "generic inner",
                new InvalidOperationException("something else")),
        };
        var handler = new CreateClienteCommandHandler(repo);
        var command = new CreateClienteCommand("Acme", "900-1", "300", "Cali");

        await Assert.ThrowsAsync<DbUpdateException>(() => handler.HandleAsync(command));
    }

    [Fact]
    public async Task HandleAsync_UnrelatedExceptionFromRepository_Propagates()
    {
        // If the repository throws something other than DbUpdateException (say,
        // an unexpected NRE from a misconfigured DI), the handler MUST NOT
        // silently convert it — otherwise 500s look like duplicate NITs.
        var repo = new FakeClienteRepository
        {
            AddAsyncThrows = new InvalidOperationException("repo blew up"),
        };
        var handler = new CreateClienteCommandHandler(repo);
        var command = new CreateClienteCommand("Acme", "900-1", "300", "Cali");

        await Assert.ThrowsAsync<InvalidOperationException>(() => handler.HandleAsync(command));
    }

    // -------------------------------------------------------------------------
    // DuplicateNitException carries the actual (trimmed) NIT.
    // -------------------------------------------------------------------------

    [Fact]
    public async Task HandleAsync_DuplicateNit_ExceptionCarriesTrimmedNit()
    {
        var pg = BuildPostgresException("23505", "uk_clientes_nit");
        var repo = new FakeClienteRepository
        {
            AddAsyncThrows = new DbUpdateException("dup", pg),
        };
        var handler = new CreateClienteCommandHandler(repo);
        // Simulate untrimmed input — ClienteEntity.Create is expected to trim,
        // so the exception message must reflect the persisted (trimmed) NIT.
        var command = new CreateClienteCommand("  Acme  ", "  900-1  ", "  300  ", "  Cali  ");

        var ex = await Assert.ThrowsAsync<DuplicateNitException>(() => handler.HandleAsync(command));

        Assert.Equal("900-1", ex.Nit);
    }

    // -------------------------------------------------------------------------
    // Handler is stateless w.r.t. commands — each call produces a fresh entity.
    // -------------------------------------------------------------------------

    [Fact]
    public async Task HandleAsync_SequentialCalls_ProduceDistinctEntitiesAndIds()
    {
        var repo = new FakeClienteRepository();
        var handler = new CreateClienteCommandHandler(repo);

        var dto1 = await handler.HandleAsync(new CreateClienteCommand("A", "1", "p", "c"));
        var dto2 = await handler.HandleAsync(new CreateClienteCommand("B", "2", "p", "c"));
        var dto3 = await handler.HandleAsync(new CreateClienteCommand("C", "3", "p", "c"));

        Assert.Equal(3, repo.AddCallCount);
        Assert.Equal(3, repo.Added.Count);

        // All three ids must be unique.
        var ids = new[] { dto1.Id, dto2.Id, dto3.Id };
        Assert.Equal(3, ids.Distinct().Count());
        Assert.All(ids, id => Assert.NotEqual(Guid.Empty, id));
    }

    [Fact]
    public async Task HandleAsync_AllTimestampsRecentAndConsistentWithEntity()
    {
        var repo = new FakeClienteRepository();
        var handler = new CreateClienteCommandHandler(repo);
        var command = new CreateClienteCommand("Acme", "900-1", "300", "Cali");

        var before = DateTimeOffset.UtcNow.AddSeconds(-1);
        var dto = await handler.HandleAsync(command);
        var after = DateTimeOffset.UtcNow.AddSeconds(1);

        // CreatedAt and UpdatedAt live inside the constructed entity; the DTO
        // must expose exactly those values (round-trip guarantee).
        Assert.Single(repo.Added);
        Assert.Equal(repo.Added[0].CreatedAt, dto.CreatedAt);
        Assert.Equal(repo.Added[0].UpdatedAt, dto.UpdatedAt);

        Assert.InRange(dto.CreatedAt, before, after);
        Assert.InRange(dto.UpdatedAt, before, after);
    }
}
