using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public class GetClienteByIdQueryHandler(IClienteRepository clienteRepository)
{
    public async Task<ClienteDto?> Handle(GetClienteByIdQuery query, CancellationToken cancellationToken)
    {
        var cliente = await clienteRepository.GetByIdAsync(query.Id, cancellationToken);

        return cliente is null
            ? null
            : new ClienteDto(cliente.Id, cliente.Nombre, cliente.Nit, cliente.Telefono, cliente.Ciudad, cliente.CreatedAt);
    }
}
