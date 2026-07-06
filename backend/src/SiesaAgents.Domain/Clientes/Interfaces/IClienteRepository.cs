using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

/// <summary>
/// Story 2.1 added read-only listing (<see cref="GetAllAsync"/>). Story 2.2 added
/// single-record lookup (<see cref="GetByIdAsync"/>). Story 2.3 added insert
/// (<see cref="AddAsync"/>). Story 2.4 added <see cref="UpdateAsync"/>. Story 2.5 added
/// <see cref="DeleteAsync"/> — the interface is now complete for Epic 2's CRUD scope.
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

    /// <summary>
    /// Removes the client with the given <paramref name="id"/>. Returns <c>true</c> when a
    /// matching client was found and removed, <c>false</c> when no client with that id
    /// exists — simpler contract than <see cref="AddAsync"/>/<see cref="UpdateAsync"/>: a
    /// delete has no unique-constraint conflict to report.
    /// </summary>
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}
