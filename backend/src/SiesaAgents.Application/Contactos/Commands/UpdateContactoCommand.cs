namespace SiesaAgents.Application.Contactos.Commands;

public record UpdateContactoCommand(
    Guid Id,
    string Nombre,
    string Cargo,
    string Telefono,
    string Email
);
