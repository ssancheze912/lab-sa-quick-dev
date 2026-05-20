using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

public interface IClienteRepository
{
    Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct);
    Task CreateAsync(ClienteEntity cliente, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
}
