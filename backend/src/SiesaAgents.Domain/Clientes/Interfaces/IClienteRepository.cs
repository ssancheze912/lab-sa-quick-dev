using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

/// <summary>
/// Persistence contract for the Cliente aggregate. Kept in the Domain layer so
/// Application (Query/Command handlers) depend on abstractions only.
/// </summary>
public interface IClienteRepository
{
    Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default);
}
