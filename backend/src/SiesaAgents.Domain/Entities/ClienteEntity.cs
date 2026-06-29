namespace SiesaAgents.Domain.Entities;

public sealed class ClienteEntity
{
    // Private parameterless constructor for EF Core materialisation
    private ClienteEntity() { }

    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    /// <summary>Factory method — only valid way to create a new ClienteEntity.</summary>
    public static ClienteEntity Create(
        string nombre,
        string nit,
        string telefono,
        string ciudad,
        Guid? id = null,
        DateTimeOffset? createdAt = null,
        DateTimeOffset? updatedAt = null)
    {
        var now = DateTimeOffset.UtcNow;
        return new ClienteEntity
        {
            Id = id ?? Guid.NewGuid(),
            Nombre = nombre,
            Nit = nit,
            Telefono = telefono,
            Ciudad = ciudad,
            CreatedAt = createdAt ?? now,
            UpdatedAt = updatedAt ?? now,
        };
    }

    /// <summary>Updates mutable fields and sets UpdatedAt to current UTC time.</summary>
    public void Update(string nombre, string nit, string telefono, string ciudad)
    {
        Nombre = nombre;
        Nit = nit;
        Telefono = telefono;
        Ciudad = ciudad;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
