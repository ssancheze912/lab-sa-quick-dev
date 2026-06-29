namespace SiesaAgents.Application.Clientes.DTOs;

public sealed record ClienteDto(
    Guid Id,
    string Nombre,
    string Nit,
    string Telefono,
    string Ciudad,
    DateTimeOffset CreatedAt
);
