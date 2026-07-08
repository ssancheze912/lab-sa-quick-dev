using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

/// <summary>
/// Repository contract for <see cref="ClienteEntity"/> persistence.
/// </summary>
/// <remarks>
/// Story 2.1 introduced <see cref="GetAllAsync"/> and <see cref="GetByIdAsync"/>.
/// Story 2.3 adds <see cref="AddAsync"/> and <see cref="NitExistsAsync"/> for the
/// create flow. Story 2.4 adds <see cref="UpdateAsync"/> and
/// <see cref="NitExistsForAnotherAsync"/> for the edit flow. Delete arrives in
/// Story 2.5.
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

    /// <summary>
    /// Persists the given entity. The caller keeps the reference — EF Core
    /// mutates it in-place, so <see cref="Task"/> is enough.
    /// </summary>
    Task AddAsync(ClienteEntity cliente, CancellationToken ct);

    /// <summary>
    /// Case-sensitive existence check for the given NIT/RUC value.
    /// </summary>
    Task<bool> NitExistsAsync(string nit, CancellationToken ct);

    /// <summary>
    /// Persists the mutated entity (Story 2.4). The caller loads the entity via
    /// <see cref="GetByIdAsync"/> (untracked), invokes <c>Update(...)</c> on it,
    /// then hands it back here — implementations attach as Modified and flush.
    /// </summary>
    Task UpdateAsync(ClienteEntity cliente, CancellationToken ct);

    /// <summary>
    /// "Unique-excluding-self" check (Story 2.4). Returns <c>true</c> only when
    /// a row with the given NIT exists whose Id differs from <paramref name="id"/>.
    /// Used by the update handler to guard against re-registering a NIT that
    /// already belongs to the row being edited (AC #6).
    /// </summary>
    Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct);
}
