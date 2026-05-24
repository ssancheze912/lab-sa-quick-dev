namespace SiesaAgents.Application.Clientes.DTOs;

public record CreateClienteRequest(
    string Nombre,
    string Nit,
    string? Telefono,
    string? Ciudad
);
