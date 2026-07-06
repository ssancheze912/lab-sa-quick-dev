using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Commands;

/// <summary>
/// Mirrors <c>CreateClienteResult</c>'s "expected outcome is a return value, not an
/// exception" pattern, adding <see cref="IsNotFound"/> for the one new failure mode an
/// update has that a create doesn't — the target Id may no longer exist.
/// </summary>
public sealed record UpdateClienteResult(ClienteDto? Cliente, bool IsConflict, bool IsNotFound)
{
    public static UpdateClienteResult Success(ClienteDto cliente) => new(cliente, false, false);

    public static UpdateClienteResult Conflict() => new(null, true, false);

    public static UpdateClienteResult NotFound() => new(null, false, true);
}
