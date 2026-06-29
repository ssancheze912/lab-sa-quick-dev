using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// Handles <see cref="GetClientesQuery"/> by delegating to <see cref="IClienteRepository"/>
/// and mapping <c>ClienteEntity</c> instances to <see cref="ClienteDto"/>.
/// </summary>
public sealed class GetClientesQueryHandler
{
    private readonly IClienteRepository _repository;

    public GetClientesQueryHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<ClienteDto>> HandleAsync(GetClientesQuery query, CancellationToken ct)
    {
        var clientes = await _repository.GetAllAsync(query.Search, ct);

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
