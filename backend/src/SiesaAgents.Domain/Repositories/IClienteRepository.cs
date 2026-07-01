using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Domain.Repositories;

/// <summary>
/// Read-only repository contract for `clientes` (Story 2.1 scope). Mutation
/// methods (Create/Update/Delete) are added by Stories 2.3/2.4/2.5.
/// </summary>
public interface IClienteRepository
{
    Task<IReadOnlyList<ClienteEntity>> GetAllAsync(string? searchTerm, CancellationToken ct);

    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct);
}
