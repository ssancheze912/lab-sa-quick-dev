using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

public interface IClienteRepository
{
    Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct = default);
    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ClienteEntity?> GetByNitAsync(string nit, CancellationToken ct = default);
    Task AddAsync(ClienteEntity entity, CancellationToken ct = default);
    Task UpdateAsync(ClienteEntity entity, CancellationToken ct = default);
    Task DeleteAsync(ClienteEntity entity, CancellationToken ct = default);
}
