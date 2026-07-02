// -----------------------------------------------------------------------------
//  Story 2.4 — Edit Client
//  Unit tests for UpdateClienteCommandHandler (AC #4, #5, #6, #9).
//  Verifies: happy path -> DTO; not-found -> ClienteNotFoundException;
//  PostgreSQL 23505 -> DuplicateNitException; other DbUpdateException -> propagates;
//  cancellation token forwarded; Id and CreatedAt preserved.
// -----------------------------------------------------------------------------
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class UpdateClienteCommandHandlerTests
{
    private sealed class FakeClienteRepository : IClienteRepository
    {
        public ClienteEntity? Seed { get; init; }
        public int UpdateCallCount { get; private set; }
        public int GetByIdCallCount { get; private set; }
        public ClienteEntity? LastUpdated { get; private set; }
        public CancellationToken LastGetByIdCancellationToken { get; private set; }
        public CancellationToken LastUpdateCancellationToken { get; private set; }
        public Exception? UpdateAsyncThrows { get; init; }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<ClienteEntity>>(Array.Empty<ClienteEntity>());
        }

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            GetByIdCallCount++;
            LastGetByIdCancellationToken = cancellationToken;
            if (Seed is not null && Seed.Id == id)
            {
                return Task.FromResult<ClienteEntity?>(Seed);
            }
            return Task.FromResult<ClienteEntity?>(null);
        }

        public Task AddAsync(ClienteEntity cliente, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException("Not exercised by Story 2.4 update tests.");
        }

        public Task UpdateAsync(ClienteEntity cliente, CancellationToken cancellationToken = default)
        {
            UpdateCallCount++;
            LastUpdated = cliente;
            LastUpdateCancellationToken = cancellationToken;
            if (UpdateAsyncThrows is not null)
            {
                throw UpdateAsyncThrows;
            }
            return Task.CompletedTask;
        }
    }

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
    public async Task HandleAsync_ExistingId_UpdatesAndReturnsDto()
    {
        var seed = ClienteEntity.Create("Old Name", "900-1", "+57 000", "Cali");
        var repo = new FakeClienteRepository { Seed = seed };
        var handler = new UpdateClienteCommandHandler(repo);
        var command = new UpdateClienteCommand(
            seed.Id,
            "  New Name  ",
            "900-2",
            "+57 111",
            "Bogotá");

        // Delay ensures UpdatedAt strictly increases.
        await Task.Delay(5);
        var dto = await handler.HandleAsync(command);

        Assert.Equal(1, repo.UpdateCallCount);
        Assert.NotNull(repo.LastUpdated);
        // Trim applied by domain method
        Assert.Equal("New Name", repo.LastUpdated!.Nombre);
        Assert.Equal("900-2", repo.LastUpdated.Nit);
        Assert.Equal("+57 111", repo.LastUpdated.Telefono);
        Assert.Equal("Bogotá", repo.LastUpdated.Ciudad);

        Assert.Equal(seed.Id, dto.Id);
        Assert.Equal("New Name", dto.Nombre);
        Assert.True(dto.UpdatedAt > dto.CreatedAt, "UpdatedAt must be > CreatedAt after mutation.");
    }

    [Fact]
    public async Task HandleAsync_UnknownId_ThrowsClienteNotFound()
    {
        var repo = new FakeClienteRepository();
        var handler = new UpdateClienteCommandHandler(repo);
        var unknownId = Guid.NewGuid();
        var command = new UpdateClienteCommand(unknownId, "N", "1", "2", "3");

        var ex = await Assert.ThrowsAsync<ClienteNotFoundException>(() =>
            handler.HandleAsync(command));

        Assert.Equal(unknownId, ex.Id);
        Assert.Equal(0, repo.UpdateCallCount);
    }

    [Fact]
    public async Task HandleAsync_RepositoryThrowsUniqueViolation_ThrowsDuplicateNit()
    {
        var seed = ClienteEntity.Create("A", "900-1", "+57 000", "Cali");
        var pg = BuildPostgresException("23505", "uk_clientes_nit");
        var repo = new FakeClienteRepository
        {
            Seed = seed,
            UpdateAsyncThrows = new DbUpdateException("duplicate", pg),
        };
        var handler = new UpdateClienteCommandHandler(repo);
        var command = new UpdateClienteCommand(seed.Id, "A", "800-2", "+57 000", "Cali");

        var ex = await Assert.ThrowsAsync<DuplicateNitException>(() =>
            handler.HandleAsync(command));

        Assert.Equal("800-2", ex.Nit);
    }

    [Fact]
    public async Task HandleAsync_RepositoryThrowsOtherDbUpdate_Propagates()
    {
        var seed = ClienteEntity.Create("A", "900-1", "+57 000", "Cali");
        var pg = BuildPostgresException("23000", "some_other_constraint");
        var repo = new FakeClienteRepository
        {
            Seed = seed,
            UpdateAsyncThrows = new DbUpdateException("check violation", pg),
        };
        var handler = new UpdateClienteCommandHandler(repo);
        var command = new UpdateClienteCommand(seed.Id, "A", "900-1", "+57 000", "Cali");

        await Assert.ThrowsAsync<DbUpdateException>(() =>
            handler.HandleAsync(command));
    }

    [Fact]
    public async Task HandleAsync_PassesCancellationToken()
    {
        var seed = ClienteEntity.Create("A", "900-1", "+57 000", "Cali");
        var repo = new FakeClienteRepository { Seed = seed };
        var handler = new UpdateClienteCommandHandler(repo);
        using var cts = new CancellationTokenSource();
        var command = new UpdateClienteCommand(seed.Id, "A", "900-1", "+57 000", "Cali");

        await handler.HandleAsync(command, cts.Token);

        Assert.Equal(cts.Token, repo.LastGetByIdCancellationToken);
        Assert.Equal(cts.Token, repo.LastUpdateCancellationToken);
    }

    [Fact]
    public async Task HandleAsync_PreservesIdAndCreatedAt()
    {
        var seed = ClienteEntity.Create("A", "900-1", "+57 000", "Cali");
        var originalId = seed.Id;
        var originalCreatedAt = seed.CreatedAt;
        var repo = new FakeClienteRepository { Seed = seed };
        var handler = new UpdateClienteCommandHandler(repo);
        var command = new UpdateClienteCommand(seed.Id, "New", "900-1", "+57 000", "Cali");

        await Task.Delay(5);
        var dto = await handler.HandleAsync(command);

        Assert.Equal(originalId, dto.Id);
        Assert.Equal(originalCreatedAt, dto.CreatedAt);
        Assert.True(dto.UpdatedAt > originalCreatedAt);
    }
}
