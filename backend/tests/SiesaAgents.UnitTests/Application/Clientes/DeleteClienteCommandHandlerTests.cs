using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.5 (Epic 2: Client Management), AC #2 — ATDD Acceptance Tests, RED phase.
///
/// RED phase: fails to compile today because <c>DeleteClienteCommand</c> and
/// <c>DeleteClienteCommandHandler</c> do not exist yet (Story 2.5 Task 2), and
/// <c>IClienteRepository</c> has no <c>DeleteAsync</c> member yet (Task 1). Mirrors
/// <c>UpdateClienteCommandHandlerTests.cs</c>'s hand-rolled-fake convention — no mocking
/// framework is referenced by SiesaAgents.UnitTests.csproj.
///
/// Unlike Update/Create, delete has exactly one binary outcome (found-and-deleted vs.
/// not-found) — no <c>DeleteClienteResult</c> wrapper type is introduced (Dev Notes: an
/// unrequested abstraction layer for a single boolean). The handler forwards
/// <see cref="IClienteRepository.DeleteAsync"/>'s <c>bool</c> return value directly.
/// </summary>
public class DeleteClienteCommandHandlerTests
{
    private static readonly Guid ExistingId = Guid.NewGuid();

    [Fact]
    public async Task Handle_ReturnsTrue_WhenRepositoryDeletesSuccessfully()
    {
        // GIVEN a repository whose DeleteAsync finds and removes the client
        var handler = new DeleteClienteCommandHandler(new FakeClienteRepository(deleteResult: true));

        // WHEN the command is handled
        var result = await handler.Handle(new DeleteClienteCommand(ExistingId), CancellationToken.None);

        // THEN the handler reports success
        Assert.True(result);
    }

    [Fact]
    public async Task Handle_ReturnsFalse_WhenClienteDoesNotExist()
    {
        // GIVEN a repository whose DeleteAsync finds no matching client
        var handler = new DeleteClienteCommandHandler(new FakeClienteRepository(deleteResult: false));

        // WHEN the command is handled
        var result = await handler.Handle(new DeleteClienteCommand(ExistingId), CancellationToken.None);

        // THEN the handler reports not-found (false), not an exception
        Assert.False(result);
    }

    [Fact]
    public async Task Handle_ForwardsCommandIdVerbatim_ToRepositoryDeleteAsync()
    {
        // GIVEN a repository fake that records the Id it was asked to delete
        var recordingRepository = new RecordingClienteRepository();
        var handler = new DeleteClienteCommandHandler(recordingRepository);
        var command = new DeleteClienteCommand(ExistingId);

        // WHEN the command is handled
        await handler.Handle(command, CancellationToken.None);

        // THEN the Id forwarded to the repository matches the command's Id exactly — the
        // handler performs no transformation of its input (mirrors
        // Handle_PassesUpdatedEntityWithCommandFields_ToRepositoryUpdateAsync's intent)
        Assert.Equal(ExistingId, recordingRepository.LastDeletedId);
    }

    /// <summary>
    /// Minimal in-memory fake — no mocking framework dependency, per project's ATDD
    /// conventions for handler-level unit tests. <c>deleteResult</c> simulates
    /// <c>DeleteAsync</c>'s binary outcome (found-and-removed vs. not-found).
    /// </summary>
    private sealed class FakeClienteRepository(bool deleteResult) : IClienteRepository
    {
        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<ClienteEntity>>([]);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult<ClienteEntity?>(null);

        public Task<bool> AddAsync(ClienteEntity cliente, CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task<bool> UpdateAsync(ClienteEntity cliente, CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult(deleteResult);
    }

    /// <summary>
    /// Fake that additionally records the Id it was last asked to delete, so tests can
    /// assert the handler forwards <c>command.Id</c> verbatim to
    /// <c>clienteRepository.DeleteAsync</c>.
    /// </summary>
    private sealed class RecordingClienteRepository : IClienteRepository
    {
        public Guid? LastDeletedId { get; private set; }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<ClienteEntity>>([]);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult<ClienteEntity?>(null);

        public Task<bool> AddAsync(ClienteEntity cliente, CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task<bool> UpdateAsync(ClienteEntity cliente, CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken)
        {
            LastDeletedId = id;
            return Task.FromResult(true);
        }
    }
}
