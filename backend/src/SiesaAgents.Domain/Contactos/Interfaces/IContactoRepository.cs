using SiesaAgents.Domain.Contactos.Entities;

namespace SiesaAgents.Domain.Contactos.Interfaces;

public interface IContactoRepository
{
    Task<IReadOnlyList<ContactoEntity>> GetAllAsync(CancellationToken ct = default);
    Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(ContactoEntity contacto, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
    Task DeleteAsync(ContactoEntity contacto, CancellationToken ct = default);
}
