using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

public interface IClienteRepository
{
    Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(ClienteEntity cliente, CancellationToken cancellationToken = default);
}
