namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// Empty marker query — no search parameter. Search Strategy per architecture.md:
/// the client filters the full, cached client list in-memory; the backend never
/// receives a search term. Do not add a parameter here (see Story 2.1 Dev Notes).
/// </summary>
public sealed record GetClientesQuery;
