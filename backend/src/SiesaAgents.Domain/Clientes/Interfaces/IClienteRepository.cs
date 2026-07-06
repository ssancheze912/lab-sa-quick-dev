using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

/// <summary>
/// Story 2.1 added read-only listing (<see cref="GetAllAsync"/>). Story 2.2 added
/// single-record lookup (<see cref="GetByIdAsync"/>). Story 2.3 added insert
/// (<see cref="AddAsync"/>). Story 2.4 added <see cref="UpdateAsync"/>. DeleteAsync is
/// still out of scope — Story 2.5 extends this interface further.
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

    /// <summary>
    /// Persists changes to an existing client. Same <c>true</c>/<c>false</c> contract as
    /// <see cref="AddAsync"/> — <c>false</c> only on a <c>uk_clientes_nit</c> unique-index
    /// violation (e.g. the edited NIT collides with another client).
    /// </summary>
    Task<bool> UpdateAsync(ClienteEntity cliente, CancellationToken cancellationToken);
}
