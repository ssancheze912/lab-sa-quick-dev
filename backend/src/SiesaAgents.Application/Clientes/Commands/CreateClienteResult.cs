using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Commands;

/// <summary>
/// A duplicate NIT is a normal, expected outcome of a create attempt, not a genuine system
/// failure — modeled as a plain result object (mirrors <c>GetClienteByIdQueryHandler</c>
/// returning <c>null</c> on not-found) so the endpoint, not exception-handling middleware,
/// decides the HTTP status (201 vs 409).
/// </summary>
public sealed record CreateClienteResult(ClienteDto? Cliente, bool IsConflict)
{
    public static CreateClienteResult Success(ClienteDto cliente) => new(cliente, false);

    public static CreateClienteResult Conflict() => new(null, true);
}
