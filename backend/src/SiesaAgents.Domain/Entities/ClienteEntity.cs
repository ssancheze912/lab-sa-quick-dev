namespace SiesaAgents.Domain.Entities;

/// <summary>
/// Aggregate root for the <c>clientes</c> table.
///
/// Story 2.1 introduces this entity as the first activation of a real domain
/// in the Clean Architecture stack. Invariants are enforced through the static
/// <see cref="Create"/> factory (first line of defense); FluentValidation at the
/// Command level (Story 2.3) is the second; database constraints (NOT NULL +
/// <c>uk_clientes_nit</c>) are the third.
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

    /// <summary>EF Core materialization constructor — DO NOT use from application code.</summary>
    private ClienteEntity() { }

    /// <summary>
    /// Materialize a new <see cref="ClienteEntity"/>.
    /// Validates every field is non-null and non-whitespace; stamps
    /// <c>CreatedAt</c> + <c>UpdatedAt</c> at the same UTC moment.
    /// </summary>
    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        if (string.IsNullOrWhiteSpace(nombre))
        {
            throw new ArgumentException("nombre is required", nameof(nombre));
        }
        if (string.IsNullOrWhiteSpace(nit))
        {
            throw new ArgumentException("nit is required", nameof(nit));
        }
        if (string.IsNullOrWhiteSpace(telefono))
        {
            throw new ArgumentException("telefono is required", nameof(telefono));
        }
        if (string.IsNullOrWhiteSpace(ciudad))
        {
            throw new ArgumentException("ciudad is required", nameof(ciudad));
        }

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
}
