namespace SiesaAgents.Application.Clientes.Commands;

public record CreateClienteCommand(
    string Nombre,
    string NitRuc,
    string Telefono,
    string Ciudad
);
