using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

public interface IClienteRepository
{
    Task<IEnumerable<ClienteEntity>> GetAllAsync();
    Task<ClienteEntity?> GetByIdAsync(Guid id);
    Task CreateAsync(ClienteEntity cliente);
    Task UpdateAsync(ClienteEntity cliente);
    Task DeleteAsync(Guid id);
}
