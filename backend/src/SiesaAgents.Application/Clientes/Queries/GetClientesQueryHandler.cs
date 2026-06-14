using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public class GetClientesQueryHandler(IClienteRepository repository)
{
    public async Task<IEnumerable<ClienteDto>> HandleAsync(GetClientesQuery query, CancellationToken ct = default)
    {
        var clientes = await repository.GetAllAsync(ct);
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
