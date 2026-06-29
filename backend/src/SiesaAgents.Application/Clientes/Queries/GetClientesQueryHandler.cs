using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public sealed class GetClientesQueryHandler(IClienteRepository repository) : IGetClientesQueryHandler
{
    public async Task<IEnumerable<ClienteDto>> HandleAsync(GetClientesQuery query)
    {
        var clientes = await repository.GetAllAsync();

        return clientes.Select(c => new ClienteDto(
            c.Id,
            c.Nombre,
            c.Nit,
            c.Telefono,
            c.Ciudad,
            c.CreatedAt,
            c.UpdatedAt
        ));
    }
}
