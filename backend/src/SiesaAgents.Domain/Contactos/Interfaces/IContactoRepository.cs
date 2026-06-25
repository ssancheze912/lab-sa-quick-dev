using SiesaAgents.Domain.Contactos.Entities;

namespace SiesaAgents.Domain.Contactos.Interfaces;

public interface IContactoRepository
{
    Task<IEnumerable<ContactoEntity>> GetAllAsync();
    Task<ContactoEntity?> GetByIdAsync(Guid id);
}
