namespace SiesaAgents.Application.DTOs;

public record ContactoDto(
    Guid Id,
    string Nombre,
    string Cargo,
    string Telefono,
    string Email,
    Guid? ClienteId,
    DateTimeOffset CreatedAt);
