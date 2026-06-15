namespace SiesaAgents.Application.Clientes.Commands;

/// <summary>
/// CQRS command: create a new cliente. Telefono and Ciudad are nullable at the
/// API contract layer; the form-layer (frontend) enforces "all four required"
/// per FR1, but the backend keeps the columns NULLable so direct API callers
/// can omit them (matches the migration from Story 2.1).
/// </summary>
public record CreateClienteCommand(
    string Nombre,
    string Nit,
    string? Telefono,
    string? Ciudad);
