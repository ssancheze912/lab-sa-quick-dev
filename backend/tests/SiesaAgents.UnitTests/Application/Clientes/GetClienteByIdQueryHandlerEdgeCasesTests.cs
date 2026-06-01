// Story 2.2: Client Detail View — Automation Expansion
// Epic 2: Client Management
//
// Unit Tests — AUTOMATION EXPANSION (xUnit)
// Edge cases and boundary conditions NOT covered by ATDD tests.
//
// Focus areas:
//   - Empty Guid (Guid.Empty) passed as query Id
//   - Multiple entities in repository — correct one is returned (no leakage)
//   - CancellationToken forwarded to GetByIdAsync
//   - DTO field mapping completeness (all 7 fields in a single assertion)
//   - Handler is idempotent (two consecutive calls with same repository state)
//   - DTO has non-empty Guid as Id
//   - DTO timestamps are DateTimeOffset with UTC offset
//   - GetClienteByIdQuery record equality semantics
//   - Handler instantiation with valid repository is non-null
//   - Entity created immediately before query has CreatedAt ≤ UpdatedAt
//   - Handler returns null when repository has entities but none match the given Id

using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

// ─── Fake repository with CancellationToken observability for GetById ─────────

internal sealed class ObservableFakeClienteRepositoryById : IClienteRepository
{
    private readonly IReadOnlyList<ClienteEntity> _entities;
    public CancellationToken LastGetByIdCancellationToken { get; private set; }

    public ObservableFakeClienteRepositoryById(IReadOnlyList<ClienteEntity> entities)
        => _entities = entities;

    public Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct)
        => Task.FromResult(_entities);

    public Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        LastGetByIdCancellationToken = ct;
        return Task.FromResult(_entities.FirstOrDefault(e => e.Id == id));
    }

    public Task AddAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
    public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct) => Task.CompletedTask;
    public Task DeleteAsync(Guid id, CancellationToken ct) => Task.CompletedTask;
    public Task<bool> ExistsByNitAsync(string nit, CancellationToken ct) => Task.FromResult(false);
}

// ─── Edge case tests ─────────────────────────────────────────────────────────

