using SiesaAgents.Domain.Entities;
using Xunit;

namespace SiesaAgents.UnitTests;

/// <summary>
/// Tests for the base Entity class — Story 1.1 AC5.
/// </summary>
public class EntityBaseTests
{
    private class TestEntity : Entity
    {
        public static TestEntity Create() => new();

        public void RaiseTestEvent(object evt) => AddDomainEvent(evt);
    }

    [Fact]
    public void Entity_CreatedWithNonEmptyGuid()
    {
        var entity = TestEntity.Create();

        Assert.NotEqual(Guid.Empty, entity.Id);
    }

    [Fact]
    public void Entity_DomainEvents_InitiallyEmpty()
    {
        var entity = TestEntity.Create();

        Assert.Empty(entity.DomainEvents);
    }

    [Fact]
    public void Entity_AddDomainEvent_AppearsInCollection()
    {
        var entity = TestEntity.Create();
        var evt = new object();

        entity.RaiseTestEvent(evt);

        Assert.Single(entity.DomainEvents);
        Assert.Contains(evt, entity.DomainEvents);
    }

    [Fact]
    public void Entity_ClearDomainEvents_EmptiesCollection()
    {
        var entity = TestEntity.Create();
        entity.RaiseTestEvent(new object());

        entity.ClearDomainEvents();

        Assert.Empty(entity.DomainEvents);
    }
}
