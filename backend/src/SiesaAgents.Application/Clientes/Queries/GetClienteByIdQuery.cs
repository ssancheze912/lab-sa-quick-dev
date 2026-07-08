namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// CQRS Query — request a single client by its id (Story 2.2).
/// Handler returns <c>null</c> when the id is not found; the endpoint layer
/// converts that into HTTP 404.
/// </summary>
public sealed record GetClienteByIdQuery(Guid Id);
