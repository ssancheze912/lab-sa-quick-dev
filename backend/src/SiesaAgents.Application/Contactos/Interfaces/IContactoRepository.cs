using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Application.Contactos.Interfaces;

public interface IContactoRepository
{
    Task<IEnumerable<ContactoEntity>> GetAllAsync(Guid? clienteId = null);
    Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(ContactoEntity entity, CancellationToken ct = default);
    Task UpdateAsync(ContactoEntity entity, CancellationToken ct = default);
    Task DeleteAsync(ContactoEntity entity, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
