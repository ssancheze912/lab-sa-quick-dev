/**
 * Story 2.1: Client List & Search
 * Unit Tests — GetClientesQueryHandler Edge Cases (Automate — EXPAND)
 *
 * Covers boundary conditions and error paths NOT in ATDD tests:
 *   - Repository throws exception — handler propagates it (no swallowing)
 *   - Single-item list mapping preserves all fields
 *   - Large list (50 items) returns correct count
 *   - All DTO fields map 1:1 from entity (no field drift)
 *   - Multiple HandleAsync calls each invoke repository once
 */

using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;
using Moq;
using Xunit;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClientesQueryHandlerEdgeCaseTests
{
    private readonly Mock<IClienteRepository> _repositoryMock;
    private readonly GetClientesQueryHandler _handler;

    public GetClientesQueryHandlerEdgeCaseTests()
    {
        _repositoryMock = new Mock<IClienteRepository>();
        _handler = new GetClientesQueryHandler(_repositoryMock.Object);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Error path: repository throws — handler must NOT swallow the exception
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_WhenRepositoryThrows_ShouldPropagateException()
    {
        // GIVEN: repository throws an InvalidOperationException (e.g., DB connection lost)
        _repositoryMock
            .Setup(r => r.GetAllAsync())
            .ThrowsAsync(new InvalidOperationException("Database unavailable"));

        // WHEN / THEN: exception propagates without being swallowed
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _handler.HandleAsync(new GetClientesQuery())
        );
    }

    [Fact]
    public async Task HandleAsync_WhenRepositoryThrowsGeneric_ShouldNotCatchExceptions()
    {
        // GIVEN: repository throws a generic Exception
        _repositoryMock
            .Setup(r => r.GetAllAsync())
            .ThrowsAsync(new Exception("Unexpected error"));

        // WHEN / THEN: the raw exception type is preserved
        var ex = await Assert.ThrowsAsync<Exception>(
            () => _handler.HandleAsync(new GetClientesQuery())
        );

        Assert.Equal("Unexpected error", ex.Message);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: single-item list — DTO fields map exactly from entity
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_SingleItem_ShouldMapIdFromEntity()
    {
        // GIVEN: repository returns exactly one client
        var entity = ClienteEntity.Create("Solo Corp", "900001001-1", "3001001001", "Bogotá");
        _repositoryMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ClienteEntity> { entity });

        // WHEN
        var result = await _handler.HandleAsync(new GetClientesQuery());

        // THEN: the DTO Id equals the entity Id (no new Guid generated at handler level)
        var dto = result.Single();
        Assert.Equal(entity.Id, dto.Id);
    }

    [Fact]
    public async Task HandleAsync_SingleItem_ShouldMapTelefonoFromEntity()
    {
        // GIVEN
        var entity = ClienteEntity.Create("Tel Corp", "900002002-2", "3009998877", "Cali");
        _repositoryMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ClienteEntity> { entity });

        // WHEN
        var result = await _handler.HandleAsync(new GetClientesQuery());

        // THEN: Telefono is mapped
        var dto = result.Single();
        Assert.Equal("3009998877", dto.Telefono);
    }

    [Fact]
    public async Task HandleAsync_SingleItem_ShouldMapCiudadFromEntity()
    {
        // GIVEN
        var entity = ClienteEntity.Create("Ciudad Corp", "900003003-3", "3001111111", "Cartagena");
        _repositoryMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ClienteEntity> { entity });

        // WHEN
        var result = await _handler.HandleAsync(new GetClientesQuery());

        // THEN: Ciudad is mapped
        var dto = result.Single();
        Assert.Equal("Cartagena", dto.Ciudad);
    }

    [Fact]
    public async Task HandleAsync_SingleItem_ShouldMapCreatedAtFromEntity()
    {
        // GIVEN
        var before = DateTimeOffset.UtcNow;
        var entity = ClienteEntity.Create("CreatedAt Corp", "900004004-4", "3001111111", "Bogotá");
        var after = DateTimeOffset.UtcNow;

        _repositoryMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ClienteEntity> { entity });

        // WHEN
        var result = await _handler.HandleAsync(new GetClientesQuery());

        // THEN: DTO CreatedAt is the same as the entity's CreatedAt
        var dto = result.Single();
        Assert.Equal(entity.CreatedAt, dto.CreatedAt);
        Assert.True(dto.CreatedAt >= before && dto.CreatedAt <= after);
    }

    [Fact]
    public async Task HandleAsync_SingleItem_ShouldMapUpdatedAtFromEntity()
    {
        // GIVEN
        var entity = ClienteEntity.Create("UpdatedAt Corp", "900005005-5", "3001111111", "Medellín");
        _repositoryMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ClienteEntity> { entity });

        // WHEN
        var result = await _handler.HandleAsync(new GetClientesQuery());

        // THEN: DTO UpdatedAt equals entity UpdatedAt
        var dto = result.Single();
        Assert.Equal(entity.UpdatedAt, dto.UpdatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: large list (50 items) — correct count, no duplicates
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_With50Items_ShouldReturnAll50()
    {
        // GIVEN: repository returns 50 clients
        var entities = Enumerable.Range(1, 50)
            .Select(i => ClienteEntity.Create($"Empresa {i}", $"9001{i:D5}-{i % 10}", "3001111111", "Bogotá"))
            .ToList();

        _repositoryMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(entities);

        // WHEN
        var result = await _handler.HandleAsync(new GetClientesQuery());

        // THEN: all 50 are returned
        Assert.Equal(50, result.Count());
    }

    [Fact]
    public async Task HandleAsync_With50Items_ShouldReturnDistinctIds()
    {
        // GIVEN: 50 clients with unique IDs from Create()
        var entities = Enumerable.Range(1, 50)
            .Select(i => ClienteEntity.Create($"Empresa {i}", $"9002{i:D5}-{i % 10}", "3001111111", "Bogotá"))
            .ToList();

        _repositoryMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(entities);

        // WHEN
        var result = await _handler.HandleAsync(new GetClientesQuery());

        // THEN: no duplicate IDs in the returned DTOs
        var ids = result.Select(d => d.Id).ToList();
        Assert.Equal(50, ids.Distinct().Count());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: multiple calls — each invocation calls repository exactly once
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_CalledTwice_ShouldCallRepositoryTwice()
    {
        // GIVEN: repository is set up to return empty list
        _repositoryMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ClienteEntity>());

        // WHEN: handler is called twice (simulates two HTTP requests)
        await _handler.HandleAsync(new GetClientesQuery());
        await _handler.HandleAsync(new GetClientesQuery());

        // THEN: repository was called exactly twice (no internal caching at handler level)
        _repositoryMock.Verify(r => r.GetAllAsync(), Times.Exactly(2));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: DTO type is ClienteDto record — verify it's IEnumerable<ClienteDto>
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_ShouldReturnIEnumerableOfClienteDto()
    {
        // GIVEN: one client in repository
        _repositoryMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ClienteEntity>
            {
                ClienteEntity.Create("Type Check Corp", "900009009-9", "3001111111", "Bogotá"),
            });

        // WHEN
        var result = await _handler.HandleAsync(new GetClientesQuery());

        // THEN: result is IEnumerable<ClienteDto>
        Assert.IsAssignableFrom<IEnumerable<ClienteDto>>(result);
        Assert.Single(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: special characters preserved through handler mapping
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_EntityWithSpecialCharacters_ShouldPreserveThemInDto()
    {
        // GIVEN: entity with accented Spanish characters
        var entity = ClienteEntity.Create("Compañía Ñoño & Cía.", "900010010-0", "3001111111", "Bogotá");
        _repositoryMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<ClienteEntity> { entity });

        // WHEN
        var result = await _handler.HandleAsync(new GetClientesQuery());

        // THEN: special characters are preserved in the DTO
        var dto = result.Single();
        Assert.Equal("Compañía Ñoño & Cía.", dto.Nombre);
    }
}
