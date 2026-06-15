namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// CQRS query: retrieve a single cliente by its identifier.
/// Returns <c>null</c> when the cliente does not exist — the endpoint translates
/// the null into a 404 Problem Details response (RFC 7807).
/// </summary>
public record GetClienteByIdQuery(Guid Id);
