using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Domain.Repositories;

/// <summary>
/// Repository contract for `clientes`. Read-only surface established in Story
/// 2.1/2.2; mutation methods (Create) added by Story 2.3. Update/Delete are
/// added by Stories 2.4/2.5.
/// </summary>
public interface IClienteRepository
{
    Task<IReadOnlyList<ClienteEntity>> GetAllAsync(string? searchTerm, CancellationToken ct);

    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct);

    Task AddAsync(ClienteEntity cliente, CancellationToken ct);
}
