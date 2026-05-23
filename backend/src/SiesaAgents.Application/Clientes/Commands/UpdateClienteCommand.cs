namespace SiesaAgents.Application.Clientes.Commands;

public record UpdateClienteCommand(
    Guid Id,
    string Nombre,
    string Nit,
    string Telefono,
    string Ciudad
);
