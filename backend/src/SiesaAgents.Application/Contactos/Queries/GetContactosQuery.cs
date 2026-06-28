namespace SiesaAgents.Application.Contactos.Queries;

public record GetContactosQuery(string? Search = null, Guid? ClienteId = null);
