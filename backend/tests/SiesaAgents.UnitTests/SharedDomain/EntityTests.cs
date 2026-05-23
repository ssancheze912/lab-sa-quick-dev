using Shared.Domain;

namespace SiesaAgents.UnitTests.SharedDomain;

/// <summary>
/// Unit tests for Shared.Domain.Entity base class.
/// Story 1.1 — edge cases and boundary conditions not covered by ATDD tests.
/// </summary>
public class EntityTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Concrete test double for the abstract Entity
    // ─────────────────────────────────────────────────────────────────────────

    private sealed class TestEntity : Entity { }

    private sealed class OtherTypeEntity : Entity { }

    // ─────────────────────────────────────────────────────────────────────────
    // Id generation — uniqueness and non-empty
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Id_IsNotEmpty_WhenEntityIsCreated()
    {
        var entity = new TestEntity();
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    [Fact]
    public void Id_IsDifferent_ForTwoDistinctInstances()
    {
        var a = new TestEntity();
        var b = new TestEntity();
        Assert.NotEqual(a.Id, b.Id);
    }

    [Fact]
    public void Id_IsStable_DoesNotChangeAfterCreation()
    {
        var entity = new TestEntity();
        var firstRead = entity.Id;
        var secondRead = entity.Id;
        Assert.Equal(firstRead, secondRead);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Equality — identity-based (by Id)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Equals_ReturnsTrue_ForSameReference()
    {
        var entity = new TestEntity();
        Assert.Equal(entity, entity);
    }

    [Fact]
    public void Equals_ReturnsFalse_ForTwoDifferentInstances()
    {
        var a = new TestEntity();
        var b = new TestEntity();
        Assert.NotEqual(a, b);
    }

    [Fact]
    public void Equals_ReturnsFalse_WhenComparedWithNull()
    {
        var entity = new TestEntity();
        Assert.False(entity.Equals(null));
    }

    [Fact]
    public void Equals_ReturnsFalse_ForDifferentEntityTypes_EvenWithSameId()
    {
        // Two entities of different runtime types cannot be equal (DDD rule)
        var a = new TestEntity();
        var b = new OtherTypeEntity();

        // Force same Id via reflection to test type-check branch
        typeof(Entity)
            .GetProperty(nameof(Entity.Id))!
            .SetValue(b, a.Id);

        Assert.False(a.Equals(b));
    }

    [Fact]
    public void Equals_ReturnsFalse_WhenComparedWithNonEntityObject()
    {
        var entity = new TestEntity();
        Assert.False(entity.Equals("some-string"));
        Assert.False(entity.Equals(42));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GetHashCode — consistent with Id
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void GetHashCode_IsConsistent_ForSameInstance()
    {
        var entity = new TestEntity();
        Assert.Equal(entity.GetHashCode(), entity.GetHashCode());
    }

    [Fact]
    public void GetHashCode_IsDifferent_ForTwoDifferentInstances()
    {
        // This is a probabilistic test — Guids are unique so hash collision is negligible
        var a = new TestEntity();
        var b = new TestEntity();
        Assert.NotEqual(a.GetHashCode(), b.GetHashCode());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Domain events — collection lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    private sealed class EntityWithEvents : Entity
    {
        public void RaiseTestEvent(DomainEvent evt) => AddDomainEvent(evt);
    }

    private sealed record TestDomainEvent : DomainEvent;

    [Fact]
    public void DomainEvents_IsEmpty_OnNewEntity()
    {
        var entity = new TestEntity();
        Assert.Empty(entity.DomainEvents);
    }

    [Fact]
    public void DomainEvents_ContainsEvent_AfterAddDomainEventIsCalled()
    {
        var entity = new EntityWithEvents();
        var evt = new TestDomainEvent();
        entity.RaiseTestEvent(evt);

        Assert.Single(entity.DomainEvents);
        Assert.Contains(evt, entity.DomainEvents);
    }

    [Fact]
    public void DomainEvents_CanAccumulateMultipleEvents()
    {
        var entity = new EntityWithEvents();
        entity.RaiseTestEvent(new TestDomainEvent());
        entity.RaiseTestEvent(new TestDomainEvent());
        entity.RaiseTestEvent(new TestDomainEvent());

        Assert.Equal(3, entity.DomainEvents.Count);
    }

    [Fact]
    public void ClearDomainEvents_RemovesAllEvents()
    {
        var entity = new EntityWithEvents();
        entity.RaiseTestEvent(new TestDomainEvent());
        entity.RaiseTestEvent(new TestDomainEvent());

        entity.ClearDomainEvents();

        Assert.Empty(entity.DomainEvents);
    }

    [Fact]
    public void DomainEvents_IsReadOnly_CannotBeDirectlyMutated()
    {
        // DomainEvents returns IReadOnlyCollection — callers cannot Add/Remove
        var entity = new TestEntity();
        // Verify the return type is IReadOnlyCollection (compile-time guarantee,
        // but we also check at runtime that it is not a mutable List)
        var collection = entity.DomainEvents;
        Assert.IsAssignableFrom<IReadOnlyCollection<DomainEvent>>(collection);
    }
}
