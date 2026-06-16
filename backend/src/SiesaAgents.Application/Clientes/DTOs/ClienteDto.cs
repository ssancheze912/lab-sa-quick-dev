namespace SiesaAgents.Application.Clientes.DTOs;

public record ClienteDto(
    Guid Id,
    string Nombre,
    string NIT,
    string Telefono,
    string Ciudad,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);
