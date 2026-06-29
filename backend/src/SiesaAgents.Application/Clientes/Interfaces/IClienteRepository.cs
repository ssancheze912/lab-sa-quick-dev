using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Application.Clientes.Interfaces;

public interface IClienteRepository
{
    Task<IEnumerable<ClienteEntity>> GetAllAsync();
    Task<ClienteEntity?> GetByIdAsync(Guid id);
    Task AddAsync(ClienteEntity entity);
    Task UpdateAsync(ClienteEntity entity);
    Task DeleteAsync(ClienteEntity entity, CancellationToken ct = default);
    Task SaveChangesAsync();
    Task<ClienteEntity?> GetByNitAsync(string nit);
}
