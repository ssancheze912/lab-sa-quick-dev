using SiesaAgents.Application.Contactos.DTOs;

namespace SiesaAgents.Application.Contactos.Queries;

public sealed record GetContactosQuery();

public interface IGetContactosQueryHandler
{
    Task<IEnumerable<ContactoDto>> HandleAsync(GetContactosQuery query);
}
