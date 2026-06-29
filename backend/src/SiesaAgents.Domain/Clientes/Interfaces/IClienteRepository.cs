using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

/// <summary>
/// Repository contract for <see cref="ClienteEntity"/>.
/// Story 2.1 uses only <see cref="GetAllAsync"/>; the remaining members are defined
/// here so subsequent stories (2.3 / 2.4 / 2.5) do not break the interface.
/// </summary>
public interface IClienteRepository
{
    Task<IReadOnlyList<ClienteEntity>> GetAllAsync(string? search, CancellationToken ct);

    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct);

    Task<bool> ExistsByNitAsync(string nit, CancellationToken ct);

    Task AddAsync(ClienteEntity entity, CancellationToken ct);

    Task UpdateAsync(ClienteEntity entity, CancellationToken ct);

    Task DeleteAsync(ClienteEntity entity, CancellationToken ct);
}
