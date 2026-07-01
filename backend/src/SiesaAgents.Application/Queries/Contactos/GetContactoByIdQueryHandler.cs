using SiesaAgents.Application.DTOs;
using SiesaAgents.Domain.Repositories;

namespace SiesaAgents.Application.Queries.Contactos;

public class GetContactoByIdQueryHandler(IContactoRepository contactoRepository)
{
    public async Task<ContactoDto?> HandleAsync(GetContactoByIdQuery query, CancellationToken ct)
    {
        var contacto = await contactoRepository.GetByIdAsync(query.Id, ct);

        return contacto is null
            ? null
            : new ContactoDto(contacto.Id, contacto.Nombre, contacto.Cargo, contacto.Telefono, contacto.Email, contacto.ClienteId, contacto.CreatedAt);
    }
}
