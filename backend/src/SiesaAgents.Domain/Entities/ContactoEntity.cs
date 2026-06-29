namespace SiesaAgents.Domain.Entities;

public sealed class ContactoEntity
{
    // Private parameterless constructor for EF Core materialisation
    private ContactoEntity() { }

    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Nombre { get; private set; } = string.Empty;
    public string Cargo { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public Guid? ClienteId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    // Navigation property (optional)
    public ClienteEntity? Cliente { get; private set; }

    /// <summary>Updates contact fields. ClienteId is NOT modified here — Epic 4 handles client-contact association.</summary>
    public void Update(string nombre, string cargo, string telefono, string email)
    {
        Nombre = nombre;
        Cargo = cargo;
        Telefono = telefono;
        Email = email;
        UpdatedAt = DateTimeOffset.UtcNow; // ALWAYS DateTimeOffset, NEVER DateTime
    }

    /// <summary>Factory method — only valid way to create a new ContactoEntity.</summary>
    public static ContactoEntity Create(
        string nombre,
        string cargo,
        string telefono,
        string email,
        Guid? clienteId = null,
        Guid? id = null,
        DateTimeOffset? createdAt = null,
        DateTimeOffset? updatedAt = null)
    {
        var now = DateTimeOffset.UtcNow;
        return new ContactoEntity
        {
            Id = id ?? Guid.NewGuid(),
            Nombre = nombre,
            Cargo = cargo,
            Telefono = telefono,
            Email = email,
            ClienteId = clienteId,
            CreatedAt = createdAt ?? now,
            UpdatedAt = updatedAt ?? now,
        };
    }
}
