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

    public async Task<IReadOnlyList<ClienteDto>> Handle(GetClientesQuery query, CancellationToken ct)
    {
        var entities = await _repository.GetAllAsync(ct);

        return entities.Select(e => new ClienteDto(
            e.Id,
            e.Nombre,
            e.NIT,
            e.Telefono,
            e.Ciudad,
            e.CreatedAt,
            e.UpdatedAt
        )).ToList();
    }
}
