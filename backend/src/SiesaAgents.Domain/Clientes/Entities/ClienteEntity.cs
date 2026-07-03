namespace SiesaAgents.Domain.Clientes.Entities;

/// <summary>
/// Domain entity representing a commercial client in the CRM.
/// Story 2.1: read-only surface — plain public setters (no factory / invariants).
/// The private-constructor + Create() factory pattern lands in Stories 2.3/2.4
/// alongside the create/update flows where invariants become relevant.
/// </summary>
public class ClienteEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nombre { get; set; } = string.Empty;
    public string NitRuc { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Ciudad { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
