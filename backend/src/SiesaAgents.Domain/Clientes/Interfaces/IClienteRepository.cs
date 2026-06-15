using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

/// <summary>
/// Repository contract for <see cref="ClienteEntity"/>. Story 2.1 only consumes
/// <see cref="GetAllAsync"/>; the additional signatures land here so stories
/// 2.2 / 2.3 / 2.4 / 2.5 can reuse the same interface without churn.
/// </summary>
public interface IClienteRepository
{
    Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct);
    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct);

    /// <summary>
    /// Tracking variant of <see cref="GetByIdAsync"/>. The returned entity is
    /// tracked by EF Core's change tracker so subsequent mutations followed by
    /// <see cref="SaveChangesAsync"/> persist the change set. Used by the
    /// Story 2.4 update path.
    /// </summary>
    Task<ClienteEntity?> GetByIdForUpdateAsync(Guid id, CancellationToken ct);

    Task<bool> ExistsByNitAsync(string nit, CancellationToken ct);

    /// <summary>
    /// Returns true if any cliente OTHER THAN the one with id <paramref name="exceptId"/>
    /// has the given <paramref name="nit"/>. Story 2.4 uses this for the
    /// "edit-without-changing-NIT must not 409" guarantee.
    /// </summary>
    Task<bool> ExistsByNitExceptIdAsync(string nit, Guid exceptId, CancellationToken ct);

    Task AddAsync(ClienteEntity entity, CancellationToken ct);
    Task SaveChangesAsync(CancellationToken ct);
}
