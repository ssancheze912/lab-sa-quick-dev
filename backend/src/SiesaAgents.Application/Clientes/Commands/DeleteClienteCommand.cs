namespace SiesaAgents.Application.Clientes.Commands;

/// <summary>
/// CQRS command: delete an existing cliente. Story 2.5.
/// </summary>
public record DeleteClienteCommand(Guid Id);
