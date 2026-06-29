using SiesaAgents.Application.Contactos.DTOs;

namespace SiesaAgents.Application.Contactos.Queries;

public sealed record GetContactoByIdQuery(Guid Id);

public interface IGetContactoByIdQueryHandler
{
    Task<ContactoDto?> HandleAsync(GetContactoByIdQuery query);
}
