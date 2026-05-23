using SiesaAgents.Domain.Contactos.Entities;

namespace SiesaAgents.Domain.Contactos.Interfaces;

public interface IContactoRepository
{
    Task<IEnumerable<ContactoEntity>> GetAllAsync(CancellationToken ct);
    Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<IEnumerable<ContactoEntity>> GetByClienteIdAsync(Guid clienteId, CancellationToken ct);
    Task<IEnumerable<ContactoEntity>> GetOrphanAsync(CancellationToken ct);
    Task<ContactoEntity> CreateAsync(ContactoEntity entity, CancellationToken ct);
    Task<ContactoEntity> UpdateAsync(ContactoEntity entity, CancellationToken ct);
    Task DeleteAsync(ContactoEntity entity, CancellationToken ct);
}
