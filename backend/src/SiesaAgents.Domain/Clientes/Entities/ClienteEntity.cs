namespace SiesaAgents.Domain.Clientes.Entities;

public class ClienteEntity
{
    public Guid Id { get; private set; }
    public string Nombre { get; private set; } = string.Empty;
    public string NIT { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private ClienteEntity() { }

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        return new ClienteEntity
        {
            Id = Guid.NewGuid(),
            Nombre = nombre,
            NIT = nit,
            Telefono = telefono,
            Ciudad = ciudad,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
    }
}
