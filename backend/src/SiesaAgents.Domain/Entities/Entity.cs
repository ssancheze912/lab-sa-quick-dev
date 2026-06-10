namespace SiesaAgents.Domain.Entities;

/// <summary>
/// Base entity. All entities use UUID primary keys per company standards.
/// Timestamps always use DateTimeOffset — never DateTime.
/// </summary>
public abstract class Entity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
    public DateTimeOffset CreatedAt { get; protected set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; protected set; } = DateTimeOffset.UtcNow;
}
