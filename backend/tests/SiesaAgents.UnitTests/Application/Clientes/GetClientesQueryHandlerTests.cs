/**
 * Story 2.1: Client List &amp; Search — Backend Unit Tests (ATDD RED Phase)
 * Epic 2: Client Management
 *
 * Acceptance Criteria covered:
 *   AC5 — GET /api/v1/clientes returns HTTP 200 with JSON array of ClienteDto
 *          sourced from ClienteEntity via GetClientesQueryHandler.
 *
 * Test status: RED — tests will fail until implementation is complete.
 * Framework: xUnit + NSubstitute (or Moq — interface mocking)
 *
 * Note: The types referenced here do NOT exist yet.
 *   - SiesaAgents.Application.Clientes.DTOs.ClienteDto
 *   - SiesaAgents.Application.Clientes.Queries.GetClientesQuery
 *   - SiesaAgents.Application.Clientes.Queries.GetClientesQueryHandler
 *   - SiesaAgents.Domain.Clientes.Entities.ClienteEntity
 *   - SiesaAgents.Domain.Clientes.Interfaces.IClienteRepository
 * These tests will fail to compile (RED) until those types are created.
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using NSubstitute;
using Xunit;

// Namespaces that do not exist yet — will cause compile failure (RED phase)
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Unit tests for GetClientesQueryHandler.
/// AC5: Handler maps ClienteEntity list from IClienteRepository to IEnumerable&lt;ClienteDto&gt;.
/// </summary>
public class GetClientesQueryHandlerTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // AC5 — Handler calls GetAllAsync and maps result to IEnumerable<ClienteDto>
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WhenRepositoryReturnsTwoClientes_ReturnsTwoClienteDtos()
    {
        // GIVEN: Repository returns two ClienteEntity instances
        var mockRepository = Substitute.For<IClienteRepository>();
        var entities = new List<ClienteEntity>
        {
            ClienteEntity.Create("Acme Colombia SAS", "900123456-7", "+57 601 234 5678", "Bogotá"),
            ClienteEntity.Create("TechCorp Ltda",     "800500100-1", "+57 604 345 6789", "Medellín"),
        };
        mockRepository.GetAllAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IEnumerable<ClienteEntity>>(entities));

        var handler = new GetClientesQueryHandler(mockRepository);
        var query = new GetClientesQuery();

        // WHEN: Query is handled
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: Result contains two DTOs
        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task Handle_WhenRepositoryReturnsTwoClientes_MapsNombreCorrectly()
    {
        // GIVEN: Repository returns one ClienteEntity with Nombre "Acme Colombia SAS"
        var mockRepository = Substitute.For<IClienteRepository>();
        var entities = new List<ClienteEntity>
        {
            ClienteEntity.Create("Acme Colombia SAS", "900123456-7", "+57 601 234 5678", "Bogotá"),
        };
        mockRepository.GetAllAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IEnumerable<ClienteEntity>>(entities));

        var handler = new GetClientesQueryHandler(mockRepository);
        var query = new GetClientesQuery();

        // WHEN: Query is handled
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: DTO Nombre matches source entity
        Assert.Equal("Acme Colombia SAS", result.First().Nombre);
    }

    [Fact]
    public async Task Handle_WhenRepositoryReturnsTwoClientes_MapsNitCorrectly()
    {
        // GIVEN: Repository returns entity with NIT "900123456-7"
        var mockRepository = Substitute.For<IClienteRepository>();
        var entities = new List<ClienteEntity>
        {
            ClienteEntity.Create("Acme Colombia SAS", "900123456-7", "+57 601 234 5678", "Bogotá"),
        };
        mockRepository.GetAllAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IEnumerable<ClienteEntity>>(entities));

        var handler = new GetClientesQueryHandler(mockRepository);
        var query = new GetClientesQuery();

        // WHEN: Query is handled
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: DTO Nit matches source entity
        Assert.Equal("900123456-7", result.First().Nit);
    }

    [Fact]
    public async Task Handle_WhenRepositoryReturnsTwoClientes_MapsIdAsNonEmptyGuid()
    {
        // GIVEN: Repository returns entity with auto-generated UUID
        var mockRepository = Substitute.For<IClienteRepository>();
        var entities = new List<ClienteEntity>
        {
            ClienteEntity.Create("Acme Colombia SAS", "900123456-7", "+57 601 234 5678", "Bogotá"),
        };
        mockRepository.GetAllAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IEnumerable<ClienteEntity>>(entities));

        var handler = new GetClientesQueryHandler(mockRepository);
        var query = new GetClientesQuery();

        // WHEN: Query is handled
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: DTO Id is a non-empty GUID (R-008 mitigation: not an integer)
        Assert.NotEqual(Guid.Empty, result.First().Id);
    }

    [Fact]
    public async Task Handle_WhenRepositoryReturnsEmpty_ReturnsEmptyEnumerable()
    {
        // GIVEN: Repository returns empty list (no clients in system)
        var mockRepository = Substitute.For<IClienteRepository>();
        mockRepository.GetAllAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IEnumerable<ClienteEntity>>(Enumerable.Empty<ClienteEntity>()));

        var handler = new GetClientesQueryHandler(mockRepository);
        var query = new GetClientesQuery();

        // WHEN: Query is handled
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: Result is empty (no items)
        Assert.Empty(result);
    }

    [Fact]
    public async Task Handle_AlwaysCalls_GetAllAsyncOnRepository()
    {
        // GIVEN: A valid repository mock
        var mockRepository = Substitute.For<IClienteRepository>();
        mockRepository.GetAllAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IEnumerable<ClienteEntity>>(Enumerable.Empty<ClienteEntity>()));

        var handler = new GetClientesQueryHandler(mockRepository);
        var query = new GetClientesQuery();

        // WHEN: Query is handled
        await handler.Handle(query, CancellationToken.None);

        // THEN: GetAllAsync was called exactly once on the repository
        await mockRepository.Received(1).GetAllAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenRepositoryReturnsTwoClientes_MapsCreatedAtAsDateTimeOffset()
    {
        // GIVEN: Repository returns entity with DateTimeOffset CreatedAt (not DateTime)
        var mockRepository = Substitute.For<IClienteRepository>();
        var entities = new List<ClienteEntity>
        {
            ClienteEntity.Create("Acme Colombia SAS", "900123456-7", "+57 601 234 5678", "Bogotá"),
        };
        mockRepository.GetAllAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IEnumerable<ClienteEntity>>(entities));

        var handler = new GetClientesQueryHandler(mockRepository);
        var query = new GetClientesQuery();

        // WHEN: Query is handled
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: DTO CreatedAt is a valid DateTimeOffset (company standard: never DateTime)
        Assert.IsType<DateTimeOffset>(result.First().CreatedAt);
        Assert.NotEqual(default(DateTimeOffset), result.First().CreatedAt);
    }
}
