namespace SiesaAgents.Application.Clientes.DTOs;

/// <summary>
/// Input payload for POST /api/v1/clientes. All fields are required and
/// trimmed server-side. Duplicate NIT is enforced at DB level (uk_clientes_nit)
/// and reported as 409 Problem Details.
/// </summary>
public sealed record CreateClienteRequest(
    string Nombre,
    string Nit,
    string Telefono,
    string Ciudad);
