using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Domain.Clientes.Entities;

/// <summary>
/// Aggregate root representing a client (cliente) in the CRM module.
/// Uses private constructor + static Create() factory pattern per company standards.
/// Timestamps use DateTimeOffset — never DateTime.
/// </summary>
public sealed class ClienteEntity : Entity
{
    private ClienteEntity() { }

    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(nit);
        ArgumentException.ThrowIfNullOrWhiteSpace(telefono);
        ArgumentException.ThrowIfNullOrWhiteSpace(ciudad);

        return new ClienteEntity
        {
            Nombre = nombre,
            Nit = nit,
            Telefono = telefono,
            Ciudad = ciudad,
        };
    }
}
