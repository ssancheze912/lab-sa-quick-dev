namespace SiesaAgents.Domain.Contactos.Entities;

public class ContactoEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Nombre { get; private set; } = string.Empty;
    public string Cargo { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public Guid? ClienteId { get; private set; } // nullable FK — assigned in Epic 4
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private ContactoEntity() { } // Required by EF Core

    public static ContactoEntity Create(string nombre, string cargo, string telefono, string email)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(cargo);
        ArgumentException.ThrowIfNullOrWhiteSpace(telefono);
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        return new ContactoEntity
        {
            Nombre = nombre.Trim(),
            Cargo = cargo.Trim(),
            Telefono = telefono.Trim(),
            Email = email.Trim()
        };
    }

    public void Update(string nombre, string cargo, string telefono, string email)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(cargo);
        ArgumentException.ThrowIfNullOrWhiteSpace(telefono);
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        Nombre = nombre.Trim();
        Cargo = cargo.Trim();
        Telefono = telefono.Trim();
        Email = email.Trim();
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
