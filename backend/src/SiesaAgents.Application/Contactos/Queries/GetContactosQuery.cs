using SiesaAgents.Application.Contactos.DTOs;

namespace SiesaAgents.Application.Contactos.Queries;

public sealed record GetContactosQuery(Guid? ClienteId = null, bool SinCliente = false);

public interface IGetContactosQueryHandler
{
    Task<IEnumerable<ContactoDto>> HandleAsync(GetContactosQuery query, CancellationToken ct = default);
}
