namespace SiesaAgents.Application.Clientes.Commands;

/// <summary>
/// CQRS command for the "create cliente" use case. Same shape as
/// <c>CreateClienteRequest</c> but kept separate so the endpoint owns
/// wire-DTO validation and the handler owns domain orchestration.
/// </summary>
public sealed record CreateClienteCommand(
    string Nombre,
    string Nit,
    string Telefono,
    string Ciudad);
