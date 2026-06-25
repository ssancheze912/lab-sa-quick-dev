using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

public interface IClienteRepository
{
    Task<IEnumerable<ClienteEntity>> GetAllAsync();
    Task<ClienteEntity?> GetByIdAsync(Guid id);
    Task<ClienteEntity> CreateAsync(ClienteEntity entity);
    Task<ClienteEntity> UpdateAsync(ClienteEntity entity);
}
