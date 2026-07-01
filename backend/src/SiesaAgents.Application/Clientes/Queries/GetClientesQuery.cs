namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// Query marker for the "list all clientes" read model — Story 2.1.
///
/// No filter parameters: client-side search is done in the frontend (per architecture
/// search strategy), so the server always returns the complete list ordered by
/// <c>CreatedAt DESC</c>.
/// </summary>
public record GetClientesQuery();
