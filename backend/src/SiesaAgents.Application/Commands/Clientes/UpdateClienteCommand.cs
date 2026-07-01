namespace SiesaAgents.Application.Commands.Clientes;

public record UpdateClienteCommand(Guid Id, string Nombre, string Nit, string Telefono, string Ciudad);
