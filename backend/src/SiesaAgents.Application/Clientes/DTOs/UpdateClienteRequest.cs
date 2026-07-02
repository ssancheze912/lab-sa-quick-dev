namespace SiesaAgents.Application.Clientes.DTOs;

/// <summary>
/// Input payload for PUT /api/v1/clientes/{id}. Only the four mutable
/// fields — the id comes from the route, and createdAt/updatedAt are
/// server-managed audit columns. All fields are required and trimmed
/// server-side. Duplicate NIT is enforced at DB level (uk_clientes_nit)
/// and reported as 409 Problem Details.
/// </summary>
public sealed record UpdateClienteRequest(
    string Nombre,
    string Nit,
    string Telefono,
    string Ciudad);
