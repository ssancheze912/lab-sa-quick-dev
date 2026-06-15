namespace SiesaAgents.Application.Clientes.DTOs;

/// <summary>
/// Read-side projection of a cliente. Serialized to camelCase at the API
/// surface via the global JSON options configured in <c>Program.cs</c>.
/// </summary>
public record ClienteDto
{
    public Guid Id { get; init; }
    public string Nombre { get; init; } = string.Empty;
    public string Nit { get; init; } = string.Empty;
    public string? Telefono { get; init; }
    public string? Ciudad { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
}
