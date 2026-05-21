using SiesaAgents.Domain.Contactos.Entities;

namespace SiesaAgents.Domain.Contactos.Interfaces;

public interface IContactoRepository
{
    Task<IEnumerable<ContactoEntity>> GetAllAsync(CancellationToken ct);
    Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct);
}
