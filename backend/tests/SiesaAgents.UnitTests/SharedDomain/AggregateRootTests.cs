using Shared.Domain;

namespace SiesaAgents.UnitTests.SharedDomain;

/// <summary>
/// Unit tests for Shared.Domain.AggregateRoot base class.
/// Story 1.1 — verifies AggregateRoot inherits Entity behavior correctly.
/// </summary>
public class AggregateRootTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Concrete test doubles
    // ─────────────────────────────────────────────────────────────────────────

    private sealed class OrderAggregate : AggregateRoot
    {
        public void RaiseEvent(DomainEvent evt) => AddDomainEvent(evt);
    }

    private sealed record OrderPlacedEvent : DomainEvent;

    // ─────────────────────────────────────────────────────────────────────────
    // Inheritance contract — AggregateRoot IS-A Entity
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AggregateRoot_IsAnEntity()
    {
        var aggregate = new OrderAggregate();
        Assert.IsAssignableFrom<Entity>(aggregate);
    }

    [Fact]
    public void AggregateRoot_HasNonEmptyId_WhenCreated()
    {
        var aggregate = new OrderAggregate();
        Assert.NotEqual(Guid.Empty, aggregate.Id);
    }

    [Fact]
    public void TwoAggregates_HaveDifferentIds()
    {
        var a = new OrderAggregate();
        var b = new OrderAggregate();
        Assert.NotEqual(a.Id, b.Id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Domain events — inherited from Entity
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AggregateRoot_StartsWithEmptyDomainEvents()
    {
        var aggregate = new OrderAggregate();
        Assert.Empty(aggregate.DomainEvents);
    }

    [Fact]
    public void AggregateRoot_CanRaiseAndClearEvents()
    {
        var aggregate = new OrderAggregate();
        aggregate.RaiseEvent(new OrderPlacedEvent());

        Assert.Single(aggregate.DomainEvents);

        aggregate.ClearDomainEvents();
        Assert.Empty(aggregate.DomainEvents);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Equality — inherited from Entity (id-based)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AggregateRoot_Equals_SameInstance_ReturnsTrue()
    {
        var aggregate = new OrderAggregate();
        Assert.Equal(aggregate, aggregate);
    }

    [Fact]
    public void AggregateRoot_Equals_DifferentInstances_ReturnsFalse()
    {
        var a = new OrderAggregate();
        var b = new OrderAggregate();
        Assert.NotEqual(a, b);
    }
}
