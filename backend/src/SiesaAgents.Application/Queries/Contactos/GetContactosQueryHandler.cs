using SiesaAgents.Application.DTOs;
using SiesaAgents.Domain.Repositories;

namespace SiesaAgents.Application.Queries.Contactos;

public class GetContactosQueryHandler(IContactoRepository contactoRepository)
{
    public async Task<IReadOnlyList<ContactoDto>> HandleAsync(GetContactosQuery query, CancellationToken ct)
    {
        var contactos = await contactoRepository.GetAllAsync(query.SearchTerm, ct);

        return contactos
            .Select(c => new ContactoDto(c.Id, c.Nombre, c.Cargo, c.Telefono, c.Email, c.ClienteId, c.CreatedAt))
            .ToList();
    }
}
