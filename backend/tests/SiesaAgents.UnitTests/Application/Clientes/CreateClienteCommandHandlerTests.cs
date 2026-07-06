using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.3 (Epic 2: Client Management), AC #2, #4 — ATDD Acceptance Tests, RED phase.
///
/// RED phase: fails to compile today because <c>CreateClienteCommand</c>,
/// <c>CreateClienteCommandHandler</c> and <c>CreateClienteResult</c> do not exist yet
/// (Story 2.3 Task 1), and <c>IClienteRepository</c> has no <c>AddAsync</c> member yet.
/// Mirrors <c>GetClienteByIdQueryHandlerTests.cs</c>'s hand-rolled-fake convention — no
/// mocking framework is referenced by SiesaAgents.UnitTests.csproj.
///
/// Verifies the Command → Domain → DTO mapping contract for a successful create (AC #2),
/// and the "duplicate NIT is a return value, not an exception" contract (AC #4) that lets
/// the endpoint — not the handler — decide the HTTP status (409 vs 201).
/// </summary>
public class CreateClienteCommandHandlerTests
{
    private static CreateClienteCommand ValidCommand() =>
        new("Acme Corp", "900123456", "3001234567", "Bogotá");

    [Fact]
    public async Task Handle_ReturnsSuccessResult_WhenRepositoryAddSucceeds()
    {
        // GIVEN a repository that successfully persists any new client
        var handler = new CreateClienteCommandHandler(new FakeClienteRepository(addSucceeds: true));

        // WHEN the command is handled
        var result = await handler.Handle(ValidCommand(), CancellationToken.None);

        // THEN the result reports success, not a conflict
        Assert.False(result.IsConflict);
    }

    [Fact]
    public async Task Handle_ReturnsClienteDto_MappingAllFieldsFromCommand_WhenRepositoryAddSucceeds()
    {
        // GIVEN a repository that successfully persists the new client and a fully-populated command
        var handler = new CreateClienteCommandHandler(new FakeClienteRepository(addSucceeds: true));
        var command = new CreateClienteCommand("Beta SAS", "900999888", "3012223344", "Cali");

        // WHEN the command is handled
        var result = await handler.Handle(command, CancellationToken.None);

        // THEN every field on the returned DTO matches the command verbatim
        Assert.NotNull(result.Cliente);
        Assert.Equal("Beta SAS", result.Cliente!.Nombre);
        Assert.Equal("900999888", result.Cliente.Nit);
        Assert.Equal("3012223344", result.Cliente.Telefono);
        Assert.Equal("Cali", result.Cliente.Ciudad);
    }

    [Fact]
    public async Task Handle_ReturnsConflictResult_WhenRepositoryAddFails()
    {
        // GIVEN a repository that fails the insert due to a duplicate NIT (uk_clientes_nit)
        var handler = new CreateClienteCommandHandler(new FakeClienteRepository(addSucceeds: false));

        // WHEN the command is handled
        var result = await handler.Handle(ValidCommand(), CancellationToken.None);

        // THEN the result reports a conflict — no exception is thrown (AC #4)
        Assert.True(result.IsConflict);
    }

    [Fact]
    public async Task Handle_ReturnsNullCliente_WhenRepositoryAddFails()
    {
        // GIVEN a repository that fails the insert due to a duplicate NIT
        var handler = new CreateClienteCommandHandler(new FakeClienteRepository(addSucceeds: false));

        // WHEN the command is handled
        var result = await handler.Handle(ValidCommand(), CancellationToken.None);

        // THEN no DTO is returned for a conflict outcome — the endpoint must not accidentally
        // expose a partially-created record
        Assert.Null(result.Cliente);
    }

    [Fact]
    public async Task Handle_PassesEntityWithCommandFields_ToRepositoryAddAsync()
    {
        // GIVEN a repository fake that records the entity it was asked to persist
        var recordingRepository = new RecordingClienteRepository();
        var handler = new CreateClienteCommandHandler(recordingRepository);
        var command = new CreateClienteCommand("Gamma Ltda", "900333333", "3003333333", "Medellín");

        // WHEN the command is handled
        await handler.Handle(command, CancellationToken.None);

        // THEN the entity forwarded to the repository carries the command's fields verbatim —
        // the handler does not transform or drop any field before persisting
        Assert.NotNull(recordingRepository.LastAddedCliente);
        Assert.Equal("Gamma Ltda", recordingRepository.LastAddedCliente!.Nombre);
        Assert.Equal("900333333", recordingRepository.LastAddedCliente.Nit);
        Assert.Equal("3003333333", recordingRepository.LastAddedCliente.Telefono);
        Assert.Equal("Medellín", recordingRepository.LastAddedCliente.Ciudad);
    }

    /// <summary>
    /// Minimal in-memory fake — no mocking framework dependency, per project's ATDD
    /// conventions for handler-level unit tests. `AddAsync`'s return value simulates
    /// either a successful insert or a `uk_clientes_nit` unique-violation.
    /// </summary>
    private sealed class FakeClienteRepository(bool addSucceeds) : IClienteRepository
    {
        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<ClienteEntity>>([]);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult<ClienteEntity?>(null);

        public Task<bool> AddAsync(ClienteEntity cliente, CancellationToken cancellationToken) =>
            Task.FromResult(addSucceeds);
    }

    /// <summary>
    /// Fake that additionally records the entity it was last asked to persist, so tests can
    /// assert the handler forwards command fields verbatim rather than just asserting on the
    /// return value.
    /// </summary>
    private sealed class RecordingClienteRepository : IClienteRepository
    {
        public ClienteEntity? LastAddedCliente { get; private set; }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<ClienteEntity>>([]);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult<ClienteEntity?>(null);

        public Task<bool> AddAsync(ClienteEntity cliente, CancellationToken cancellationToken)
        {
            LastAddedCliente = cliente;
            return Task.FromResult(true);
        }
    }
}
