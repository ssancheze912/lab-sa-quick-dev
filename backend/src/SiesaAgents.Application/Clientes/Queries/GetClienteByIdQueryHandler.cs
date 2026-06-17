using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public class GetClienteByIdQueryHandler(IClienteRepository repository)
{
    public async Task<ClienteDto?> HandleAsync(GetClienteByIdQuery query)
    {
        var cliente = await repository.GetByIdAsync(query.Id);
        if (cliente is null) return null;

        return new ClienteDto(
            cliente.Id,
            cliente.Nombre,
            cliente.Nit,
            cliente.Telefono,
            cliente.Ciudad,
            cliente.CreatedAt);
    }
}
