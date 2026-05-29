using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Repositories;

public interface IClienteRepository
{
    Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
