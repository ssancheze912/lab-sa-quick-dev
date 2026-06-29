using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Application.Contactos.Interfaces;

public interface IContactoRepository
{
    Task<IEnumerable<ContactoEntity>> GetAllAsync();
    Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);
}
