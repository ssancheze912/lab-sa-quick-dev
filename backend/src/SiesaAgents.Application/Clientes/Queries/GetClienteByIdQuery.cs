namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// CQRS read query for fetching a single client by identifier.
/// </summary>
public sealed record GetClienteByIdQuery(Guid Id);
