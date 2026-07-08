namespace SiesaAgents.Application.Clientes.DTOs;

/// <summary>
/// Data transfer object for <c>Cliente</c> read models (Story 2.1).
/// Property order + JSON casing (camelCase) mirrors the frontend contract in
/// <c>frontend/src/modules/crm/clientes/domain/Cliente.ts</c>.
/// </summary>
public sealed record ClienteDto(
    Guid Id,
    string Nombre,
    string Nit,
    string Telefono,
    string Ciudad,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
