using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public class GetClientesQueryHandler(IClienteRepository clienteRepository)
{
    public async Task<IEnumerable<ClienteDto>> HandleAsync(GetClientesQuery query)
    {
        var clientes = await clienteRepository.GetAllAsync();

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
