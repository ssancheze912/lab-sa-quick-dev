using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public sealed class GetClienteByIdQueryHandler(IClienteRepository repository) : IGetClienteByIdQueryHandler
{
    public async Task<ClienteDto?> HandleAsync(GetClienteByIdQuery query)
    {
        var cliente = await repository.GetByIdAsync(query.Id);

        if (cliente is null)
            return null;

        return new ClienteDto(
            cliente.Id,
            cliente.Nombre,
            cliente.Nit,
            cliente.Telefono,
            cliente.Ciudad,
            cliente.CreatedAt,
            cliente.UpdatedAt
        );
    }
}
