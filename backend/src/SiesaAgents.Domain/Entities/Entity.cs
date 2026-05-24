using SiesaAgents.Domain.Events;

namespace SiesaAgents.Domain.Entities;

public abstract class Entity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();

    private readonly List<IDomainEvent> _domainEvents = [];

    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    protected void AddDomainEvent(IDomainEvent domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }

    /// <summary>
    /// Clears dispatched domain events. Called by the infrastructure layer after events have been published.
    /// </summary>
    internal void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}
