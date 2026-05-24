namespace SiesaAgents.Application.Clientes.DTOs;

public record UpdateClienteRequest(
    string Nombre,
    string? Telefono,
    string? Ciudad
);
