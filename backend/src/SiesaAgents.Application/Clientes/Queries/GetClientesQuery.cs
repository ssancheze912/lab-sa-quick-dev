using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Queries;

public record GetClientesQuery();

public interface IGetClientesQueryHandler
{
    Task<IReadOnlyList<ClienteDto>> HandleAsync(GetClientesQuery query, CancellationToken ct);
}
