using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

public interface IClienteRepository
{
    Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default);
    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(ClienteEntity cliente, CancellationToken ct = default);
    Task DeleteAsync(ClienteEntity cliente, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
