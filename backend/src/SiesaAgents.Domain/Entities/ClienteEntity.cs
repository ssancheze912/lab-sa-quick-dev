namespace SiesaAgents.Domain.Entities;

/// <summary>
/// Represents a commercial client record. First entity in the `clientes` domain
/// (Story 2.1) — read-only surface for this story; mutation behavior (Update,
/// etc.) is added by later Epic 2 stories on this same entity.
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

    private ClienteEntity()
    {
    }

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        if (string.IsNullOrWhiteSpace(nombre))
        {
            throw new ArgumentException("Nombre es requerido.", nameof(nombre));
        }

        if (string.IsNullOrWhiteSpace(nit))
        {
            throw new ArgumentException("NIT/RUC es requerido.", nameof(nit));
        }

        if (string.IsNullOrWhiteSpace(telefono))
        {
            throw new ArgumentException("Teléfono es requerido.", nameof(telefono));
        }

        if (string.IsNullOrWhiteSpace(ciudad))
        {
            throw new ArgumentException("Ciudad es requerida.", nameof(ciudad));
        }

        return new ClienteEntity
        {
            Nombre = nombre,
            Nit = nit,
            Telefono = telefono,
            Ciudad = ciudad,
        };
    }

    public void Update(string nombre, string nit, string telefono, string ciudad)
    {
        if (string.IsNullOrWhiteSpace(nombre))
        {
            throw new ArgumentException("Nombre es requerido.", nameof(nombre));
        }

        if (string.IsNullOrWhiteSpace(nit))
        {
            throw new ArgumentException("NIT/RUC es requerido.", nameof(nit));
        }

        if (string.IsNullOrWhiteSpace(telefono))
        {
            throw new ArgumentException("Teléfono es requerido.", nameof(telefono));
        }

        if (string.IsNullOrWhiteSpace(ciudad))
        {
            throw new ArgumentException("Ciudad es requerida.", nameof(ciudad));
        }

        Nombre = nombre;
        Nit = nit;
        Telefono = telefono;
        Ciudad = ciudad;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
