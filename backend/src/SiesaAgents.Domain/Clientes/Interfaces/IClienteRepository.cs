using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Domain.Clientes.Interfaces;

/// <summary>
/// Repository contract for the <see cref="ClienteEntity"/> aggregate.
/// Story 2.1 only requires <see cref="GetAllAsync"/>. Additional operations
/// (GetById, Add, Update, Delete) are introduced by Stories 2.2–2.5 as their
/// use cases land — keeping the interface surface minimal per story.
/// </summary>
public interface IClienteRepository
{
    Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<ClienteEntity?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}
