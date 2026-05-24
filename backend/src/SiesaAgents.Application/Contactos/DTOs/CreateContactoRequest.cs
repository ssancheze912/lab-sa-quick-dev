namespace SiesaAgents.Application.Contactos.DTOs;

public record CreateContactoRequest(
    string Nombre,
    string Email,
    string? Cargo,
    string? Telefono,
    Guid? ClienteId
);
