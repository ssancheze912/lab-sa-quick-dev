using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.4 (Epic 2: Client Management), AC #2, #3 — ATDD Acceptance Tests, RED phase.
///
/// RED phase: fails to compile today because <c>UpdateClienteCommand</c>,
/// <c>UpdateClienteCommandHandler</c> and <c>UpdateClienteResult</c> do not exist yet
/// (Story 2.4 Task 2), and <c>IClienteRepository</c> has no <c>UpdateAsync</c> member yet
/// (Task 2). Mirrors <c>CreateClienteCommandHandlerTests.cs</c>'s hand-rolled-fake
/// convention — no mocking framework is referenced by SiesaAgents.UnitTests.csproj.
///
/// Verifies the "expected outcome is a return value, not an exception" contract
/// (<c>UpdateClienteResult</c>'s <c>IsNotFound</c>/<c>IsConflict</c>) and that
/// <c>CreatedAt</c> is preserved across an update — only <c>Update()</c>, not <c>Create()</c>,
/// runs on this path (Dev Notes).
/// </summary>
public class UpdateClienteCommandHandlerTests
{
    private static readonly Guid ExistingId = Guid.NewGuid();

    private static UpdateClienteCommand ValidCommand(Guid? id = null) =>
        new(id ?? ExistingId, "Acme Corp Updated", "900123456", "3009999999", "Cali");

    private static ClienteEntity ExistingCliente() =>
        ClienteEntity.Create("Acme Corp", "900000000", "3001234567", "Bogotá");

    [Fact]
    public async Task Handle_ReturnsNotFoundResult_WhenClienteDoesNotExist()
    {
        // GIVEN a repository that finds no client for the given Id
        var handler = new UpdateClienteCommandHandler(new FakeClienteRepository(existing: null, updateSucceeds: true));

        // WHEN the command is handled
        var result = await handler.Handle(ValidCommand(), CancellationToken.None);

        // THEN the result reports NotFound
        Assert.True(result.IsNotFound);
    }

    [Fact]
    public async Task Handle_ReturnsNullCliente_WhenClienteDoesNotExist()
    {
        // GIVEN a repository that finds no client for the given Id
        var handler = new UpdateClienteCommandHandler(new FakeClienteRepository(existing: null, updateSucceeds: true));

        // WHEN the command is handled
        var result = await handler.Handle(ValidCommand(), CancellationToken.None);

        // THEN no DTO is returned for a not-found outcome
        Assert.Null(result.Cliente);
    }

    [Fact]
    public async Task Handle_ReturnsFalseIsConflict_WhenClienteDoesNotExist()
    {
        // GIVEN a repository that finds no client for the given Id
        var handler = new UpdateClienteCommandHandler(new FakeClienteRepository(existing: null, updateSucceeds: true));

        // WHEN the command is handled
        var result = await handler.Handle(ValidCommand(), CancellationToken.None);

        // THEN a not-found outcome is never also reported as a conflict
        Assert.False(result.IsConflict);
    }

    [Fact]
    public async Task Handle_ReturnsSuccessResult_WhenClienteExistsAndUpdateSucceeds()
    {
        // GIVEN an existing client and a repository whose UpdateAsync succeeds
        var handler = new UpdateClienteCommandHandler(
            new FakeClienteRepository(existing: ExistingCliente(), updateSucceeds: true));

        // WHEN the command is handled
        var result = await handler.Handle(ValidCommand(), CancellationToken.None);

        // THEN the result reports neither a conflict nor a not-found outcome
        Assert.False(result.IsConflict);
        Assert.False(result.IsNotFound);
    }

    [Fact]
    public async Task Handle_ReturnsClienteDto_MappingAllFieldsFromCommand_WhenUpdateSucceeds()
    {
        // GIVEN an existing client and a fully-populated update command
        var handler = new UpdateClienteCommandHandler(
            new FakeClienteRepository(existing: ExistingCliente(), updateSucceeds: true));
        var command = new UpdateClienteCommand(ExistingId, "Beta SAS", "900999888", "3012223344", "Medellín");

        // WHEN the command is handled
        var result = await handler.Handle(command, CancellationToken.None);

        // THEN every field on the returned DTO matches the command verbatim
        Assert.NotNull(result.Cliente);
        Assert.Equal("Beta SAS", result.Cliente!.Nombre);
        Assert.Equal("900999888", result.Cliente.Nit);
        Assert.Equal("3012223344", result.Cliente.Telefono);
        Assert.Equal("Medellín", result.Cliente.Ciudad);
    }

