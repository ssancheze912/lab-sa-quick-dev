namespace SiesaAgents.Application.Clientes.Commands;

/// <summary>
/// CQRS command for the "update cliente" use case. Same shape as
/// <c>UpdateClienteRequest</c> but kept separate so the endpoint owns
/// wire-DTO validation and the handler owns domain orchestration.
/// </summary>
public sealed record UpdateClienteCommand(
    Guid Id,
    string Nombre,
    string Nit,
    string Telefono,
    string Ciudad);
