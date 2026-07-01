using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

/// <summary>
/// Repository contract for <see cref="ClienteEntity"/> aggregate.
///
/// Story 2.1 exposes only <see cref="GetAllAsync"/> — the read-side operation
/// needed for the list endpoint. Later stories extend this surface:
///   - Story 2.2 → GetByIdAsync
///   - Story 2.3 → AddAsync
///   - Story 2.4 → UpdateAsync
///   - Story 2.5 → DeleteAsync
/// </summary>
public interface IClienteRepository
{
    Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default);
}
