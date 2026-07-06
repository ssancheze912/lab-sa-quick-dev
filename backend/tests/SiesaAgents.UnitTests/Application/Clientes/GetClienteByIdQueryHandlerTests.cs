using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Story 2.2 (Epic 2: Client Management), AC #1-#3 — ATDD Acceptance Tests, RED phase.
///
/// RED phase: fails to compile today because <c>GetClienteByIdQuery</c>,
/// <c>GetClienteByIdQueryHandler</c> and <c>IClienteRepository.GetByIdAsync</c> do not exist
/// yet (Story 2.2 Task 1). Mirrors <c>GetClientesQueryHandlerTests.cs</c>'s hand-rolled-fake
/// convention — no mocking framework is referenced by SiesaAgents.UnitTests.csproj.
///
/// Verifies the Domain → DTO mapping contract for the single-record lookup, and the
/// "not found returns null, never throws" contract that AC #3 depends on (the endpoint,
/// not the handler, decides the HTTP status).
/// </summary>
public class GetClienteByIdQueryHandlerTests
{
    [Fact]
    public async Task Handle_ReturnsMappedDto_WhenRepositoryReturnsEntity()
    {
        // GIVEN a repository that returns a fully-populated entity for the requested Id
        var entity = ClienteEntity.Create("Acme Corp", "900123456", "3001234567", "Bogotá");
        var handler = new GetClienteByIdQueryHandler(new FakeClienteRepository(entity));
        var expectedDto = new ClienteDto(entity.Id, entity.Nombre, entity.Nit, entity.Telefono, entity.Ciudad, entity.CreatedAt);

        // WHEN the query is handled with the entity's Id
        var result = await handler.Handle(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // THEN the returned DTO maps every field verbatim from the entity (single atomic
        // value-equality assertion, since ClienteDto is a record with structural equality)
        Assert.Equal(expectedDto, result);
    }

    [Fact]
    public async Task Handle_ReturnsNull_WhenRepositoryReturnsNull()
    {
        // GIVEN a repository with no entity matching the requested Id
        var handler = new GetClienteByIdQueryHandler(new FakeClienteRepository(null));

        // WHEN the query is handled with a random Id
        var result = await handler.Handle(new GetClienteByIdQuery(Guid.NewGuid()), CancellationToken.None);

        // THEN null is returned — not an exception — so the endpoint can map it to 404 (AC #3)
        Assert.Null(result);
    }

    // ── Test Automation Expansion (testarch-automate) — edge cases beyond the ATDD RED phase ──

    [Fact]
    public async Task Handle_PassesQueryIdVerbatim_ToRepositoryGetByIdAsync()
    {
        // GIVEN a repository fake that records whichever Id it was called with
        var recordingRepository = new RecordingClienteRepository(null);
        var handler = new GetClienteByIdQueryHandler(recordingRepository);
        var requestedId = Guid.NewGuid();

        // WHEN the query is handled with a specific Id
        await handler.Handle(new GetClienteByIdQuery(requestedId), CancellationToken.None);

        // THEN the handler forwards that exact Id to the repository — it does not
        // transform, truncate or substitute it in any way
        Assert.Equal(requestedId, recordingRepository.LastRequestedId);
    }

    [Fact]
    public async Task Handle_PropagatesCancellationToken_ToRepositoryGetByIdAsync()
    {
        // GIVEN a repository fake that records the CancellationToken it received
        var recordingRepository = new RecordingClienteRepository(null);
        var handler = new GetClienteByIdQueryHandler(recordingRepository);
        using var cts = new CancellationTokenSource();

        // WHEN the query is handled with a specific, non-default token
        await handler.Handle(new GetClienteByIdQuery(Guid.NewGuid()), cts.Token);

        // THEN the same token instance reaches the repository call (cooperative cancellation
        // must flow through the handler, not be swallowed or replaced with CancellationToken.None)
        Assert.Equal(cts.Token, recordingRepository.LastCancellationToken);
    }

    [Fact]
    public async Task Handle_ReturnsNull_WhenRequestedIdIsEmptyGuid()
    {
        // GIVEN a repository that (correctly) has no entity for Guid.Empty
        var handler = new GetClienteByIdQueryHandler(new FakeClienteRepository(null));

        // WHEN the query is handled with the well-formed-but-degenerate Guid.Empty
        var result = await handler.Handle(new GetClienteByIdQuery(Guid.Empty), CancellationToken.None);

        // THEN it is treated like any other not-found Id — null, no exception (AC #3 applies
        // uniformly regardless of which specific Guid value was requested)
        Assert.Null(result);
    }

    [Fact]
    public async Task Handle_MapsAllFieldsIndependently_NotJustNombre()
    {
        // GIVEN an entity where every field is distinguishable (guards against a mapping bug
        // that accidentally swaps two fields, e.g. Telefono into Ciudad)
        var entity = ClienteEntity.Create("Beta SAS", "900999888", "3012223344", "Cali");
        var handler = new GetClienteByIdQueryHandler(new FakeClienteRepository(entity));

        // WHEN the query is handled
        var result = await handler.Handle(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // THEN each field maps to its own corresponding DTO property
        Assert.NotNull(result);
        Assert.Equal("Beta SAS", result!.Nombre);
        Assert.Equal("900999888", result.Nit);
        Assert.Equal("3012223344", result.Telefono);
        Assert.Equal("Cali", result.Ciudad);
    }

    /// <summary>
    /// Minimal in-memory fake — no mocking framework dependency, per project's ATDD
    /// conventions for handler-level unit tests.
    /// </summary>
    private sealed class FakeClienteRepository(ClienteEntity? clienteToReturn) : IClienteRepository
    {
        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<ClienteEntity>>([]);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult(clienteToReturn);

        public Task<bool> AddAsync(ClienteEntity cliente, CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task<bool> UpdateAsync(ClienteEntity cliente, CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult(true);
    }

    /// <summary>
    /// Fake that additionally records the arguments it was last called with, so tests can
    /// assert the handler forwards them verbatim (Id, CancellationToken) rather than just
    /// asserting on the return value.
    /// </summary>
    private sealed class RecordingClienteRepository(ClienteEntity? clienteToReturn) : IClienteRepository
    {
        public Guid LastRequestedId { get; private set; }
        public CancellationToken LastCancellationToken { get; private set; }

        public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<ClienteEntity>>([]);

        public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
        {
            LastRequestedId = id;
            LastCancellationToken = cancellationToken;
            return Task.FromResult(clienteToReturn);
        }

        public Task<bool> AddAsync(ClienteEntity cliente, CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task<bool> UpdateAsync(ClienteEntity cliente, CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult(true);
    }
}
