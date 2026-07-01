namespace SiesaAgents.Application.Clientes.DTOs;

/// <summary>
/// Read DTO for the <c>GET /api/v1/clientes</c> endpoint. Positional record so
/// System.Text.Json auto-serializes properties in camelCase (default policy) —
/// per the architecture format-patterns line "response is a direct array of DTOs".
/// </summary>
public record ClienteDto(
    Guid Id,
    string Nombre,
    string Nit,
    string Telefono,
    string Ciudad,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
