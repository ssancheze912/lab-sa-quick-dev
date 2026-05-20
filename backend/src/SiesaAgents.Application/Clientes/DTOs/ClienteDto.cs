namespace SiesaAgents.Application.Clientes.DTOs;

public record ClienteDto(
    Guid Id,
    string Nombre,
    string Nit,
    string Telefono,
    string Ciudad,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);
