using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Domain.Exceptions;

namespace SiesaAgents.Application.Clientes.Queries;

public class GetClienteByIdQueryHandler
{
    private readonly IClienteRepository _repository;

    public GetClienteByIdQueryHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<ClienteDto> HandleAsync(GetClienteByIdQuery query, CancellationToken ct = default)
    {
        var cliente = await _repository.GetByIdAsync(query.Id, ct);

        if (cliente is null)
        {
            throw new NotFoundException("Cliente no encontrado.");
        }

        return new ClienteDto(
            cliente.Id,
            cliente.Nombre,
            cliente.Nit,
            cliente.Telefono,
            cliente.Ciudad,
            cliente.CreatedAt);
    }
}
