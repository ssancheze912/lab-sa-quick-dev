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
    }
}
