using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public interface IGetClientesQueryHandler
{
    Task<IEnumerable<ClienteDto>> HandleAsync(GetClientesQuery query, CancellationToken cancellationToken = default);
}

public class GetClientesQueryHandler : IGetClientesQueryHandler
{
    private readonly IClienteRepository _repository;

    public GetClientesQueryHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<ClienteDto>> HandleAsync(GetClientesQuery query, CancellationToken cancellationToken = default)
    {
        var clientes = await _repository.GetAll(cancellationToken);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.ToLowerInvariant();
            clientes = clientes.Where(c =>
                c.Nombre.ToLowerInvariant().Contains(search) ||
                c.Nit.ToLowerInvariant().Contains(search));
        }

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
