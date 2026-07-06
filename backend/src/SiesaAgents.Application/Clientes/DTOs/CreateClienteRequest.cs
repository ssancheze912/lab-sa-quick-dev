namespace SiesaAgents.Application.Clientes.DTOs;

public sealed record CreateClienteRequest(string Nombre, string Nit, string Telefono, string Ciudad);
