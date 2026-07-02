namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// Query for the Cliente detail view (Story 2.2). Wraps the id required to
/// resolve a single Cliente aggregate to its <see cref="DTOs.ClienteDto"/>.
/// </summary>
public sealed record GetClienteByIdQuery(Guid Id);
