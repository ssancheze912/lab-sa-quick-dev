namespace SiesaAgents.Domain.Clientes.Entities;

public class ClienteEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private ClienteEntity() { }

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        if (string.IsNullOrWhiteSpace(nombre)) throw new ArgumentException("Nombre es requerido.", nameof(nombre));
        if (string.IsNullOrWhiteSpace(nit)) throw new ArgumentException("NIT es requerido.", nameof(nit));
        if (string.IsNullOrWhiteSpace(telefono)) throw new ArgumentException("Teléfono es requerido.", nameof(telefono));
        if (string.IsNullOrWhiteSpace(ciudad)) throw new ArgumentException("Ciudad es requerida.", nameof(ciudad));

        return new ClienteEntity
        {
            Nombre = nombre.Trim(),
            Nit = nit.Trim(),
            Telefono = telefono.Trim(),
            Ciudad = ciudad.Trim(),
        };
    }

    public void Update(string nombre, string nit, string telefono, string ciudad)
    {
        if (string.IsNullOrWhiteSpace(nombre)) throw new ArgumentException("Nombre es requerido.", nameof(nombre));
        if (string.IsNullOrWhiteSpace(nit)) throw new ArgumentException("NIT es requerido.", nameof(nit));
        if (string.IsNullOrWhiteSpace(telefono)) throw new ArgumentException("Teléfono es requerido.", nameof(telefono));
        if (string.IsNullOrWhiteSpace(ciudad)) throw new ArgumentException("Ciudad es requerida.", nameof(ciudad));

        Nombre = nombre.Trim();
        Nit = nit.Trim();
        Telefono = telefono.Trim();
        Ciudad = ciudad.Trim();
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
