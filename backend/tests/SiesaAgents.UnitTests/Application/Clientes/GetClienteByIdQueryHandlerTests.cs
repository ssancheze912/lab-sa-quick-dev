/**
 * Story 2.2: Client Detail View
 * Unit Tests — GetClienteByIdQueryHandler (RED Phase — ATDD)
 *
 * Acceptance Criteria covered:
 *   AC2 — GET /api/v1/clientes/{id} returns correct client (handler layer)
 *   AC3 — Handler returns null when client does not exist (enables 404 at endpoint)
 *
 * Related Test Cases (test-design-epic-2.md):
 *   TC-E2-P1-02 — GET /api/v1/clientes/{id} returns client or 404
 *
 * These tests will FAIL until GetClienteByIdQueryHandler, GetClienteByIdQuery,
 * and IClienteRepository.GetByIdAsync are implemented.
 *
 * Given-When-Then pattern used throughout.
 */

using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using Moq;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClienteByIdQueryHandlerTests
{
    private readonly Mock<IClienteRepository> _repositoryMock;
    private readonly GetClienteByIdQueryHandler _handler;

    public GetClienteByIdQueryHandlerTests()
    {
        _repositoryMock = new Mock<IClienteRepository>();
        _handler = new GetClienteByIdQueryHandler(_repositoryMock.Object);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P1-02a: Handler returns ClienteDto when repository finds the entity
    // AC2: GET /api/v1/clientes/{id} returns correct client
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenRepositoryFindsEntity_ShouldReturnClienteDto()
    {
        // GIVEN: repository returns a known client entity
        var entity = ClienteEntity.Create("Empresa Alpha", "900111111-1", "3001111111", "Bogotá");
        _repositoryMock
            .Setup(r => r.GetByIdAsync(entity.Id))
            .ReturnsAsync(entity);

        // WHEN: handler processes the query with the known id
        var result = await _handler.HandleAsync(new GetClienteByIdQuery(entity.Id));

        // THEN: result is a non-null ClienteDto
        Assert.NotNull(result);
        Assert.IsType<ClienteDto>(result);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryFindsEntity_ShouldMapAllFields()
    {
        // GIVEN: repository returns a client entity with all required fields
        var entity = ClienteEntity.Create("Empresa Beta", "900222222-2", "3002222222", "Medellín");
        _repositoryMock
            .Setup(r => r.GetByIdAsync(entity.Id))
            .ReturnsAsync(entity);

        // WHEN: handler processes the query
        var result = await _handler.HandleAsync(new GetClienteByIdQuery(entity.Id));

        // THEN: DTO contains all 7 fields correctly mapped from the entity
        Assert.NotNull(result);
        Assert.Equal(entity.Id, result.Id);
        Assert.Equal("Empresa Beta", result.Nombre);
        Assert.Equal("900222222-2", result.Nit);
        Assert.Equal("3002222222", result.Telefono);
        Assert.Equal("Medellín", result.Ciudad);
        Assert.IsType<DateTimeOffset>(result.CreatedAt);
        Assert.IsType<DateTimeOffset>(result.UpdatedAt);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryFindsEntity_ShouldMapCreatedAtFromEntity()
    {
        // GIVEN: a freshly-created entity with a known CreatedAt
        var entity = ClienteEntity.Create("CreatedAt Corp", "900300003-3", "3003333333", "Cali");
        _repositoryMock
            .Setup(r => r.GetByIdAsync(entity.Id))
            .ReturnsAsync(entity);

        // WHEN: handler processes the query
        var result = await _handler.HandleAsync(new GetClienteByIdQuery(entity.Id));

        // THEN: DTO CreatedAt matches entity CreatedAt (not a new DateTimeOffset)
        Assert.NotNull(result);
        Assert.Equal(entity.CreatedAt, result.CreatedAt);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryFindsEntity_ShouldMapUpdatedAtFromEntity()
    {
        // GIVEN: a client entity
        var entity = ClienteEntity.Create("UpdatedAt Corp", "900400004-4", "3004444444", "Cartagena");
        _repositoryMock
            .Setup(r => r.GetByIdAsync(entity.Id))
            .ReturnsAsync(entity);

        // WHEN: handler processes the query
        var result = await _handler.HandleAsync(new GetClienteByIdQuery(entity.Id));

        // THEN: DTO UpdatedAt matches entity UpdatedAt
        Assert.NotNull(result);
        Assert.Equal(entity.UpdatedAt, result.UpdatedAt);
    }

    [Fact]
    public async Task HandleAsync_ShouldCallRepositoryGetByIdAsyncExactlyOnce()
    {
        // GIVEN: repository is set up to return a client
        var id = Guid.NewGuid();
        var entity = ClienteEntity.Create("Solo Corp", "900500005-5", "3005555555", "Bogotá");
        _repositoryMock
            .Setup(r => r.GetByIdAsync(id))
            .ReturnsAsync(entity);

        // WHEN: handler processes the query
        await _handler.HandleAsync(new GetClienteByIdQuery(id));

        // THEN: repository GetByIdAsync was called exactly once with the correct id
        _repositoryMock.Verify(r => r.GetByIdAsync(id), Times.Once);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC-E2-P1-02b: Handler returns null when client does not exist
    // AC3: Non-existent clienteId → not-found (enables 404 at endpoint level)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsNull_ShouldReturnNull()
    {
        // GIVEN: repository returns null (no client found for this id)
        var nonExistentId = Guid.NewGuid();
        _repositoryMock
            .Setup(r => r.GetByIdAsync(nonExistentId))
            .ReturnsAsync((ClienteEntity?)null);

        // WHEN: handler processes the query with a non-existent id
        var result = await _handler.HandleAsync(new GetClienteByIdQuery(nonExistentId));

        // THEN: handler returns null (endpoint layer converts null to HTTP 404)
        Assert.Null(result);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsNull_ShouldStillCallRepositoryOnce()
    {
        // GIVEN: repository returns null
        var nonExistentId = Guid.NewGuid();
        _repositoryMock
            .Setup(r => r.GetByIdAsync(nonExistentId))
            .ReturnsAsync((ClienteEntity?)null);

        // WHEN: handler processes the query
        await _handler.HandleAsync(new GetClienteByIdQuery(nonExistentId));

        // THEN: repository was queried exactly once (no retry or exception thrown)
        _repositoryMock.Verify(r => r.GetByIdAsync(nonExistentId), Times.Once);
    }
}
