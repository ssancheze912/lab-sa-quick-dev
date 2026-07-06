using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public class GetClientesQueryHandler(IClienteRepository clienteRepository)
{
    public async Task<List<ClienteDto>> Handle(GetClientesQuery query, CancellationToken cancellationToken)
    {
        var clientes = await clienteRepository.GetAllAsync(cancellationToken);

        return clientes
            .Select(c => new ClienteDto(c.Id, c.Nombre, c.Nit, c.Telefono, c.Ciudad, c.CreatedAt))
            .ToList();
    }
}
