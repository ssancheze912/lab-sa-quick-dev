// -----------------------------------------------------------------------------
//  Story 2.3 — Create Client
//  Unit tests for CreateClienteCommandHandler (AC #4, #5, #7).
//  Verifies: happy path -> DTO; PostgreSQL 23505 -> DuplicateNitException;
//  other DbUpdateException -> propagates; cancellation token forwarded.
// -----------------------------------------------------------------------------
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class CreateClienteCommandHandlerTests
{
    /// <summary>
    /// Hand-rolled fake with programmable AddAsync behavior. Records the last
    /// ClienteEntity that was passed in so we can assert on trim + field mapping.
    /// </summary>
    private sealed class FakeClienteRepository : IClienteRepository
    {
        public int AddCallCount { get; private set; }
        public ClienteEntity? LastAdded { get; private set; }
        public CancellationToken LastCancellationToken { get; private set; }
        public Exception? AddAsyncThrows { get; init; }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<ClienteEntity>>(Array.Empty<ClienteEntity>());
        }

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return Task.FromResult<ClienteEntity?>(null);
        }

        public Task AddAsync(ClienteEntity cliente, CancellationToken cancellationToken = default)
        {
            AddCallCount++;
            LastAdded = cliente;
            LastCancellationToken = cancellationToken;
            if (AddAsyncThrows is not null)
            {
                throw AddAsyncThrows;
            }
            return Task.CompletedTask;
        }

        public Task UpdateAsync(ClienteEntity cliente, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException("Story 2.4 stub — not used by CreateClienteCommandHandler tests.");
        }
    }

    /// <summary>
    /// Build a synthetic PostgresException with the given SqlState and optional
    /// constraint name. Uses the public 18-arg ctor exposed by Npgsql 10 —
    /// order is (messageText, severity, invariantSeverity, sqlState, detail,
    /// hint, position, internalPosition, internalQuery, where, schemaName,
    /// tableName, columnName, dataTypeName, constraintName, file, line, routine).
    /// </summary>
    private static PostgresException BuildPostgresException(string sqlState, string? constraintName = null)
    {
        return new PostgresException(
            messageText: "duplicate key value violates unique constraint",
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
    }

    [Fact]
    public async Task HandleAsync_ValidCommand_ReturnsDtoAndPersists()
    {
        var repo = new FakeClienteRepository();
        var handler = new CreateClienteCommandHandler(repo);
        var command = new CreateClienteCommand("Acme Corp", "900123456-7", "+57 300 111 1111", "Cali");

        var dto = await handler.HandleAsync(command);

        Assert.Equal(1, repo.AddCallCount);
        Assert.NotNull(repo.LastAdded);
        Assert.Equal("Acme Corp", repo.LastAdded!.Nombre);
        Assert.Equal("900123456-7", repo.LastAdded.Nit);

        Assert.NotEqual(Guid.Empty, dto.Id);
        Assert.Equal("Acme Corp", dto.Nombre);
        Assert.Equal("900123456-7", dto.Nit);
        Assert.Equal("+57 300 111 1111", dto.Telefono);
        Assert.Equal("Cali", dto.Ciudad);
        Assert.True((DateTimeOffset.UtcNow - dto.CreatedAt).Duration() < TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task HandleAsync_TrimsFieldsBeforePersist()
    {
        var repo = new FakeClienteRepository();
        var handler = new CreateClienteCommandHandler(repo);
        var command = new CreateClienteCommand("  Acme  ", "  900-1  ", "  300  ", "  Cali  ");

        var dto = await handler.HandleAsync(command);

        Assert.Equal("Acme", dto.Nombre);
        Assert.Equal("900-1", dto.Nit);
        Assert.Equal("300", dto.Telefono);
        Assert.Equal("Cali", dto.Ciudad);
    }

    [Fact]
    public async Task HandleAsync_RepositoryThrowsUniqueViolation_ThrowsDuplicateNit()
    {
        var pg = BuildPostgresException("23505", "uk_clientes_nit");
        var repo = new FakeClienteRepository
        {
            AddAsyncThrows = new DbUpdateException("duplicate", pg),
        };
        var handler = new CreateClienteCommandHandler(repo);
        var command = new CreateClienteCommand("Acme Corp", "900123456-7", "+57 300", "Cali");

        var ex = await Assert.ThrowsAsync<DuplicateNitException>(() =>
            handler.HandleAsync(command));

        Assert.Equal("900123456-7", ex.Nit);
    }

    [Fact]
    public async Task HandleAsync_UniqueViolationWithoutConstraintName_StillThrowsDuplicateNit()
    {
        // Defensive: some Npgsql paths don't populate ConstraintName; we still
        // want to treat a raw 23505 as a duplicate-NIT signal (there is only one
        // unique constraint on the clientes table).
        var pg = BuildPostgresException("23505");
        var repo = new FakeClienteRepository
        {
            AddAsyncThrows = new DbUpdateException("duplicate", pg),
        };
        var handler = new CreateClienteCommandHandler(repo);
        var command = new CreateClienteCommand("Beta", "800-1", "300", "Bogotá");

        await Assert.ThrowsAsync<DuplicateNitException>(() =>
            handler.HandleAsync(command));
    }

    [Fact]
    public async Task HandleAsync_RepositoryThrowsOtherDbUpdate_Propagates()
    {
        // A non-23505 DbUpdateException must NOT be swallowed — it bubbles up
        // to ExceptionHandlingMiddleware to produce a 500 Problem Details.
        var pg = BuildPostgresException("23000", "some_other_constraint");
        var repo = new FakeClienteRepository
        {
            AddAsyncThrows = new DbUpdateException("check violation", pg),
        };
        var handler = new CreateClienteCommandHandler(repo);
        var command = new CreateClienteCommand("Beta", "800-1", "300", "Bogotá");

        await Assert.ThrowsAsync<DbUpdateException>(() =>
            handler.HandleAsync(command));
    }

    [Fact]
    public async Task HandleAsync_PassesCancellationToken()
    {
        var repo = new FakeClienteRepository();
        var handler = new CreateClienteCommandHandler(repo);
        using var cts = new CancellationTokenSource();
        var command = new CreateClienteCommand("Acme", "900-1", "300", "Cali");

        await handler.HandleAsync(command, cts.Token);

        Assert.Equal(cts.Token, repo.LastCancellationToken);
    }
}
