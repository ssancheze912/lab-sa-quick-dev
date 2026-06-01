using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

public interface IClienteRepository
{
    Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct);
    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct);
    Task AddAsync(ClienteEntity cliente, CancellationToken ct);
    Task UpdateAsync(ClienteEntity cliente, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
    Task<bool> ExistsByNitAsync(string nit, CancellationToken ct);
}
