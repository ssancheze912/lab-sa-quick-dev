using MediatR;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public class GetClientesQueryHandler : IRequestHandler<GetClientesQuery, IEnumerable<ClienteDto>>
{
    private readonly IClienteRepository _repository;

    public GetClientesQueryHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<ClienteDto>> Handle(GetClientesQuery request, CancellationToken cancellationToken)
    {
        var entities = await _repository.GetAllAsync(cancellationToken);

        return entities.Select(e => new ClienteDto(
            e.Id,
            e.Nombre,
            e.Nit,
            e.Telefono,
            e.Ciudad,
            e.CreatedAt,
            e.UpdatedAt
        ));
    }
}
