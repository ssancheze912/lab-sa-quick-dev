namespace SiesaAgents.Application.Clientes.DTOs;

/// <summary>
/// Request DTO for PUT /api/v1/clientes/{id} (Story 2.4).
/// Structurally identical to <see cref="CreateClienteRequest"/> — kept as a
/// distinct type so validators + endpoint filters compose independently per
/// the architecture doc §Complete Project Directory Structure.
/// </summary>
public sealed record UpdateClienteRequest(
    string Nombre,
    string Nit,
    string Telefono,
    string Ciudad);
