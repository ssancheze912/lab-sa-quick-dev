namespace SiesaAgents.Application.Contactos.DTOs;

public record UpdateContactoRequest(
    string Nombre,
    string? Cargo,
    string? Telefono
);
