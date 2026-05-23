namespace SiesaAgents.Application.Contactos.Commands;

public record AssignClienteToContactoCommand(Guid ContactoId, Guid? ClienteId);
