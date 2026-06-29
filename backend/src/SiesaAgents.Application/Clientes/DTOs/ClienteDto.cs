namespace SiesaAgents.Application.Clientes.DTOs;

/// <summary>
/// Data transfer object representing a Cliente in API responses.
/// Field <c>NitRuc</c> is the public contract name; it maps from <c>ClienteEntity.Nit</c>.
/// JSON output uses default camelCase serialization.
/// </summary>
public sealed record ClienteDto(
    Guid Id,
    string Nombre,
    string NitRuc,
    string Telefono,
    string Ciudad,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
