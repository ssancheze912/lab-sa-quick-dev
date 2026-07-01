namespace SiesaAgents.Domain.Entities;

/// <summary>
/// Represents a contact record. Minimal entity introduced by Story 2.5 ONLY to
/// prove the `contactos.cliente_id` FK's `ON DELETE SET NULL` orphaning
/// behavior when a client is deleted (R2/TC-E2-P0-03) — full Contacto CRUD
/// (repository, commands, queries, endpoints, frontend module) is Epic 3 scope
/// and builds on top of this same entity/table without re-migrating it.
/// </summary>
public class ContactoEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    public string Nombre { get; private set; } = string.Empty;

    public string Cargo { get; private set; } = string.Empty;

    public string Telefono { get; private set; } = string.Empty;

    public string Email { get; private set; } = string.Empty;

    public Guid? ClienteId { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private ContactoEntity()
    {
    }

    public static ContactoEntity Create(string nombre, string cargo, string telefono, string email, Guid? clienteId)
    {
        if (string.IsNullOrWhiteSpace(nombre))
        {
            throw new ArgumentException("Nombre es requerido.", nameof(nombre));
        }

        if (string.IsNullOrWhiteSpace(cargo))
        {
            throw new ArgumentException("Cargo es requerido.", nameof(cargo));
        }

        if (string.IsNullOrWhiteSpace(telefono))
        {
            throw new ArgumentException("Teléfono es requerido.", nameof(telefono));
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email es requerido.", nameof(email));
        }

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
