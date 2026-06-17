namespace SiesaAgents.Application.Clientes.Commands;

public record UpdateClienteCommand(Guid Id, string Nombre, string NitRuc, string Telefono, string Ciudad);
