using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public class GetClientesQueryHandler(IClienteRepository repository)
{
    public async Task<IEnumerable<ClienteDto>> HandleAsync(
        GetClientesQuery query,
        CancellationToken cancellationToken = default)
    {
        var clientes = await repository.GetAllAsync(cancellationToken);

        return clientes
            .Select(c => new ClienteDto(
                c.Id,
                c.Nombre,
                c.Nit,
                c.Telefono,
                c.Ciudad,
                c.CreatedAt,
                c.UpdatedAt));
    }
}
