namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// CQRS read query for listing clients. The optional <see cref="Search"/> fragment
/// triggers a case-insensitive ILIKE filter on <c>nombre</c> and <c>nit</c>.
/// </summary>
public sealed record GetClientesQuery(string? Search);
