using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Domain.Clientes.Entities;

/// <summary>
/// Aggregate root representing a business client (Cliente).
/// </summary>
public class ClienteEntity : Entity
{
    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;

    private ClienteEntity() { }  // Required by EF Core

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("Nombre is required.", nameof(nombre));
        if (string.IsNullOrWhiteSpace(nit))
            throw new ArgumentException("NIT is required.", nameof(nit));
        if (string.IsNullOrWhiteSpace(telefono))
            throw new ArgumentException("Telefono is required.", nameof(telefono));
        if (string.IsNullOrWhiteSpace(ciudad))
            throw new ArgumentException("Ciudad is required.", nameof(ciudad));

        return new ClienteEntity
        {
            Id = Guid.NewGuid(),
            Nombre = nombre,
            Nit = nit,
            Telefono = telefono,
            Ciudad = ciudad,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
    }
}
