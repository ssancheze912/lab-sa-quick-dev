namespace SiesaAgents.Domain.Clientes.Entities;

public class ClienteEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string? Telefono { get; private set; }
    public string? Ciudad { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private ClienteEntity() { }

    public static ClienteEntity Create(string nombre, string nit, string? telefono, string? ciudad)
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

    public void Update(string nombre, string? telefono, string? ciudad)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);

        Nombre = nombre;
        Telefono = telefono;
        Ciudad = ciudad;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
