namespace SiesaAgents.Application.Contactos.Commands;

public record AssignContactoClienteCommand(Guid ContactoId, Guid? ClienteId);
