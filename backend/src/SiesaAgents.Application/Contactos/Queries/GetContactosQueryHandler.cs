using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.Application.Contactos.Queries;

public class GetContactosQueryHandler(IContactoRepository contactoRepository)
{
    public async Task<IEnumerable<ContactoDto>> HandleAsync(GetContactosQuery query, CancellationToken ct = default)
    {
        var contactos = await contactoRepository.GetAllAsync(ct);
        return contactos.Select(c => new ContactoDto(
            c.Id,
            c.Nombre,
            c.Cargo,
            c.Telefono,
            c.Email,
            c.ClienteId,
            c.CreatedAt,
            c.UpdatedAt));
    }
}
