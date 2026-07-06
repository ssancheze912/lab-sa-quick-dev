namespace SiesaAgents.Application.Clientes.DTOs;

public sealed record UpdateClienteRequest(string Nombre, string Nit, string Telefono, string Ciudad);
