using SiesaAgents.Application.DTOs;
using SiesaAgents.Domain.Repositories;

namespace SiesaAgents.Application.Queries.Clientes;

public class GetClientesQueryHandler(IClienteRepository clienteRepository)
{
    public async Task<IReadOnlyList<ClienteDto>> HandleAsync(GetClientesQuery query, CancellationToken ct)
    {
        var clientes = await clienteRepository.GetAllAsync(query.SearchTerm, ct);

        return clientes
            .Select(c => new ClienteDto(c.Id, c.Nombre, c.Nit, c.Telefono, c.Ciudad, c.CreatedAt))
            .ToList();
    }
}
