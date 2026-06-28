using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Queries;

public sealed record GetClientesQuery();

public interface IGetClientesQueryHandler
{
    Task<IReadOnlyList<ClienteDto>> HandleAsync(GetClientesQuery query, CancellationToken cancellationToken = default);
}