    [Fact]
    public async Task Handle_PreservesOriginalCreatedAt_WhenUpdateSucceeds()
    {
        // GIVEN an existing client with a known CreatedAt
        var existing = ExistingCliente();
        var originalCreatedAt = existing.CreatedAt;
        var handler = new UpdateClienteCommandHandler(
            new FakeClienteRepository(existing: existing, updateSucceeds: true));

        // WHEN the command is handled
        var result = await handler.Handle(ValidCommand(), CancellationToken.None);

        // THEN the returned DTO's CreatedAt equals the pre-existing entity's, not
        // DateTimeOffset.UtcNow — only Update(), not Create(), ran on this path
        Assert.Equal(originalCreatedAt, result.Cliente!.CreatedAt);
    }

    [Fact]
    public async Task Handle_ReturnsConflictResult_WhenUpdateAsyncReturnsFalse()
    {
        // GIVEN an existing client but a repository whose UpdateAsync fails
        // (uk_clientes_nit unique-index violation — the edited NIT collides with another client)
        var handler = new UpdateClienteCommandHandler(
            new FakeClienteRepository(existing: ExistingCliente(), updateSucceeds: false));

        // WHEN the command is handled
        var result = await handler.Handle(ValidCommand(), CancellationToken.None);

        // THEN the result reports a conflict — no exception is thrown
        Assert.True(result.IsConflict);
    }

    [Fact]
    public async Task Handle_ReturnsNullCliente_WhenUpdateAsyncReturnsFalse()
    {
        // GIVEN an existing client but a repository whose UpdateAsync fails
        var handler = new UpdateClienteCommandHandler(
            new FakeClienteRepository(existing: ExistingCliente(), updateSucceeds: false));

        // WHEN the command is handled
        var result = await handler.Handle(ValidCommand(), CancellationToken.None);

        // THEN no DTO is returned for a conflict outcome
        Assert.Null(result.Cliente);
    }

    [Fact]
    public async Task Handle_PassesUpdatedEntityWithCommandFields_ToRepositoryUpdateAsync()
    {
        // GIVEN a repository fake that records the entity it was asked to update
        var recordingRepository = new RecordingClienteRepository(ExistingCliente());
        var handler = new UpdateClienteCommandHandler(recordingRepository);
        var command = new UpdateClienteCommand(ExistingId, "Gamma Ltda", "900333333", "3003333333", "Medellín");

        // WHEN the command is handled
        await handler.Handle(command, CancellationToken.None);

        // THEN the entity forwarded to the repository carries the command's fields verbatim —
        // the handler applies Update() before calling UpdateAsync
        Assert.NotNull(recordingRepository.LastUpdatedCliente);
        Assert.Equal("Gamma Ltda", recordingRepository.LastUpdatedCliente!.Nombre);
        Assert.Equal("900333333", recordingRepository.LastUpdatedCliente.Nit);
        Assert.Equal("3003333333", recordingRepository.LastUpdatedCliente.Telefono);
        Assert.Equal("Medellín", recordingRepository.LastUpdatedCliente.Ciudad);
    }

    /// <summary>
    /// Minimal in-memory fake — no mocking framework dependency, per project's ATDD
    /// conventions for handler-level unit tests. <c>existing</c> simulates
    /// <c>GetByIdAsync</c>'s lookup outcome (null → NotFound path); <c>updateSucceeds</c>
    /// simulates either a successful update or a `uk_clientes_nit` unique-violation.
    /// </summary>
    private sealed class FakeClienteRepository(ClienteEntity? existing, bool updateSucceeds) : IClienteRepository
    {
        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<ClienteEntity>>([]);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult(existing);

        public Task<bool> AddAsync(ClienteEntity cliente, CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task<bool> UpdateAsync(ClienteEntity cliente, CancellationToken cancellationToken) =>
            Task.FromResult(updateSucceeds);
    }

    /// <summary>
    /// Fake that additionally records the entity it was last asked to update, so tests can
    /// assert the handler forwards command fields verbatim (post-<c>Update()</c>) rather than
    /// just asserting on the return value.
    /// </summary>
    private sealed class RecordingClienteRepository(ClienteEntity existing) : IClienteRepository
    {
        public ClienteEntity? LastUpdatedCliente { get; private set; }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<ClienteEntity>>([]);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult<ClienteEntity?>(existing);

        public Task<bool> AddAsync(ClienteEntity cliente, CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task<bool> UpdateAsync(ClienteEntity cliente, CancellationToken cancellationToken)
        {
            LastUpdatedCliente = cliente;
            return Task.FromResult(true);
        }
    }
}
