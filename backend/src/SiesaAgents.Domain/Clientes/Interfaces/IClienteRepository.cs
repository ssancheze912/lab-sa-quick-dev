using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

public interface IClienteRepository
{
    Task<IEnumerable<ClienteEntity>> GetAll(CancellationToken cancellationToken = default);
    Task<ClienteEntity?> GetById(Guid id, CancellationToken cancellationToken = default);
}
