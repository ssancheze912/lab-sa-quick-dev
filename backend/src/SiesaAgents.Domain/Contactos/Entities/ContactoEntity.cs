namespace SiesaAgents.Domain.Contactos.Entities;

public class ContactoEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Nombre { get; private set; } = string.Empty;
    public string Cargo { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty; // empty string when not provided
    public string Email { get; private set; } = string.Empty;
    public Guid? ClienteId { get; private set; } = null;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private ContactoEntity() { } // EF Core constructor

    public static ContactoEntity Create(string nombre, string? cargo, string? telefono, string email, Guid? clienteId = null)
    {
        return new ContactoEntity
        {
            Id = Guid.NewGuid(),
            Nombre = nombre,
            Cargo = cargo ?? string.Empty,
            Telefono = telefono ?? string.Empty,
            Email = email,
            ClienteId = clienteId,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
    }

    public void Update(string nombre, string cargo, string? telefono, string email)
    {
        Nombre = nombre;
        Cargo = cargo;
        Telefono = telefono ?? string.Empty;
        Email = email;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void AssignClienteId(Guid? clienteId)
    {
        ClienteId = clienteId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
