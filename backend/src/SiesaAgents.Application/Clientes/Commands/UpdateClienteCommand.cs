using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Commands;

/// <summary>
/// Command wrapping the update-cliente id + request DTO (Story 2.4). Keeps the
/// handler signature symmetric with <see cref="CreateClienteCommand"/>.
/// </summary>
public sealed record UpdateClienteCommand(Guid Id, UpdateClienteRequest Request);
