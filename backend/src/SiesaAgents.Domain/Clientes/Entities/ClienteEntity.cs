namespace SiesaAgents.Domain.Clientes.Entities;

/// <summary>
/// Aggregate root for the <c>clientes</c> bounded context.
///
/// Story 1.3 deliberately deferred the creation of a shared <c>Entity</c> base class
/// (it lives in a future <c>Shared.Domain</c> project that is not yet scaffolded);
/// the simplest path right now is a plain class with private setters and a
/// <see cref="Create"/> factory that enforces invariants on construction and a
/// matching <see cref="Update"/> instance method that bumps <see cref="UpdatedAt"/>.
/// </summary>
public class ClienteEntity
{
    public Guid Id { get; private set; }
    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string? Telefono { get; private set; }
    public string? Ciudad { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    // Required by EF Core for materialization.
    private ClienteEntity() { }

    /// <summary>
    /// Factory: produces a valid <see cref="ClienteEntity"/> with a fresh UUID
    /// and <c>UtcNow</c> timestamps. Throws <see cref="ArgumentException"/> when
    /// <paramref name="nombre"/> or <paramref name="nit"/> are null/whitespace.
    /// </summary>
    public static ClienteEntity Create(string nombre, string nit, string? telefono, string? ciudad)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("Nombre es requerido.", nameof(nombre));
        if (string.IsNullOrWhiteSpace(nit))
            throw new ArgumentException("NIT es requerido.", nameof(nit));

        var now = DateTimeOffset.UtcNow;
        return new ClienteEntity
        {
            Id = Guid.NewGuid(),
            Nombre = nombre.Trim(),
            Nit = nit.Trim(),
            Telefono = string.IsNullOrWhiteSpace(telefono) ? null : telefono.Trim(),
            Ciudad = string.IsNullOrWhiteSpace(ciudad) ? null : ciudad.Trim(),
            CreatedAt = now,
            UpdatedAt = now,
        };
    }

    /// <summary>
    /// Update the cliente's mutable fields and bump <see cref="UpdatedAt"/>.
    /// Lands here in 2.1 so 2.4 can reuse it without a churn migration.
    /// </summary>
    public void Update(string nombre, string nit, string? telefono, string? ciudad)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("Nombre es requerido.", nameof(nombre));
        if (string.IsNullOrWhiteSpace(nit))
            throw new ArgumentException("NIT es requerido.", nameof(nit));

        Nombre = nombre.Trim();
        Nit = nit.Trim();
        Telefono = string.IsNullOrWhiteSpace(telefono) ? null : telefono.Trim();
        Ciudad = string.IsNullOrWhiteSpace(ciudad) ? null : ciudad.Trim();
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
