namespace SiesaAgents.Application.Clientes.DTOs;

/// <summary>
/// Request DTO for POST /api/v1/clientes (Story 2.3).
/// camelCase JSON binding is inherited from .NET defaults — no
/// <c>[JsonPropertyName]</c> annotations needed.
/// </summary>
public sealed record CreateClienteRequest(
    string Nombre,
    string Nit,
    string Telefono,
    string Ciudad);
