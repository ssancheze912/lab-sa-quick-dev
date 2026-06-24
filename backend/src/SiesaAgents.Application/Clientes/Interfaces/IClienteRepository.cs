using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Application.Clientes.Interfaces;

public interface IClienteRepository
{
    Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct = default);
}
