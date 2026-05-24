using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public sealed class GetClientesQueryHandler(IClienteRepository repository)
{
    public async Task<IReadOnlyList<ClienteDto>> HandleAsync(
        GetClientesQuery query,
        CancellationToken cancellationToken = default)
    {
        var entities = await repository.GetAllAsync(cancellationToken);

        return entities
            .Select(e => new ClienteDto(
                e.Id,
                e.Nombre,
                e.NitRuc,
                e.Telefono,
                e.Ciudad,
                e.CreatedAt))
            .ToList()
            .AsReadOnly();
    }
}
