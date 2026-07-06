using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

/// <summary>
/// Story 2.1 scope: read-only listing. Do NOT add CreateAsync/UpdateAsync/DeleteAsync/
/// GetByIdAsync here yet — Stories 2.2-2.5 extend this interface.
/// </summary>
public interface IClienteRepository
{
    Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken);
}
