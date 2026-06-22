using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public class GetClientesQueryHandler
{
    private readonly IClienteRepository _repository;

    public GetClientesQueryHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<ClienteDto>> HandleAsync(GetClientesQuery query, CancellationToken ct)
    {
        var clientes = await _repository.GetAllAsync(ct);
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
