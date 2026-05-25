using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public class GetClientesQueryHandler(IClienteRepository clienteRepository)
{
    public async Task<IEnumerable<ClienteDto>> HandleAsync(GetClientesQuery query, CancellationToken ct)
    {
        var clientes = await clienteRepository.GetAllAsync(ct);
        return clientes.Select(c => new ClienteDto(
            c.Id,
            c.Nombre,
            c.NitRuc,
            c.Telefono,
            c.Ciudad,
            c.CreadoEn
        ));
    }
}
