namespace SiesaAgents.Domain.Events;

/// <summary>
/// Marker interface for all domain events.
/// Domain events are raised by entities and dispatched by the application/infrastructure layer.
/// </summary>
public interface IDomainEvent
{
    DateTimeOffset OccurredOn { get; }
}
