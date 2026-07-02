namespace SiesaAgents.Application.Clientes.DTOs;

/// <summary>
/// Public read model returned by GET /api/v1/clientes. Timestamps use
/// <see cref="DateTimeOffset"/> per company standards (never <c>DateTime</c>).
/// </summary>
public sealed record ClienteDto(
    Guid Id,
    string Nombre,
    string Nit,
    string Telefono,
    string Ciudad,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
