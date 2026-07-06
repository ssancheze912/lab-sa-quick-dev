using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

/// <summary>
/// Story 2.1 added read-only listing (<see cref="GetAllAsync"/>). Story 2.2 added
/// single-record lookup (<see cref="GetByIdAsync"/>). Story 2.3 added insert
/// (<see cref="AddAsync"/>). UpdateAsync/DeleteAsync are still out of scope —
/// Stories 2.4-2.5 extend this interface further.
/// </summary>
public interface IClienteRepository
{
    Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken);

    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken);

    /// <summary>
    /// Persists a new client. Returns <c>true</c> when the insert succeeds, <c>false</c>
    /// when it fails only because of the <c>uk_clientes_nit</c> unique-index violation — the
    /// DB-level source of truth for NIT uniqueness (no separate <c>ExistsByNitAsync</c>
    /// pre-check, which would still have a race window under concurrent requests).
    /// </summary>
    Task<bool> AddAsync(ClienteEntity cliente, CancellationToken cancellationToken);
}
