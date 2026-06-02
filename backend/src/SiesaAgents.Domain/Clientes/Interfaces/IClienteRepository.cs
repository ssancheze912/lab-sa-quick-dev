using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

/// <summary>
/// Repository contract for <see cref="ClienteEntity"/> persistence (Epic 2).
/// Domain owns the contract; <see cref="SiesaAgents.Infrastructure"/> provides the EF Core impl.
/// </summary>
public interface IClienteRepository
{
    Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default);
}
