using SiesaAgents.Application.DTOs;
using SiesaAgents.Domain.Repositories;

namespace SiesaAgents.Application.Queries.Clientes;

public class GetClienteByIdQueryHandler(IClienteRepository clienteRepository)
{
    public async Task<ClienteDto?> HandleAsync(GetClienteByIdQuery query, CancellationToken ct)
    {
        var cliente = await clienteRepository.GetByIdAsync(query.Id, ct);

        return cliente is null
            ? null
            : new ClienteDto(cliente.Id, cliente.Nombre, cliente.Nit, cliente.Telefono, cliente.Ciudad, cliente.CreatedAt);
    }
}
