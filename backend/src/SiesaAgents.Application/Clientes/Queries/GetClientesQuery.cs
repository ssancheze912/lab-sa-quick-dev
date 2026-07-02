namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// Marker query used by <see cref="GetClientesQueryHandler"/> to retrieve the
/// full list of clientes. Search is client-side (NFR1 &le; 500 records), so no
/// server-side filter parameters are exposed.
/// </summary>
public sealed record GetClientesQuery;
