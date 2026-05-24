namespace SiesaAgents.Domain.Contactos.Entities;

public class ContactoEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Nombre { get; private set; } = string.Empty;
    public string? Cargo { get; private set; }
    public string? Telefono { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public Guid? ClienteId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private ContactoEntity() { }

    public static ContactoEntity Create(string nombre, string email, string? cargo, string? telefono, Guid? clienteId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(email);

        return new ContactoEntity
        {
            Nombre = nombre,
            Email = email,
            Cargo = cargo,
            Telefono = telefono,
            ClienteId = clienteId,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
    }

    public void Update(string nombre, string? cargo, string? telefono)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);

        Nombre = nombre;
        Cargo = cargo;
        Telefono = telefono;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void AssignCliente(Guid? clienteId)
    {
        ClienteId = clienteId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
