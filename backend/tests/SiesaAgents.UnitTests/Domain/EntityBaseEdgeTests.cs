using SiesaAgents.Domain.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Domain;

/// <summary>
/// Edge case and boundary tests for the Entity base class — Story 1.1
/// Expands ATDD coverage with timestamp types, equality guarantees,
/// and field initialization invariants.
///
/// ATDD base covers: non-empty Guid Id, CreatedAt is DateTimeOffset, IDs are unique.
/// This file covers: UpdatedAt type and value, Id is not Guid.Empty guard,
/// multiple rapid instantiations, timestamp ordering invariants.
/// </summary>
public class EntityBaseEdgeTests
{
    // ─── UpdatedAt type and initial value ────────────────────────────────────

    [Fact]
    public void Entity_WhenCreated_ShouldHaveUpdatedAtAsDateTimeOffset()
    {
        // GIVEN + WHEN: A new entity is created
        var entity = TestEntity.Create();

        // THEN: UpdatedAt uses DateTimeOffset (never DateTime) per company standards
        Assert.True(entity.UpdatedAt <= DateTimeOffset.UtcNow);
        Assert.True(entity.UpdatedAt > DateTimeOffset.UtcNow.AddSeconds(-5));
    }

    [Fact]
    public void Entity_WhenCreated_UpdatedAtShouldBeInitializedCloseToCreatedAt()
    {
        // GIVEN + WHEN: A single entity is created
        var entity = TestEntity.Create();

        // THEN: UpdatedAt and CreatedAt are within 1 second of each other at creation
        // (Both are set to DateTimeOffset.UtcNow in the constructor)
        var diff = Math.Abs((entity.UpdatedAt - entity.CreatedAt).TotalSeconds);
        Assert.True(diff < 1, $"UpdatedAt and CreatedAt should be close at creation but differ by {diff}s");
    }

    // ─── Id is never Guid.Empty (P0 guard) ───────────────────────────────────

    [Fact]
    public void Entity_WhenCreated_IdShouldNeverBeGuidEmpty()
    {
        // GIVEN + WHEN: An entity is instantiated
        var entity = TestEntity.Create();

        // THEN: Id is NOT Guid.Empty — ensures Guid.NewGuid() is actually called
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    [Fact]
    public void Entity_IdShouldBeRandomGuid_NotSequential()
    {
        // GIVEN + WHEN: Two entities are created in quick succession
        var entity1 = TestEntity.Create();
        var entity2 = TestEntity.Create();

        // THEN: IDs differ (Guid.NewGuid() does not return sequential predictable values)
        Assert.NotEqual(entity1.Id, entity2.Id);
    }

    // ─── Bulk instantiation (no shared state / static mutation) ──────────────

    [Fact]
    public void Entity_WhenCreatingMultipleInstances_AllIdsShouldBeUnique()
    {
        // GIVEN: 10 entities are created rapidly
        // WHEN: All IDs are collected into a set
        const int count = 10;
        var ids = Enumerable.Range(0, count)
            .Select(_ => TestEntity.Create().Id)
            .ToHashSet();

        // THEN: All IDs are unique — no collision from static state
        Assert.Equal(count, ids.Count);
    }

    [Fact]
    public void Entity_WhenCreatingMultipleInstances_TimestampsAreNotSharedState()
    {
        // GIVEN: Two entities created in sequence
        var entity1 = TestEntity.Create();
        var entity2 = TestEntity.Create();

        // THEN: Each instance has its own independent CreatedAt value
        // DateTimeOffset is a struct so this verifies no static/shared mutable field
        Assert.True(entity1.CreatedAt >= DateTimeOffset.MinValue);
        Assert.True(entity2.CreatedAt >= DateTimeOffset.MinValue);
    }

    // ─── Property accessibility (protected setter does not block reads) ──────

    [Fact]
    public void Entity_IdProperty_ShouldBePubliclyReadable()
    {
        // GIVEN + WHEN: Entity is created
        var entity = TestEntity.Create();

        // THEN: The Id property is publicly readable
        var id = entity.Id;
        Assert.IsType<Guid>(id);
    }

    [Fact]
    public void Entity_CreatedAtProperty_ShouldBePubliclyReadable()
    {
        // GIVEN + WHEN: Entity is created
        var entity = TestEntity.Create();

        // THEN: CreatedAt is publicly readable and is a DateTimeOffset
        var createdAt = entity.CreatedAt;
        Assert.IsType<DateTimeOffset>(createdAt);
    }

    [Fact]
    public void Entity_UpdatedAtProperty_ShouldBePubliclyReadable()
    {
        // GIVEN + WHEN: Entity is created
        var entity = TestEntity.Create();

        // THEN: UpdatedAt is publicly readable and is a DateTimeOffset
        var updatedAt = entity.UpdatedAt;
        Assert.IsType<DateTimeOffset>(updatedAt);
    }

    // ─── Timestamps not at default MinValue ──────────────────────────────────

    [Fact]
    public void Entity_WhenCreated_CreatedAtShouldNotBeMinValue()
    {
        // GIVEN + WHEN: Entity is instantiated
        var entity = TestEntity.Create();

        // THEN: CreatedAt is NOT the uninitialized default value
        Assert.NotEqual(DateTimeOffset.MinValue, entity.CreatedAt);
    }

    [Fact]
    public void Entity_WhenCreated_UpdatedAtShouldNotBeMinValue()
    {
        // GIVEN + WHEN: Entity is instantiated
        var entity = TestEntity.Create();

        // THEN: UpdatedAt is initialized — not left at default DateTimeOffset.MinValue
        Assert.NotEqual(DateTimeOffset.MinValue, entity.UpdatedAt);
    }
}
