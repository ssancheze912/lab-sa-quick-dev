namespace SiesaAgents.Application.Contactos.DTOs;

public sealed record UpdateContactoRequest(
    string? Nombre,
    string? Cargo,
    string? Telefono,
    string? Email
);
