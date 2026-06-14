namespace SiesaAgents.Domain.Entities;

/// <summary>
/// Base entity class. All entities must have a UUID primary key.
/// </summary>
public abstract class Entity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
}
