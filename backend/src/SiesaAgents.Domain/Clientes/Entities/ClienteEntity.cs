namespace SiesaAgents.Domain.Clientes.Entities;

/// <summary>
/// Root entity for a client (Cliente) within the CRM.
///
/// Story 2.1 scope — persisted fields only (no domain events, no <c>Update()</c>). Later stories
/// introduce mutation methods and events:
///   - Story 2.3 (Create) adds the domain event <c>ClienteCreated</c>.
///   - Story 2.4 (Edit)   adds the <c>Update(...)</c> method + validation.
///
/// Primary key + timestamps follow the company standards:
///   - <see cref="Guid"/> PK initialised in the factory.
///   - <see cref="DateTimeOffset"/> audit timestamps (never <see cref="DateTime"/>).
/// </summary>
public class ClienteEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Nombre { get; private set; } = null!;
    public string Nit { get; private set; } = null!;
    public string Telefono { get; private set; } = null!;
    public string Ciudad { get; private set; } = null!;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    // Required by EF Core materialization.
    private ClienteEntity() { }

    /// <summary>
    /// Factory guard — null/empty validation only. Full business validation
    /// (FluentValidation + duplicate-NIT enforcement) arrives in Story 2.3.
    /// </summary>
    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        if (string.IsNullOrWhiteSpace(nombre)) throw new ArgumentException("Nombre requerido", nameof(nombre));
        if (string.IsNullOrWhiteSpace(nit)) throw new ArgumentException("NIT requerido", nameof(nit));
        if (string.IsNullOrWhiteSpace(telefono)) throw new ArgumentException("Teléfono requerido", nameof(telefono));
        if (string.IsNullOrWhiteSpace(ciudad)) throw new ArgumentException("Ciudad requerida", nameof(ciudad));

        return new ClienteEntity
        {
            Nombre = nombre.Trim(),
            Nit = nit.Trim(),
            Telefono = telefono.Trim(),
            Ciudad = ciudad.Trim(),
        };
    }
}
