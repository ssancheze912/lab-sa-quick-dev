namespace SiesaAgents.Domain.Clientes.Entities;

/// <summary>
/// Cliente aggregate root (Epic 2).
///
/// Encapsulation: private setters + public static <see cref="Create"/> factory.
/// Identity: UUID (<see cref="Guid"/>) — never int.
/// Timestamps: <see cref="DateTimeOffset"/> — never <see cref="DateTime"/>.
///
/// Story 2.1 ships a read-only flow; the factory is consumed by Story 2.3
/// (create cliente) and Story 2.4 (update — which will toggle <see cref="UpdatedAt"/>).
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

    // Required by EF Core materialization. Do NOT remove.
    private ClienteEntity()
    {
    }

    /// <summary>
    /// Factory for creating a new <see cref="ClienteEntity"/>.
    /// Story 2.1 unit tests assert the timestamps land within a 5 s window of now.
    /// </summary>
    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
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
