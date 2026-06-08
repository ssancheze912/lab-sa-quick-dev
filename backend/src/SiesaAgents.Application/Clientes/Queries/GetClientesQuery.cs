namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// CQRS query message for <c>GET /api/v1/clientes</c>. No parameters for Story 2.1
/// (the whole list is returned — Story 2.6 adds client-side sort + Story 2.x may
/// add server-side pagination later if NFR1 cannot be met client-side).
/// </summary>
public sealed record GetClientesQuery();
