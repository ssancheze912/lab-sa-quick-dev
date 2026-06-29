using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Application.Contactos.Interfaces;

namespace SiesaAgents.Application.Contactos.Queries;

public sealed class GetContactosQueryHandler(IContactoRepository repository) : IGetContactosQueryHandler
{
    public async Task<IEnumerable<ContactoDto>> HandleAsync(GetContactosQuery query, CancellationToken ct = default)
    {
        var contactos = await repository.GetAllAsync(query.ClienteId, ct);

        return contactos.Select(c => new ContactoDto(
            c.Id,
            c.Nombre,
            c.Cargo,
            c.Telefono,
            c.Email,
            c.ClienteId,
            c.CreatedAt,
            c.UpdatedAt
        ));
    }
}
