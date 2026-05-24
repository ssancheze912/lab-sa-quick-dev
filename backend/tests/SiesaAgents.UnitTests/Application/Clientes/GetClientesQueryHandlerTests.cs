/**
 * Story 2.1: Client List & Search
 * Unit Tests — GetClientesQueryHandler (RED Phase — ATDD)
 *
 * Acceptance Criteria covered:
 *   AC1 — GET /api/v1/clientes returns all clients (TC-E2-P1-01, handler layer)
 *
 * These tests will FAIL until GetClientesQueryHandler and IClienteRepository are implemented.
 */

using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using Moq;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClientesQueryHandlerTests
{
    private readonly Mock<IClienteRepository> _repositoryMock;
    private readonly GetClientesQueryHandler _handler;

    public GetClientesQueryHandlerTests()
    {
        _repositoryMock = new Mock<IClienteRepository>();
        _handler = new GetClientesQueryHandler(_repositoryMock.Object);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Given: repository returns a list of 3 clients
    // When:  HandleAsync is called
    // Then:  handler returns IEnumerable<ClienteDto> mapped from repository data
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenRepositoryHasClients_ShouldReturnMappedDtoList()
    {
        // GIVEN: repository returns 3 clients
        var entities = new List<ClienteEntity>
        {
            ClienteEntity.Create("Empresa Alpha", "900111111-1", "3001111111", "Bogotá"),
            ClienteEntity.Create("Empresa Beta", "900222222-2", "3002222222", "Medellín"),
            ClienteEntity.Create("Empresa Gamma", "900333333-3", "3003333333", "Cali"),
        };

        _repositoryMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(entities);

        // WHEN: handler processes the query
        var result = await _handler.HandleAsync(new GetClientesQuery());

        // THEN: result is an IEnumerable<ClienteDto> with 3 elements
        var dtoList = result.ToList();
        Assert.Equal(3, dtoList.Count);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryHasClients_ShouldMapNombreCorrectly()
    {
        // GIVEN: repository returns a client with a known Nombre
        var entities = new List<ClienteEntity>
        {
            ClienteEntity.Create("Empresa Alpha", "900111111-1", "3001111111", "Bogotá"),
        };

        _repositoryMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(entities);

        // WHEN: handler processes the query
        var result = await _handler.HandleAsync(new GetClientesQuery());

        // THEN: the returned DTO has the correct Nombre
        var dto = result.Single();
        Assert.Equal("Empresa Alpha", dto.Nombre);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryHasClients_ShouldMapNitCorrectly()
    {
        // GIVEN: repository returns a client with a known NIT
        var entities = new List<ClienteEntity>
        {
            ClienteEntity.Create("Empresa Alpha", "900111111-1", "3001111111", "Bogotá"),
        };

        _repositoryMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(entities);

        // WHEN: handler processes the query
        var result = await _handler.HandleAsync(new GetClientesQuery());

        // THEN: the returned DTO has the correct Nit
        var dto = result.Single();
        Assert.Equal("900111111-1", dto.Nit);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryHasClients_ShouldMapAllRequiredFields()
    {
        // GIVEN: repository returns a client with all fields
        var entities = new List<ClienteEntity>
        {
            ClienteEntity.Create("Empresa Beta", "900222222-2", "3002222222", "Medellín"),
        };

        _repositoryMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(entities);

        // WHEN: handler processes the query
        var result = await _handler.HandleAsync(new GetClientesQuery());

        // THEN: DTO contains all fields per architecture spec (id, nombre, nit, telefono, ciudad, createdAt, updatedAt)
        var dto = result.Single();
        Assert.NotEqual(Guid.Empty, dto.Id);
        Assert.Equal("Empresa Beta", dto.Nombre);
        Assert.Equal("900222222-2", dto.Nit);
        Assert.Equal("3002222222", dto.Telefono);
        Assert.Equal("Medellín", dto.Ciudad);
        Assert.IsType<DateTimeOffset>(dto.CreatedAt);
        Assert.IsType<DateTimeOffset>(dto.UpdatedAt);
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryReturnsEmptyList_ShouldReturnEmptyEnumerable()
    {
        // GIVEN: repository returns an empty list (no clients in system)
        _repositoryMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ClienteEntity>());

        // WHEN: handler processes the query
        var result = await _handler.HandleAsync(new GetClientesQuery());

        // THEN: result is an empty enumerable (not null)
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task HandleAsync_ShouldCallRepositoryGetAllAsyncExactlyOnce()
    {
        // GIVEN: repository is set up
        _repositoryMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ClienteEntity>());

        // WHEN: handler processes the query
        await _handler.HandleAsync(new GetClientesQuery());

        // THEN: repository was called exactly once
        _repositoryMock.Verify(r => r.GetAllAsync(), Times.Once);
    }
}
