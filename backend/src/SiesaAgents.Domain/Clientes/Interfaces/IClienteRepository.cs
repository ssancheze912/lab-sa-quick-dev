using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

public interface IClienteRepository
{
    Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct = default);
    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(ClienteEntity cliente, CancellationToken ct = default);
    Task UpdateAsync(ClienteEntity cliente, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
