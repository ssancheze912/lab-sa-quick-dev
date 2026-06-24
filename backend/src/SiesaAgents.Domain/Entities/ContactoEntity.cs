namespace SiesaAgents.Domain.Entities;

public class ContactoEntity : Entity
{
    private ContactoEntity() { } // required by EF Core

    public string Nombre { get; private set; } = string.Empty;
    public string Cargo { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public Guid? ClienteId { get; private set; }

    public static ContactoEntity Create(string nombre, string cargo, string telefono, string email)
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
        };
    }

    public void Update(string nombre, string cargo, string telefono, string email)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(cargo);
        ArgumentException.ThrowIfNullOrWhiteSpace(telefono);
        ArgumentException.ThrowIfNullOrWhiteSpace(email);

        Nombre = nombre;
        Cargo = cargo;
        Telefono = telefono;
        Email = email;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
