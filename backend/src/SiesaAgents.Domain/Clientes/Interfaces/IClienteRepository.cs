using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

/// <summary>
/// Repository contract for <see cref="ClienteEntity"/> persistence (Story 2.1).
/// </summary>
/// <remarks>
/// Story 2.1 only exercises <see cref="GetAllAsync"/>; <see cref="GetByIdAsync"/>
/// is declared upfront so Story 2.2 can consume it without churning the
/// interface. Write operations (Add/Update/Delete) are added in Stories 2.3–2.5.
/// </remarks>
public interface IClienteRepository
{
    /// <summary>
    /// Returns every <see cref="ClienteEntity"/> ordered by
    /// <see cref="ClienteEntity.CreatedAt"/> DESC (newest first).
    /// </summary>
    Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct);

    /// <summary>
    /// Returns the entity with the given id, or <c>null</c> when not found.
    /// </summary>
    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct);
}
