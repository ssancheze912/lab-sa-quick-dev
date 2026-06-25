namespace SiesaAgents.Domain.Contactos.Entities;

public sealed class ContactoEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Nombre { get; private set; } = string.Empty;
    public string Cargo { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public Guid? ClienteId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private ContactoEntity() { }

    public static ContactoEntity Create(string nombre, string cargo, string telefono, string email, Guid? clienteId = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(cargo);
        ArgumentException.ThrowIfNullOrWhiteSpace(telefono);
        ArgumentException.ThrowIfNullOrWhiteSpace(email);

        return new ContactoEntity
        {
            Nombre = nombre,
            Cargo = cargo,
            Telefono = telefono,
            Email = email,
            ClienteId = clienteId,
        };
    }
}
