using Shared.Domain;

namespace SiesaAgents.UnitTests.SharedDomain;

/// <summary>
/// Unit tests for Shared.Domain.DomainEvent base record.
/// Story 1.1 — edge cases and boundary conditions.
/// </summary>
public class DomainEventTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Concrete test double (DomainEvent is abstract record)
    // ─────────────────────────────────────────────────────────────────────────

    private sealed record OrderCreatedEvent : DomainEvent;
    private sealed record OrderCancelledEvent : DomainEvent;

    // ─────────────────────────────────────────────────────────────────────────
    // Id — uniqueness and non-empty
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Id_IsNotEmpty_WhenEventIsCreated()
    {
        var evt = new OrderCreatedEvent();
        Assert.NotEqual(Guid.Empty, evt.Id);
    }

    [Fact]
    public void Id_IsDifferent_ForTwoDistinctEventInstances()
    {
        var a = new OrderCreatedEvent();
        var b = new OrderCreatedEvent();
        Assert.NotEqual(a.Id, b.Id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OccurredOn — DateTimeOffset (not DateTime)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void OccurredOn_IsDateTimeOffset_NotDateTime()
    {
        var evt = new OrderCreatedEvent();
        // Ensure the property type is DateTimeOffset (compile-time guaranteed but also runtime-verified)
        Assert.IsType<DateTimeOffset>(evt.OccurredOn);
    }

    [Fact]
    public void OccurredOn_IsNotMinValue_WhenEventIsCreated()
    {
        var evt = new OrderCreatedEvent();
        Assert.NotEqual(DateTimeOffset.MinValue, evt.OccurredOn);
    }

    [Fact]
    public void OccurredOn_IsUtcTime()
    {
        var before = DateTimeOffset.UtcNow;
        var evt = new OrderCreatedEvent();
        var after = DateTimeOffset.UtcNow;

        Assert.True(evt.OccurredOn >= before, "OccurredOn must be >= time before creation");
        Assert.True(evt.OccurredOn <= after, "OccurredOn must be <= time after creation");
    }

    [Fact]
    public void OccurredOn_Offset_IsZero_ForUtcTime()
    {
        var evt = new OrderCreatedEvent();
        // DateTimeOffset.UtcNow has zero offset
        Assert.Equal(TimeSpan.Zero, evt.OccurredOn.Offset);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Record semantics — init-only properties
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void DomainEvent_CanBeCreatedWithCustomIdViaWithExpression()
    {
        var original = new OrderCreatedEvent();
        var customId = Guid.NewGuid();
        var copy = original with { Id = customId };

        Assert.Equal(customId, copy.Id);
        // Original is not mutated
        Assert.NotEqual(customId, original.Id);
    }

    [Fact]
    public void DomainEvent_CanBeCreatedWithCustomOccurredOn()
    {
        var original = new OrderCreatedEvent();
        var specificTime = new DateTimeOffset(2025, 1, 15, 10, 30, 0, TimeSpan.Zero);
        var copy = original with { OccurredOn = specificTime };

        Assert.Equal(specificTime, copy.OccurredOn);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Polymorphism — different event types are distinguishable
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void DifferentEventTypes_AreDistinguishableAtRuntime()
    {
        DomainEvent created = new OrderCreatedEvent();
        DomainEvent cancelled = new OrderCancelledEvent();

        Assert.IsType<OrderCreatedEvent>(created);
        Assert.IsType<OrderCancelledEvent>(cancelled);
        Assert.IsNotType<OrderCancelledEvent>(created);
    }
}
