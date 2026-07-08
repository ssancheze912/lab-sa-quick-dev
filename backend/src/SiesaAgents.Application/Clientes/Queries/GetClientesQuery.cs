namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// CQRS Query — request the full list of clients (Story 2.1).
/// Story 2.1 fetches ALL clients client-side; the query carries no parameters.
/// </summary>
public sealed record GetClientesQuery();
