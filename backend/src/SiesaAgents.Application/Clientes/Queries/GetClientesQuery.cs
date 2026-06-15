namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// CQRS query: retrieve all clientes. Empty record — no filtering parameters
/// in 2.1; the frontend filters client-side over the in-memory cache.
/// </summary>
public record GetClientesQuery();
