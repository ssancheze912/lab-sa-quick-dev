namespace SiesaAgents.Domain.Clientes.Entities;

public sealed class ClienteEntity
{
    private ClienteEntity() { }

    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Nombre { get; private set; } = string.Empty;
    public string NitRuc { get; private set; } = string.Empty;
    public string? Telefono { get; private set; }
    public string? Ciudad { get; private set; }
    public DateTimeOffset CreadoEn { get; private set; }

    public static ClienteEntity Create(string nombre, string nitRuc, string? telefono, string? ciudad)
    {
        return new ClienteEntity
        {
            Nombre = nombre,
            NitRuc = nitRuc,
            Telefono = telefono,
            Ciudad = ciudad,
            CreadoEn = DateTimeOffset.UtcNow
        };
    }
}
