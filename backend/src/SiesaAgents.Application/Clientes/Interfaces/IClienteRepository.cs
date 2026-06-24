using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Application.Clientes.Interfaces;

public interface IClienteRepository
{
    Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct = default);
    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(ClienteEntity entity, CancellationToken ct = default);
    Task DeleteAsync(ClienteEntity entity, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
