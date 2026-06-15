namespace SiesaAgents.Application.Clientes.Commands;

/// <summary>
/// CQRS command: update an existing cliente. Story 2.4.
/// Telefono and Ciudad mirror the Create command's nullable contract; the
/// frontend Zod schema treats them as required per FR1, but the API contract
/// keeps them optional to match the NULLable migration columns.
/// </summary>
public record UpdateClienteCommand(
    Guid Id,
    string Nombre,
    string Nit,
    string? Telefono,
    string? Ciudad);
