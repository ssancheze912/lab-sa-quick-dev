namespace SiesaAgents.Domain.Clientes.Entities;

/// <summary>
/// Domain entity representing a client (Story 2.1).
/// </summary>
/// <remarks>
/// Uses the DDD private-constructor + static factory pattern per company
/// standards. Timestamps are <see cref="DateTimeOffset"/> (mandatory). Deep
/// input validation is deferred to FluentValidation validators introduced in
/// Story 2.3 — only null / whitespace guards are enforced here.
/// </remarks>
public class ClienteEntity
{
    // EF Core rehydration requires a parameterless constructor.
    private ClienteEntity() { }

    public Guid Id { get; private set; }
    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    /// <summary>
    /// Factory method — the ONLY way to build a new <see cref="ClienteEntity"/>
    /// outside of EF Core rehydration.
    /// </summary>
    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(nit);
        ArgumentException.ThrowIfNullOrWhiteSpace(telefono);
        ArgumentException.ThrowIfNullOrWhiteSpace(ciudad);

        var now = DateTimeOffset.UtcNow;
        return new ClienteEntity
        {
            Id = Guid.NewGuid(),
            Nombre = nombre,
            Nit = nit,
            Telefono = telefono,
            Ciudad = ciudad,
            CreatedAt = now,
            UpdatedAt = now,
        };
    }

    /// <summary>
    /// Mutates the entity's editable fields (Story 2.4). Refreshes
    /// <see cref="UpdatedAt"/>; <see cref="CreatedAt"/> is NEVER touched
    /// (audit-trail immutability, AC #9). Same defensive guards as
    /// <see cref="Create"/> — the application layer validates via
    /// FluentValidation, but the entity stays authoritative.
    /// </summary>
    public void Update(string nombre, string nit, string telefono, string ciudad)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(nit);
        ArgumentException.ThrowIfNullOrWhiteSpace(telefono);
        ArgumentException.ThrowIfNullOrWhiteSpace(ciudad);

        Nombre = nombre;
        Nit = nit;
        Telefono = telefono;
        Ciudad = ciudad;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
