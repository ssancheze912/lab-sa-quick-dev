using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Queries;

public sealed record GetClienteByIdQuery(Guid Id);

public interface IGetClienteByIdQueryHandler
{
    Task<ClienteDto?> HandleAsync(GetClienteByIdQuery query);
}
