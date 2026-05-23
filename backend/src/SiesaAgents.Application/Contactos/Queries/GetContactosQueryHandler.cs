using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.Application.Contactos.Queries;

public class GetContactosQueryHandler
{
    private readonly IContactoRepository _repository;

    public GetContactosQueryHandler(IContactoRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<ContactoDto>> HandleAsync(GetContactosQuery query, CancellationToken ct)
    {
        var contactos = await _repository.GetAllAsync(ct);
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
