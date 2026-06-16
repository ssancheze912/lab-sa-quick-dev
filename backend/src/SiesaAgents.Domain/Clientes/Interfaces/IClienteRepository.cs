using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

public interface IClienteRepository
{
    Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct);
    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct);
}
