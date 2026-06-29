using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Application.Contactos.Interfaces;

public interface IContactoRepository
{
    Task<IEnumerable<ContactoEntity>> GetAllAsync();
    Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(ContactoEntity entity, CancellationToken ct = default);
    Task UpdateAsync(ContactoEntity entity, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
