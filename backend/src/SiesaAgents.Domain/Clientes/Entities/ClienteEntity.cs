using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Domain.Clientes.Entities;

public class ClienteEntity : Entity
{
    public string Nombre { get; private set; } = string.Empty;
    public string NitRuc { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private ClienteEntity() { }

    public static ClienteEntity Create(string nombre, string nitRuc, string telefono, string ciudad)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("Nombre is required.", nameof(nombre));
        if (string.IsNullOrWhiteSpace(nitRuc))
            throw new ArgumentException("NitRuc is required.", nameof(nitRuc));
        if (string.IsNullOrWhiteSpace(telefono))
            throw new ArgumentException("Telefono is required.", nameof(telefono));
        if (string.IsNullOrWhiteSpace(ciudad))
            throw new ArgumentException("Ciudad is required.", nameof(ciudad));

        return new ClienteEntity
        {
            Nombre = nombre.Trim(),
            NitRuc = nitRuc.Trim(),
            Telefono = telefono.Trim(),
            Ciudad = ciudad.Trim(),
        };
    }
}
