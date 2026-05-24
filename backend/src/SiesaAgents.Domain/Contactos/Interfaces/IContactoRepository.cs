using SiesaAgents.Domain.Contactos.Entities;

namespace SiesaAgents.Domain.Contactos.Interfaces;

public interface IContactoRepository
{
    Task<IReadOnlyList<ContactoEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ContactoEntity>> GetByClienteIdAsync(Guid clienteId, CancellationToken cancellationToken = default);
    Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(ContactoEntity contacto, CancellationToken cancellationToken = default);
    void Update(ContactoEntity contacto);
    void Remove(ContactoEntity contacto);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
