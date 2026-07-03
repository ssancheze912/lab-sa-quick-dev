namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// Query for retrieving a single cliente by id (Story 2.2). Immutable record
/// to match the <see cref="GetClientesQuery"/> style.
/// </summary>
public record GetClienteByIdQuery(Guid Id);
