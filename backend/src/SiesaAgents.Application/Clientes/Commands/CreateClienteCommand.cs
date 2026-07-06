namespace SiesaAgents.Application.Clientes.Commands;

public sealed record CreateClienteCommand(string Nombre, string Nit, string Telefono, string Ciudad);
