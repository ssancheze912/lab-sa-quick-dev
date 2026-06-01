// Story 2.1: Client List & Search — Automation Expansion
// Epic 2: Client Management
//
// Unit Tests — AUTOMATION EXPANSION (xUnit)
// Edge cases and boundary conditions NOT covered by ATDD tests.
//
// Focus areas:
//   - Handler with exactly zero entities (empty list)
//   - Handler with exactly one entity (singleton list)
//   - Handler with a large number of entities (500 records — NFR1 boundary)
//   - DTO field mapping completeness for all 7 fields
//   - CancellationToken is forwarded to the repository
//   - Returned list is IReadOnlyList<ClienteDto> (immutable contract)
//   - Order preservation — DTOs maintain the same order as entities
//   - HandleAsync is idempotent (two calls return equivalent results)
//   - DTO is a record (value equality for testing convenience)

using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

// ─── Fake repository with CancellationToken observability ────────────────────

internal sealed class ObservableFakeClienteRepository : IClienteRepository
{
    private readonly IReadOnlyList<ClienteEntity> _entities;
    public CancellationToken LastCancellationToken { get; private set; }

    public ObservableFakeClienteRepository(IReadOnlyList<ClienteEntity> entities)
        => _entities = entities;

    public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
    {
        LastCancellationToken = ct;
        return Task.FromResult(_entities);
    }

    public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct) => Task.FromResult<ClienteEntity?>(null);
    public Task AddAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
    public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
    public Task DeleteAsync(Guid id, CancellationToken ct) => Task.CompletedTask;
    public Task<bool> ExistsByNitAsync(string nit, CancellationToken ct) => Task.FromResult(false);
}

// ─── Edge case tests ─────────────────────────────────────────────────────────

public class GetClientesQueryHandlerEdgeCasesTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Zero entities — empty list boundary
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P0] Handler: empty repository returns empty IReadOnlyList<ClienteDto>")]
    public async Task HandleAsync_WithZeroEntities_ReturnsEmptyReadOnlyList()
    {
        // Arrange
        var repository = new FakeClienteRepository([]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // Assert
        Assert.Empty(result);
        Assert.IsAssignableFrom<IReadOnlyList<ClienteDto>>(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Exactly one entity — singleton list
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P0] Handler: single entity maps to single-element DTO list")]
    public async Task HandleAsync_WithOneEntity_ReturnsSingleElementList()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa Singleton", "900000001-1", "3000000001", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // Assert
        Assert.Single(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Exactly 500 entities — NFR1 boundary condition
    //       Performance test is E2E-level; this verifies handler correctness at scale
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Handler: 500 entities all map to DTOs (NFR1 record count boundary)")]
    public async Task HandleAsync_With500Entities_Returns500Dtos()
    {
        // Arrange: generate 500 entities (NFR1 upper bound)
        var entities = Enumerable.Range(1, 500)
            .Select(i => ClienteEntity.Create($"Empresa {i:D3}", $"9{i:D8}-{i % 10}", $"300{i:D7}", "Bogotá"))
            .ToList();

        var repository = new FakeClienteRepository(entities);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // Assert
        Assert.Equal(500, result.Count);
    }

    [Fact(DisplayName = "[P1] Handler: 500-entity result is IReadOnlyList<ClienteDto> (architecture contract)")]
    public async Task HandleAsync_With500Entities_ReturnTypeIsReadOnlyList()
    {
        // Arrange
        var entities = Enumerable.Range(1, 500)
            .Select(i => ClienteEntity.Create($"Empresa {i}", $"NIT{i}", "300", "Bogotá"))
            .ToList();

        var repository = new FakeClienteRepository(entities);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // Assert
        Assert.IsAssignableFrom<IReadOnlyList<ClienteDto>>(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: DTO field mapping completeness — all 7 fields verified in one test
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P0] Handler: all 7 DTO fields (Id, Nombre, Nit, Telefono, Ciudad, CreatedAt, UpdatedAt) are mapped")]
    public async Task HandleAsync_SingleEntity_MapsAllSevenDtoFields()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Medellín");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // Assert: all 7 fields present and mapped correctly
        var dto = result[0];
        Assert.Equal(entity.Id, dto.Id);
        Assert.Equal(entity.Nombre, dto.Nombre);
        Assert.Equal(entity.Nit, dto.Nit);
        Assert.Equal(entity.Telefono, dto.Telefono);
        Assert.Equal(entity.Ciudad, dto.Ciudad);
        Assert.Equal(entity.CreatedAt, dto.CreatedAt);
        Assert.Equal(entity.UpdatedAt, dto.UpdatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Order preservation — DTOs come back in repository order
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Handler: DTOs preserve the order returned by the repository")]
    public async Task HandleAsync_MultipleEntities_PreservesRepositoryOrder()
    {
        // Arrange: entities in a known order
        var e1 = ClienteEntity.Create("AAA Corp", "900000001-1", "300", "Bogotá");
        var e2 = ClienteEntity.Create("BBB Ltda", "900000002-2", "301", "Cali");
        var e3 = ClienteEntity.Create("CCC SAS", "900000003-3", "302", "Medellín");

        var repository = new FakeClienteRepository([e1, e2, e3]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // Assert: DTOs in the same order as entities
        Assert.Equal(e1.Id, result[0].Id);
        Assert.Equal(e2.Id, result[1].Id);
        Assert.Equal(e3.Id, result[2].Id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: CancellationToken is forwarded to the repository
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Handler: CancellationToken is forwarded to IClienteRepository.GetAllAsync")]
    public async Task HandleAsync_ForwardsCancellationTokenToRepository()
    {
        // Arrange
        var repository = new ObservableFakeClienteRepository([]);
        var handler = new GetClientesQueryHandler(repository);

        using var cts = new CancellationTokenSource();
        var expectedToken = cts.Token;

        // Act
        await handler.HandleAsync(new GetClientesQuery(), expectedToken);

        // Assert: the token passed to HandleAsync was forwarded to the repository
        Assert.Equal(expectedToken, repository.LastCancellationToken);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Idempotency — two consecutive calls with same repository state return equivalent results
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Handler: two consecutive calls return equivalent DTO lists (idempotent read)")]
    public async Task HandleAsync_CalledTwiceWithSameRepositoryState_ReturnEquivalentResults()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa Test", "900999001-1", "3001111111", "Cali");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result1 = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);
        var result2 = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // Assert: both calls produce the same count and same Ids
        Assert.Equal(result1.Count, result2.Count);
        Assert.Equal(result1[0].Id, result2[0].Id);
        Assert.Equal(result1[0].Nombre, result2[0].Nombre);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: ClienteDto is a record — verify value equality contract
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] ClienteDto: two DTOs with identical field values are value-equal (record semantics)")]
    public void ClienteDto_WithIdenticalValues_AreValueEqual()
    {
        // Arrange
        var id = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        var dto1 = new ClienteDto(id, "Empresa", "NIT", "300", "Bogotá", now, now);
        var dto2 = new ClienteDto(id, "Empresa", "NIT", "300", "Bogotá", now, now);

        // Assert: C# record types implement structural equality
        Assert.Equal(dto1, dto2);
    }

    [Fact(DisplayName = "[P1] ClienteDto: two DTOs with different Ids are not equal")]
    public void ClienteDto_WithDifferentIds_AreNotEqual()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var dto1 = new ClienteDto(Guid.NewGuid(), "Empresa", "NIT", "300", "Bogotá", now, now);
        var dto2 = new ClienteDto(Guid.NewGuid(), "Empresa", "NIT", "300", "Bogotá", now, now);

        // Assert
        Assert.NotEqual(dto1, dto2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: ClienteDto Id is a Guid (UUID PK — architecture standard)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P0] Handler: DTO Id is a non-empty Guid (UUID PK architecture standard)")]
    public async Task HandleAsync_DtoId_IsNonEmptyGuid()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa", "NIT", "300", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // Assert
        Assert.NotEqual(Guid.Empty, result[0].Id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: DTO timestamps are DateTimeOffset (not DateTime — architecture anti-pattern)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P0] Handler: DTO CreatedAt is DateTimeOffset (not DateTime — anti-pattern prevented)")]
    public async Task HandleAsync_DtoCreatedAt_IsDateTimeOffset()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa", "NIT", "300", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // Assert: compile-time guarantee confirmed at runtime via type check
        Assert.IsType<DateTimeOffset>(result[0].CreatedAt);
        Assert.IsType<DateTimeOffset>(result[0].UpdatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: DTO timestamps have UTC offset
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P0] Handler: DTO CreatedAt has UTC offset (zero offset)")]
    public async Task HandleAsync_DtoCreatedAt_HasUtcOffset()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa", "NIT", "300", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClientesQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClientesQuery(), CancellationToken.None);

        // Assert: UTC offset is +00:00
        Assert.Equal(TimeSpan.Zero, result[0].CreatedAt.Offset);
        Assert.Equal(TimeSpan.Zero, result[0].UpdatedAt.Offset);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: GetClientesQuery is a parameter-less query record
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] GetClientesQuery: two instances are value-equal (record with no properties)")]
    public void GetClientesQuery_TwoInstances_AreValueEqual()
    {
        // Arrange
        var q1 = new GetClientesQuery();
        var q2 = new GetClientesQuery();

        // Assert: records with no properties are always equal by value
        Assert.Equal(q1, q2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Handler is not null after DI injection (constructor injection pattern)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Handler: constructor injection with valid repository produces non-null handler")]
    public void Handler_WithValidRepository_IsNotNull()
    {
        // Arrange & Act
        var repository = new FakeClienteRepository([]);
        var handler = new GetClientesQueryHandler(repository);

        // Assert
        Assert.NotNull(handler);
    }
}
