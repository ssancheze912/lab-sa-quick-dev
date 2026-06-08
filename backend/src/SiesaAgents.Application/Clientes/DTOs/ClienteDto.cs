namespace SiesaAgents.Application.Clientes.DTOs;

/// <summary>
/// Read-side projection for <c>ClienteEntity</c>. Serialized to camelCase JSON
/// by System.Text.Json defaults (Web profile) when returned from the minimal
/// API endpoint <c>GET /api/v1/clientes</c>.
/// </summary>
public sealed record ClienteDto(
    Guid Id,
    string Nombre,
    string Nit,
    string Telefono,
    string Ciudad,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
