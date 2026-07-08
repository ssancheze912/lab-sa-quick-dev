using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Commands;

/// <summary>
/// Command wrapping the create-cliente request. Keeps the handler signature
/// symmetric with the Story 2.1/2.2 query pattern.
/// </summary>
public sealed record CreateClienteCommand(CreateClienteRequest Request);
