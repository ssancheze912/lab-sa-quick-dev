using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Common.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public class GetClienteByIdQueryHandler(IClienteRepository repository)
{
    public async Task<ClienteDto> Handle(GetClienteByIdQuery query, CancellationToken ct)
    {
        var cliente = await repository.GetByIdAsync(query.Id, ct)
            ?? throw new NotFoundException($"Cliente {query.Id} no encontrado.");
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
