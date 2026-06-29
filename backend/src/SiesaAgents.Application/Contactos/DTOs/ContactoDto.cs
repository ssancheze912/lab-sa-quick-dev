namespace SiesaAgents.Application.Contactos.DTOs;

public sealed record ContactoDto(
    Guid Id,
    string Nombre,
    string Cargo,
    string Telefono,
    string Email,
    Guid? ClienteId,
    DateTimeOffset CreatedAt
);
