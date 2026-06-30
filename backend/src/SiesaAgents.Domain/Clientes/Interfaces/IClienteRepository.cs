using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

public interface IClienteRepository
{
    Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct);
    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<ClienteEntity> CreateAsync(ClienteEntity cliente, CancellationToken ct);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct);
    Task<bool> ExistsByNitAsync(string nit, CancellationToken ct);
}
