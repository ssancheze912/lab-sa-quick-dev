using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.Application.Contactos.Queries;

public class GetContactosQueryHandler(IContactoRepository repository)
{
    public async Task<IReadOnlyList<ContactoDto>> HandleAsync(
        GetContactosQuery query,
        CancellationToken cancellationToken = default)
    {
        var contactos = await repository.GetAllAsync(cancellationToken);

        IEnumerable<Domain.Contactos.Entities.ContactoEntity> filtered = contactos;

        if (!string.IsNullOrWhiteSpace(query.Search))
            filtered = filtered.Where(c =>
                c.Nombre.Contains(query.Search, StringComparison.OrdinalIgnoreCase) ||
                c.Email.Contains(query.Search, StringComparison.OrdinalIgnoreCase));

        if (query.ClienteId.HasValue)
            filtered = filtered.Where(c => c.ClienteId == query.ClienteId.Value);

        return filtered
            .OrderBy(c => c.Nombre)
            .Select(c => new ContactoDto(c.Id, c.Nombre, c.Cargo, c.Telefono, c.Email, c.ClienteId, c.CreatedAt, c.UpdatedAt))
            .ToList()
            .AsReadOnly();
    }
}
