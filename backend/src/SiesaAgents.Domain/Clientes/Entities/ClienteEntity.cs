namespace SiesaAgents.Domain.Clientes.Entities;

/// <summary>
/// Aggregate root for a Client (Cliente). Created via the <see cref="Create"/>
/// factory and mutated via <see cref="Update"/>. External code cannot bypass
/// invariants by setting properties directly.
/// </summary>
public sealed class ClienteEntity
{
    private const int NombreMaxLength = 200;
    private const int NitMaxLength = 50;
    private const int TelefonoMaxLength = 50;
    private const int CiudadMaxLength = 100;

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

    /// <summary>
    /// Factory for a new <see cref="ClienteEntity"/>. Enforces FR8 (required fields)
    /// and the configured length caps for each text field.
    /// </summary>
    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        ValidateRequired(nombre, nameof(nombre), NombreMaxLength);
        ValidateRequired(nit, nameof(nit), NitMaxLength);
        ValidateRequired(telefono, nameof(telefono), TelefonoMaxLength);
        ValidateRequired(ciudad, nameof(ciudad), CiudadMaxLength);

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
    /// Mutates the entity with new field values and bumps <see cref="UpdatedAt"/>.
    /// Used by Story 2.4 (edit-client); defined here to keep the entity sealed and
    /// the contract stable across downstream stories.
    /// </summary>
    public void Update(string nombre, string nit, string telefono, string ciudad)
    {
        ValidateRequired(nombre, nameof(nombre), NombreMaxLength);
        ValidateRequired(nit, nameof(nit), NitMaxLength);
        ValidateRequired(telefono, nameof(telefono), TelefonoMaxLength);
        ValidateRequired(ciudad, nameof(ciudad), CiudadMaxLength);

        Nombre = nombre;
        Nit = nit;
        Telefono = telefono;
        Ciudad = ciudad;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    private static void ValidateRequired(string value, string paramName, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException($"{paramName} is required.", paramName);
        }

        if (value.Length > maxLength)
        {
            throw new ArgumentException($"{paramName} exceeds maximum length of {maxLength}.", paramName);
        }
    }
}
