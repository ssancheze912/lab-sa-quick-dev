using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// Handler for <see cref="GetClientesQuery"/> — maps the repository result to
/// a list of <see cref="ClienteDto"/>. Direct-handler pattern (no MediatR),
/// per the story's architectural constraint.
/// </summary>
public sealed class GetClientesQueryHandler
{
    private readonly IClienteRepository _repository;

    public GetClientesQueryHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<ClienteDto>> HandleAsync(GetClientesQuery _, CancellationToken ct)
    {
        var entities = await _repository.GetAllAsync(ct);
        return entities
            .Select(e => new ClienteDto(
                e.Id,
                e.Nombre,
                e.Nit,
                e.Telefono,
                e.Ciudad,
                e.CreatedAt,
                e.UpdatedAt))
            .ToList();
    }
}
