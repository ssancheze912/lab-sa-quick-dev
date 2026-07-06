using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

/// <summary>
/// Story 2.1 added read-only listing (<see cref="GetAllAsync"/>). Story 2.2 added
/// single-record lookup (<see cref="GetByIdAsync"/>). CreateAsync/UpdateAsync/DeleteAsync
/// are still out of scope — Stories 2.3-2.5 extend this interface further.
/// </summary>
public interface IClienteRepository
{
    Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken);

    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
}
