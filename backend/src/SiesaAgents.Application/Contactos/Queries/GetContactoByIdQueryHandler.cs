using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.Application.Contactos.Queries;

public class GetContactoByIdQueryHandler(IContactoRepository repository)
{
    public async Task<ContactoDto?> HandleAsync(GetContactoByIdQuery query, CancellationToken ct)
    {
        var entity = await repository.GetByIdAsync(query.Id, ct);
        if (entity is null) return null;

        return new ContactoDto(
            entity.Id,
            entity.Nombre,
            entity.Cargo,
            entity.Telefono,
            entity.Email,
            entity.ClienteId,
            entity.CreatedAt,
            entity.UpdatedAt
        );
    }
}
