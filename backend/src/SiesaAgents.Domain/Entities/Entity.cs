namespace SiesaAgents.Domain.Entities;

/// <summary>
/// Base entity with UUID primary key per company standards.
/// All entities MUST inherit from this class.
/// </summary>
public abstract class Entity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
}
