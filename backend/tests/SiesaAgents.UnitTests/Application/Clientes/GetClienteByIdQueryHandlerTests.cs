/**
 * Story 2.2: Client Detail View — Backend Unit Tests (ATDD RED Phase)
 * Epic 2: Client Management
 *
 * Acceptance Criteria covered:
 *   AC7 — Handler returns ClienteDto when GetByIdAsync returns a ClienteEntity
 *   AC8 — Handler returns null when GetByIdAsync returns null (record not found)
 *
 * Test status: RED — tests will fail to compile until implementation is complete.
 *   - SiesaAgents.Application.Clientes.Queries.GetClienteByIdQuery   (does NOT exist yet)
 *   - SiesaAgents.Application.Clientes.Queries.GetClienteByIdQueryHandler (does NOT exist yet)
 *
 * Framework: xUnit + NSubstitute
 * Structure: Given-When-Then (Arrange/Act/Assert)
 */

using System;
using System.Threading;
using System.Threading.Tasks;
using NSubstitute;
using Xunit;

// Existing namespaces
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

// Namespaces that do NOT exist yet — will cause compile failure (RED phase)
using SiesaAgents.Application.Clientes.Queries;

namespace SiesaAgents.UnitTests.Application.Clientes;

/// <summary>
/// Unit tests for GetClienteByIdQueryHandler.
/// AC7: Handler returns ClienteDto when entity is found.
/// AC8: Handler returns null when entity is not found.
/// </summary>
public class GetClienteByIdQueryHandlerTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // AC7 — Handler returns ClienteDto for an existing record
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WhenRepositoryReturnsEntity_ReturnsClienteDto()
    {
        // GIVEN: Repository returns a ClienteEntity for the requested UUID
        var id = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create("Acme Colombia SAS", "900123456-7", "+57 601 234 5678", "Bogotá");

        mockRepository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(entity));

        var handler = new GetClienteByIdQueryHandler(mockRepository);
        var query = new GetClienteByIdQuery(id);

        // WHEN: Query is handled
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: A non-null ClienteDto is returned
        Assert.NotNull(result);
        Assert.IsType<ClienteDto>(result);
    }

    [Fact]
    public async Task Handle_WhenRepositoryReturnsEntity_MapsNombreCorrectly()
    {
        // GIVEN: Repository returns entity with Nombre "Acme Colombia SAS"
        var id = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create("Acme Colombia SAS", "900123456-7", "+57 601 234 5678", "Bogotá");

        mockRepository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(entity));

        var handler = new GetClienteByIdQueryHandler(mockRepository);
        var query = new GetClienteByIdQuery(id);

        // WHEN: Query is handled
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: DTO Nombre matches the entity
        Assert.Equal("Acme Colombia SAS", result!.Nombre);
    }

    [Fact]
    public async Task Handle_WhenRepositoryReturnsEntity_MapsNitCorrectly()
    {
        // GIVEN: Repository returns entity with NIT "900123456-7"
        var id = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create("Acme Colombia SAS", "900123456-7", "+57 601 234 5678", "Bogotá");

        mockRepository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(entity));

        var handler = new GetClienteByIdQueryHandler(mockRepository);
        var query = new GetClienteByIdQuery(id);

        // WHEN: Query is handled
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: DTO Nit matches
        Assert.Equal("900123456-7", result!.Nit);
    }

    [Fact]
    public async Task Handle_WhenRepositoryReturnsEntity_MapsTelefonoCorrectly()
    {
        // GIVEN: Repository returns entity with Telefono
        var id = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create("Acme Colombia SAS", "900123456-7", "+57 601 234 5678", "Bogotá");

        mockRepository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(entity));

        var handler = new GetClienteByIdQueryHandler(mockRepository);
        var query = new GetClienteByIdQuery(id);

        // WHEN: Query is handled
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: DTO Telefono matches
        Assert.Equal("+57 601 234 5678", result!.Telefono);
    }

    [Fact]
    public async Task Handle_WhenRepositoryReturnsEntity_MapsCiudadCorrectly()
    {
        // GIVEN: Repository returns entity with Ciudad "Bogotá"
        var id = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create("Acme Colombia SAS", "900123456-7", "+57 601 234 5678", "Bogotá");

        mockRepository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(entity));

        var handler = new GetClienteByIdQueryHandler(mockRepository);
        var query = new GetClienteByIdQuery(id);

        // WHEN: Query is handled
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: DTO Ciudad matches
        Assert.Equal("Bogotá", result!.Ciudad);
    }

    [Fact]
    public async Task Handle_WhenRepositoryReturnsEntity_MapsIdAsNonEmptyGuid()
    {
        // GIVEN: Repository returns entity — R-008 mitigation (UUID, not integer)
        var id = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create("Acme Colombia SAS", "900123456-7", "+57 601 234 5678", "Bogotá");

        mockRepository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(entity));

        var handler = new GetClienteByIdQueryHandler(mockRepository);
        var query = new GetClienteByIdQuery(id);

        // WHEN: Query is handled
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: DTO Id is a non-empty GUID (not an integer sequence)
        Assert.NotEqual(Guid.Empty, result!.Id);
    }

    [Fact]
    public async Task Handle_WhenRepositoryReturnsEntity_MapsCreatedAtAsDateTimeOffset()
    {
        // GIVEN: Repository returns entity — company standard: DateTimeOffset, not DateTime
        var id = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        var entity = ClienteEntity.Create("Acme Colombia SAS", "900123456-7", "+57 601 234 5678", "Bogotá");

        mockRepository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(entity));

        var handler = new GetClienteByIdQueryHandler(mockRepository);
        var query = new GetClienteByIdQuery(id);

        // WHEN: Query is handled
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: DTO CreatedAt is a valid non-default DateTimeOffset
        Assert.IsType<DateTimeOffset>(result!.CreatedAt);
        Assert.NotEqual(default(DateTimeOffset), result.CreatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC8 — Handler returns null when entity is NOT found
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WhenRepositoryReturnsNull_ReturnsNull()
    {
        // GIVEN: Repository returns null (record does not exist)
        var id = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        mockRepository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(null));

        var handler = new GetClienteByIdQueryHandler(mockRepository);
        var query = new GetClienteByIdQuery(id);

        // WHEN: Query is handled
        var result = await handler.Handle(query, CancellationToken.None);

        // THEN: Null is returned (caller maps this to HTTP 404)
        Assert.Null(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Repository delegation — handler always calls GetByIdAsync once
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_AlwaysCalls_GetByIdAsyncOnRepository()
    {
        // GIVEN: A valid UUID is requested
        var id = Guid.NewGuid();
        var mockRepository = Substitute.For<IClienteRepository>();
        mockRepository.GetByIdAsync(id, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ClienteEntity?>(null));

        var handler = new GetClienteByIdQueryHandler(mockRepository);
        var query = new GetClienteByIdQuery(id);

        // WHEN: Query is handled
        await handler.Handle(query, CancellationToken.None);

        // THEN: GetByIdAsync was called exactly once with the correct id
        await mockRepository.Received(1).GetByIdAsync(id, Arg.Any<CancellationToken>());
    }
}
