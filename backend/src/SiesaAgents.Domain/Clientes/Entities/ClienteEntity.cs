namespace SiesaAgents.Domain.Clientes.Entities;

/// <summary>
/// Client aggregate root. Story 2.1 scope: only the properties needed to list clients.
/// Defense-in-depth validation only (non-empty args) — full FluentValidation/Zod
/// validation belongs to Story 2.3 (create client). Story 2.4 adds <see cref="Update"/>
/// for editing an existing client, covered by the same defense-in-depth guard as
/// <see cref="Create"/>.
/// </summary>
public class ClienteEntity
{
    public Guid Id { get; private set; }
    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private ClienteEntity()
    {
    }

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("Nombre is required.", nameof(nombre));
        if (string.IsNullOrWhiteSpace(nit))
            throw new ArgumentException("Nit is required.", nameof(nit));
        if (string.IsNullOrWhiteSpace(telefono))
            throw new ArgumentException("Telefono is required.", nameof(telefono));
        if (string.IsNullOrWhiteSpace(ciudad))
            throw new ArgumentException("Ciudad is required.", nameof(ciudad));

        var now = DateTimeOffset.UtcNow;

        return new ClienteEntity
        {
            Id = Guid.NewGuid(),
            Nombre = nombre,
            Nit = nit,
            Telefono = telefono,
            Ciudad = ciudad,
            CreatedAt = now,
            UpdatedAt = now,
        };
    }

    /// <summary>
    /// Applies an edit to an existing client. Id and CreatedAt are immutable after creation
    /// and are never touched here.
    /// </summary>
    public void Update(string nombre, string nit, string telefono, string ciudad)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("Nombre is required.", nameof(nombre));
        if (string.IsNullOrWhiteSpace(nit))
            throw new ArgumentException("Nit is required.", nameof(nit));
        if (string.IsNullOrWhiteSpace(telefono))
            throw new ArgumentException("Telefono is required.", nameof(telefono));
        if (string.IsNullOrWhiteSpace(ciudad))
            throw new ArgumentException("Ciudad is required.", nameof(ciudad));

        Nombre = nombre;
        Nit = nit;
        Telefono = telefono;
        Ciudad = ciudad;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
