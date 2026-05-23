using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.Application.Contactos.Queries;

public class GetContactosByClienteIdQueryHandler(IContactoRepository repository)
{
    public async Task<IEnumerable<ContactoDto>> HandleAsync(GetContactosByClienteIdQuery query, CancellationToken ct)
    {
        var entities = await repository.GetByClienteIdAsync(query.ClienteId, ct);
        return entities.Select(e => new ContactoDto(
            e.Id,
            e.Nombre,
            e.Cargo,
            e.Telefono,
            e.Email,
            e.ClienteId,
            e.CreatedAt,
            e.UpdatedAt
        ));
    }
}
