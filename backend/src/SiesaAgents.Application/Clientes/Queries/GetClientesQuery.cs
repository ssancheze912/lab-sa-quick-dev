using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Repositories;

namespace SiesaAgents.Application.Clientes.Queries;

public record GetClientesQuery();

public class GetClientesQueryHandler
{
    private readonly IClienteRepository _repository;

    public GetClientesQueryHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<ClienteDto>> HandleAsync(
        GetClientesQuery query,
        CancellationToken cancellationToken = default)
    {
        var clientes = await _repository.GetAllAsync(cancellationToken);

        return clientes
            .Select(c => new ClienteDto(
                c.Id,
                c.Nombre,
                c.Nit,
                c.Telefono,
                c.Ciudad,
                c.CreatedAt,
                c.UpdatedAt))
            .ToList();
    }
}
