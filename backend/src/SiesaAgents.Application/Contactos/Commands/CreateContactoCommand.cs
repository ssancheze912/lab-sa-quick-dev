namespace SiesaAgents.Application.Contactos.Commands;

public record CreateContactoCommand(string Nombre, string? Cargo, string? Telefono, string Email, Guid? ClienteId = null);
