using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

/// <summary>
/// Repository contract for <see cref="ClienteEntity"/>. Story 2.1 only consumes
/// <see cref="GetAllAsync"/>; the additional signatures land here so stories
/// 2.2 / 2.3 / 2.4 / 2.5 can reuse the same interface without churn.
/// </summary>
public interface IClienteRepository
{
    Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct);
    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<bool> ExistsByNitAsync(string nit, CancellationToken ct);
    Task AddAsync(ClienteEntity entity, CancellationToken ct);
    Task SaveChangesAsync(CancellationToken ct);
}
