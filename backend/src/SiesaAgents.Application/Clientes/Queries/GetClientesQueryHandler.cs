using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public class GetClientesQueryHandler(IClienteRepository repository)
{
    public async Task<IEnumerable<ClienteDto>> HandleAsync(GetClientesQuery query, CancellationToken ct)
    {
        var entities = await repository.GetAllAsync(ct);

        return entities.Select(e => new ClienteDto(
            Id: e.Id,
            Nombre: e.Nombre,
            Nit: e.Nit,
            Telefono: e.Telefono,
            Ciudad: e.Ciudad,
            CreatedAt: e.CreatedAt,
            UpdatedAt: e.UpdatedAt
        ));
    }
}
