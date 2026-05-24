namespace SiesaAgents.Application.Clientes.DTOs;

public record ClienteDto(
    Guid Id,
    string Nombre,
    string NitRuc,
    string Telefono,
    string Ciudad,
    DateTimeOffset CreatedAt
);
