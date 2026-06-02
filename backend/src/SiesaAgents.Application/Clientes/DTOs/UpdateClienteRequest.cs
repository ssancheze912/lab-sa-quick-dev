namespace SiesaAgents.Application.Clientes.DTOs;

public record UpdateClienteRequest(
    string Nombre,
    string Nit,
    string Telefono,
    string Ciudad
);
