using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Interfaces;
using SiesaAgents.Domain.Exceptions;

namespace SiesaAgents.Application.Clientes.Queries;

public class GetClienteByIdQueryHandler(IClienteRepository clienteRepository)
{
    public async Task<ClienteDto> HandleAsync(GetClienteByIdQuery query, CancellationToken ct = default)
    {
        var cliente = await clienteRepository.GetByIdAsync(query.Id, ct);

        if (cliente is null)
            throw new NotFoundException($"Cliente with id '{query.Id}' was not found.");

        return new ClienteDto(
            cliente.Id,
            cliente.Nombre,
            cliente.Nit,
            cliente.Telefono,
            cliente.Ciudad,
            cliente.CreatedAt,
            cliente.UpdatedAt);
    }
}
