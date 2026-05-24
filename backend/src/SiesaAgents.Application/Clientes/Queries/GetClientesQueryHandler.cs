using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public class GetClientesQueryHandler(IClienteRepository repository)
{
    public async Task<IEnumerable<ClienteDto>> HandleAsync(GetClientesQuery query)
    {
        var entities = await repository.GetAllAsync();
        return entities.Select(e => new ClienteDto(
            e.Id,
            e.Nombre,
            e.Nit,
            e.Telefono,
            e.Ciudad,
            e.CreatedAt,
            e.UpdatedAt
        ));
    }
}
