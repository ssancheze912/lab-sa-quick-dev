using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Application.Clientes.Interfaces;

public interface IClienteRepository
{
    Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
