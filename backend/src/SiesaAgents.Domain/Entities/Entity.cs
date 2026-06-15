namespace SiesaAgents.Domain.Entities;

/// <summary>
/// Base entity class. All entities must inherit from this class.
/// UUID primary key (Guid) is mandatory per company standards.
/// </summary>
public abstract class Entity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
    public DateTimeOffset CreatedAt { get; protected set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; protected set; } = DateTimeOffset.UtcNow;
}
