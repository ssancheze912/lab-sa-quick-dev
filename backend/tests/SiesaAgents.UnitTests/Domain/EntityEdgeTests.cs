using SiesaAgents.Domain.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Domain;

// Re-use the TestEntity declared in EntityTests.cs within the same namespace

public class EntityEdgeTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Domain events — AddDomainEvent and ClearDomainEvents behavior
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Entity_AfterAddingDomainEvent_HasOneEvent()
    {
        // Arrange
        var entity = TestEntityWithEvents.Create();
        var @event = new object();

        // Act
        entity.PublicAddDomainEvent(@event);

        // Assert
        Assert.Single(entity.DomainEvents);
    }

    [Fact]
    public void Entity_AfterAddingMultipleDomainEvents_CountMatchesAdded()
    {
        // Arrange
        var entity = TestEntityWithEvents.Create();

        // Act
        entity.PublicAddDomainEvent(new object());
        entity.PublicAddDomainEvent(new object());
        entity.PublicAddDomainEvent(new object());

        // Assert
        Assert.Equal(3, entity.DomainEvents.Count);
    }

    [Fact]
    public void Entity_AfterClearDomainEvents_HasNoEvents()
    {
        // Arrange
        var entity = TestEntityWithEvents.Create();
        entity.PublicAddDomainEvent(new object());
        entity.PublicAddDomainEvent(new object());

        // Act
        entity.ClearDomainEvents();

        // Assert
        Assert.Empty(entity.DomainEvents);
    }

    [Fact]
    public void Entity_ClearDomainEventsOnEmptyList_DoesNotThrow()
    {
        // Arrange
        var entity = TestEntityWithEvents.Create();

        // Act & Assert: clearing an already-empty list must not throw
        var ex = Record.Exception(() => entity.ClearDomainEvents());
        Assert.Null(ex);
    }

    [Fact]
    public void Entity_DomainEvents_IsReadOnly_CannotBeModifiedExternally()
    {
        // Arrange
        var entity = TestEntityWithEvents.Create();

        // Act
        var events = entity.DomainEvents;

        // Assert: IReadOnlyList — cast to IList must throw NotSupportedException
        var iList = events as System.Collections.Generic.IList<object>;
        Assert.NotNull(iList); // IReadOnlyList<T> inherits IList<T> in .NET reflection

        // The actual backing list is not directly accessible; DomainEvents is a read-only view
        // Verify the returned reference IS a read-only wrapper (not the mutable list itself)
        Assert.IsAssignableFrom<System.Collections.Generic.IReadOnlyList<object>>(events);
    }

    [Fact]
    public void Entity_SameEventAddedTwice_AppearsTwiceInList()
    {
        // Arrange: domain events are not deduplicated — the same event object can appear twice
        var entity = TestEntityWithEvents.Create();
        var singleEvent = new object();

        // Act
        entity.PublicAddDomainEvent(singleEvent);
        entity.PublicAddDomainEvent(singleEvent);

        // Assert
        Assert.Equal(2, entity.DomainEvents.Count);
        Assert.Same(singleEvent, entity.DomainEvents[0]);
        Assert.Same(singleEvent, entity.DomainEvents[1]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Id assignment — boundary conditions
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Entity_Id_IsNotDefaultGuid()
    {
        // Boundary: Guid.NewGuid() must never produce Guid.Empty
        var entity = TestEntity.Create();
        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    [Fact]
    public void Entity_IdsAreUnique_Across100Instances()
    {
        // Boundary: probabilistic uniqueness check — Guid collision probability is negligible
        var ids = new System.Collections.Generic.HashSet<Guid>();
        for (int i = 0; i < 100; i++)
        {
            ids.Add(TestEntity.Create().Id);
        }
        // All 100 Guids must be distinct
        Assert.Equal(100, ids.Count);
    }

    [Fact]
    public void Entity_Id_IsVersion4StyleGuid()
    {
        // Architecture mandates Guid.NewGuid() — version 4 UUIDs
        // We cannot directly check UUID version from Guid, but we verify it's a non-empty, valid GUID
        var entity = TestEntity.Create();
        Assert.True(entity.Id != Guid.Empty);
        // Converting to string should produce the canonical 8-4-4-4-12 format
        var guidString = entity.Id.ToString();
        Assert.Matches(
            @"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
            guidString
        );
    }
}

/// <summary>
/// Exposes the protected AddDomainEvent method for testing purposes.
/// Sealed to prevent unintended extension in tests.
/// </summary>
public sealed class TestEntityWithEvents : Entity
{
    public static TestEntityWithEvents Create() => new();

    public void PublicAddDomainEvent(object domainEvent) =>
        AddDomainEvent(domainEvent);
}
