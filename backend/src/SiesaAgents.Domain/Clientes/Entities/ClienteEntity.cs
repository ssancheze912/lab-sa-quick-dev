namespace SiesaAgents.Domain.Clientes.Entities;

/// <summary>
/// Cliente aggregate root. Story 2.1 introduces the entity as read-only from the
/// list endpoint; write flows (create/update/delete) land in Stories 2.3–2.5.
/// </summary>
public class ClienteEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    public string Nombre { get; private set; } = string.Empty;

    public string Nit { get; private set; } = string.Empty;

    public string Telefono { get; private set; } = string.Empty;

    public string Ciudad { get; private set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    // EF Core requires a parameterless constructor to materialize entities.
    private ClienteEntity()
    {
    }

    /// <summary>
    /// Factory that enforces the required-field invariants. All fields are trimmed
    /// to avoid accidental whitespace leaking into indexed columns (e.g. Nit).
    /// </summary>
    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        if (string.IsNullOrWhiteSpace(nombre))
        {
            throw new ArgumentException("Nombre requerido", nameof(nombre));
        }

        if (string.IsNullOrWhiteSpace(nit))
        {
            throw new ArgumentException("NIT requerido", nameof(nit));
        }

        if (string.IsNullOrWhiteSpace(telefono))
        {
            throw new ArgumentException("Telefono requerido", nameof(telefono));
        }

        if (string.IsNullOrWhiteSpace(ciudad))
        {
            throw new ArgumentException("Ciudad requerido", nameof(ciudad));
        }

        var now = DateTimeOffset.UtcNow;

        return new ClienteEntity
        {
            Id = Guid.NewGuid(),
            Nombre = nombre.Trim(),
            Nit = nit.Trim(),
            Telefono = telefono.Trim(),
            Ciudad = ciudad.Trim(),
            CreatedAt = now,
            UpdatedAt = now,
        };
    }
}
