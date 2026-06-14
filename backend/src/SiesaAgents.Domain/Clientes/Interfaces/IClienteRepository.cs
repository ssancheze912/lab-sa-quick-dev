using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

public interface IClienteRepository
{
    Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct);
    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct);
    Task AddAsync(ClienteEntity entity, CancellationToken ct);
    Task UpdateAsync(ClienteEntity entity, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
    Task<bool> NitExistsAsync(string nit, CancellationToken ct);
}