public class GetClienteByIdQueryHandlerEdgeCasesTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Guid.Empty as query Id — repository has no match → returns null
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P0] Handler: Guid.Empty Id returns null (no match boundary)")]
    public async Task HandleAsync_WithGuidEmpty_ReturnsNull()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(Guid.Empty), CancellationToken.None);

        // Assert: Guid.Empty is a valid but non-matching Guid — handler returns null
        Assert.Null(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Multiple entities in repo — correct entity is returned, no leakage
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P0] Handler: with 3 entities, returns only the entity whose Id matches query")]
    public async Task HandleAsync_WithMultipleEntities_ReturnsOnlyMatchingEntity()
    {
        // Arrange
        var target = ClienteEntity.Create("Empresa Target", "900123456-1", "3001234567", "Bogotá");
        var other1 = ClienteEntity.Create("Empresa Other1", "900000001-1", "3000000001", "Cali");
        var other2 = ClienteEntity.Create("Empresa Other2", "900000002-2", "3000000002", "Medellín");

        var repository = new FakeClienteRepository([target, other1, other2]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(target.Id), CancellationToken.None);

        // Assert: returns only the target entity's DTO, not any other entity
        Assert.NotNull(result);
        Assert.Equal(target.Id, result.Id);
        Assert.Equal("Empresa Target", result.Nombre);
    }

    [Fact(DisplayName = "[P0] Handler: with 3 entities, does NOT return a different entity's data")]
    public async Task HandleAsync_WithMultipleEntities_DoesNotReturnOtherEntityData()
    {
        // Arrange
        var target = ClienteEntity.Create("Empresa Target", "900123456-1", "3001234567", "Bogotá");
        var other = ClienteEntity.Create("Empresa Other", "900000001-1", "3000000001", "Cali");

        var repository = new FakeClienteRepository([target, other]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act: query for target
        var result = await handler.HandleAsync(new GetClienteByIdQuery(target.Id), CancellationToken.None);

        // Assert: result is NOT the other entity's data
        Assert.NotNull(result);
        Assert.NotEqual(other.Id, result.Id);
        Assert.NotEqual("Empresa Other", result.Nombre);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: CancellationToken is forwarded to GetByIdAsync
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Handler: CancellationToken is forwarded to IClienteRepository.GetByIdAsync")]
    public async Task HandleAsync_ForwardsCancellationTokenToGetByIdAsync()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");
        var repository = new ObservableFakeClienteRepositoryById([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);

        using var cts = new CancellationTokenSource();
        var expectedToken = cts.Token;

        // Act
        await handler.HandleAsync(new GetClienteByIdQuery(entity.Id), expectedToken);

        // Assert: the token passed to HandleAsync was forwarded to the repository
        Assert.Equal(expectedToken, repository.LastGetByIdCancellationToken);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: DTO field mapping completeness (all 7 fields in a single assertion)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P0] Handler: all 7 DTO fields (Id, Nombre, Nit, Telefono, Ciudad, CreatedAt, UpdatedAt) mapped correctly")]
    public async Task HandleAsync_ExistingId_MapsAllSevenFieldsCorrectly()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa Completa", "900999000-1", "3007654321", "Barranquilla");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // Assert: all 7 fields are correctly mapped from entity to DTO
        Assert.NotNull(result);
        Assert.Equal(entity.Id, result.Id);
        Assert.Equal(entity.Nombre, result.Nombre);
        Assert.Equal(entity.Nit, result.Nit);
        Assert.Equal(entity.Telefono, result.Telefono);
        Assert.Equal(entity.Ciudad, result.Ciudad);
        Assert.Equal(entity.CreatedAt, result.CreatedAt);
        Assert.Equal(entity.UpdatedAt, result.UpdatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Idempotency — two consecutive calls with same repository state
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Handler: two consecutive calls for same Id return equivalent DTOs (idempotent read)")]
    public async Task HandleAsync_CalledTwiceForSameId_ReturnEquivalentDtos()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa Idempotente", "900888000-1", "3001111111", "Cali");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result1 = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id), CancellationToken.None);
        var result2 = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // Assert: both calls produce structurally equivalent DTOs
        Assert.NotNull(result1);
        Assert.NotNull(result2);
        Assert.Equal(result1.Id, result2.Id);
        Assert.Equal(result1.Nombre, result2.Nombre);
        Assert.Equal(result1.Nit, result2.Nit);
        Assert.Equal(result1.CreatedAt, result2.CreatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: DTO Id is a non-empty Guid (UUID PK — architecture standard)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P0] Handler: DTO Id is a non-empty Guid (UUID PK architecture standard)")]
    public async Task HandleAsync_DtoId_IsNonEmptyGuid()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa UUID Test", "900777000-1", "3001234567", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.Id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: DTO timestamps are DateTimeOffset with UTC offset
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P0] Handler: DTO CreatedAt is DateTimeOffset with UTC offset (not DateTime — anti-pattern prevented)")]
    public async Task HandleAsync_DtoTimestamps_AreDateTimeOffsetWithUtcOffset()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa Timestamp", "900666000-1", "3001234567", "Medellín");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // Assert: timestamps are DateTimeOffset with UTC offset
        Assert.NotNull(result);
        Assert.IsType<DateTimeOffset>(result.CreatedAt);
        Assert.IsType<DateTimeOffset>(result.UpdatedAt);
        Assert.Equal(TimeSpan.Zero, result.CreatedAt.Offset);
        Assert.Equal(TimeSpan.Zero, result.UpdatedAt.Offset);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: CreatedAt ≤ UpdatedAt for a freshly created entity
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P0] Handler: DTO CreatedAt equals UpdatedAt for freshly created entity (no updates applied)")]
    public async Task HandleAsync_FreshEntity_CreatedAtEqualToUpdatedAt()
    {
        // Arrange: entity just created (no Update() called)
        var entity = ClienteEntity.Create("Empresa Fresh", "900555000-1", "3001234567", "Bogotá");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // Assert: for a brand-new entity, createdAt === updatedAt
        Assert.NotNull(result);
        Assert.Equal(result.CreatedAt, result.UpdatedAt);
    }

    [Fact(DisplayName = "[P0] Handler: DTO CreatedAt is not in the future (temporal sanity check)")]
    public async Task HandleAsync_DtoCreatedAt_IsNotInTheFuture()
    {
        // Arrange
        var beforeCreate = DateTimeOffset.UtcNow;
        var entity = ClienteEntity.Create("Empresa Tiempo Test", "900444000-1", "3001234567", "Cali");
        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id), CancellationToken.None);
        var afterCreate = DateTimeOffset.UtcNow;

        // Assert: CreatedAt is between beforeCreate and afterCreate (not in the future)
        Assert.NotNull(result);
        Assert.True(result.CreatedAt >= beforeCreate, "CreatedAt should not be before entity was created");
        Assert.True(result.CreatedAt <= afterCreate, "CreatedAt should not be in the future");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: GetClienteByIdQuery record value equality
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] GetClienteByIdQuery: two queries with same Id are value-equal (record semantics)")]
    public void GetClienteByIdQuery_TwoQueriesWithSameId_AreValueEqual()
    {
        // Arrange
        var id = Guid.NewGuid();

        // Act
        var q1 = new GetClienteByIdQuery(id);
        var q2 = new GetClienteByIdQuery(id);

        // Assert: C# record types implement structural equality
        Assert.Equal(q1, q2);
    }

    [Fact(DisplayName = "[P1] GetClienteByIdQuery: two queries with different Ids are not equal")]
    public void GetClienteByIdQuery_TwoQueriesWithDifferentIds_AreNotEqual()
    {
        // Arrange
        var q1 = new GetClienteByIdQuery(Guid.NewGuid());
        var q2 = new GetClienteByIdQuery(Guid.NewGuid());

        // Assert
        Assert.NotEqual(q1, q2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Handler instantiation with valid repository is non-null
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Handler: constructor injection with valid repository produces non-null handler")]
    public void Handler_WithValidRepository_IsNotNull()
    {
        // Arrange & Act
        var repository = new FakeClienteRepository([]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Assert
        Assert.NotNull(handler);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Handler returns null for an Id that belongs to a DIFFERENT entity class
    //       (simulates entity registry not containing the requested type)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P0] Handler: empty repository always returns null regardless of requested Id")]
    public async Task HandleAsync_EmptyRepository_AlwaysReturnsNull()
    {
        // Arrange: no entities at all
        var repository = new FakeClienteRepository([]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act: try a few different Ids to confirm consistent null behavior
        var result1 = await handler.HandleAsync(new GetClienteByIdQuery(Guid.NewGuid()), CancellationToken.None);
        var result2 = await handler.HandleAsync(new GetClienteByIdQuery(Guid.NewGuid()), CancellationToken.None);
        var result3 = await handler.HandleAsync(new GetClienteByIdQuery(Guid.Empty), CancellationToken.None);

        // Assert
        Assert.Null(result1);
        Assert.Null(result2);
        Assert.Null(result3);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: ClienteDto is a record — value equality for test convenience
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] ClienteDto: two DTOs with identical field values are value-equal (record semantics)")]
    public void ClienteDto_WithIdenticalValues_AreValueEqual()
    {
        // Arrange
        var id = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        var dto1 = new ClienteDto(id, "Empresa", "NIT-001", "3001234567", "Bogotá", now, now);
        var dto2 = new ClienteDto(id, "Empresa", "NIT-001", "3001234567", "Bogotá", now, now);

        // Assert
        Assert.Equal(dto1, dto2);
    }

    [Fact(DisplayName = "[P1] ClienteDto: two DTOs with different Ids are not equal")]
    public void ClienteDto_WithDifferentIds_AreNotEqual()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var dto1 = new ClienteDto(Guid.NewGuid(), "Empresa", "NIT-001", "300", "Bogotá", now, now);
        var dto2 = new ClienteDto(Guid.NewGuid(), "Empresa", "NIT-001", "300", "Bogotá", now, now);

        // Assert
        Assert.NotEqual(dto1, dto2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: DTO Id matches the entity Id exactly (no transformation/truncation)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P0] Handler: DTO Id is byte-for-byte identical to the entity Id (no truncation/transformation)")]
    public async Task HandleAsync_DtoId_IsExactlyEqualToEntityId()
    {
        // Arrange
        var entity = ClienteEntity.Create("Empresa Exact ID", "900333000-1", "3001234567", "Bogotá");
        var expectedId = entity.Id; // capture before any possible mutation

        var repository = new FakeClienteRepository([entity]);
        var handler = new GetClienteByIdQueryHandler(repository);

        // Act
        var result = await handler.HandleAsync(new GetClienteByIdQuery(entity.Id), CancellationToken.None);

        // Assert: DTO Id is identical to entity Id
        Assert.NotNull(result);
        Assert.Equal(expectedId, result.Id);
        Assert.True(result.Id.ToString("D").Length == 36, "UUID should be 36 characters in format 8-4-4-4-12");
    }
}
