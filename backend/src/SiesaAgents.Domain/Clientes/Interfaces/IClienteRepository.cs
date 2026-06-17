using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

public interface IClienteRepository
{
    Task<List<ClienteEntity>> GetAllAsync();
    Task<ClienteEntity?> GetByIdAsync(Guid id);
}
