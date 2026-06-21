using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Domain.Clientes.Entities;

public class ClienteEntity : Entity
{
    private ClienteEntity() { }

    public string Nombre { get; private set; } = default!;
    public string Nit { get; private set; } = default!;
    public string Telefono { get; private set; } = default!;
    public string Ciudad { get; private set; } = default!;

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(nit);

        return new ClienteEntity
        {
            Nombre = nombre,
            Nit = nit,
            Telefono = telefono,
            Ciudad = ciudad,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
    }
}
