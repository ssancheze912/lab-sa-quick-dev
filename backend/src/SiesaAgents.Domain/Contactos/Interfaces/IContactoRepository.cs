using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Domain.Contactos.Interfaces;

public interface IContactoRepository
{
    Task<IEnumerable<ContactoEntity>> GetAllAsync(CancellationToken ct = default);
}
