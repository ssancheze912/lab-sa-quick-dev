namespace SiesaAgents.Application.Clientes.DTOs;

public record CreateClienteRequest(
    string Nombre,
    string NitRuc,
    string Telefono,
    string Ciudad
);
