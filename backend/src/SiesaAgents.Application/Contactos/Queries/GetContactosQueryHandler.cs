using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.Application.Contactos.Queries;

public sealed class GetContactosQueryHandler(IContactoRepository repository)
{
    public async Task<IEnumerable<ContactoDto>> HandleAsync(GetContactosQuery query)
    {
        var entities = await repository.GetAllAsync();
        return entities
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new ContactoDto(
                e.Id,
                e.Nombre,
                e.Cargo,
                e.Telefono,
                e.Email,
                e.ClienteId,
                e.CreatedAt,
                e.UpdatedAt));
    }
}
