using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// Handles <see cref="GetClienteByIdQuery"/> by delegating to
/// <see cref="IClienteRepository.GetByIdAsync"/> and projecting the entity into
/// a <see cref="ClienteDto"/>. Returns <c>null</c> when the entity does not
/// exist — the API layer translates that into an RFC 7807 Problem Details 404.
/// </summary>
public sealed class GetClienteByIdQueryHandler
{
    private readonly IClienteRepository _repository;

    public GetClienteByIdQueryHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<ClienteDto?> HandleAsync(GetClienteByIdQuery query, CancellationToken ct)
    {
        var entity = await _repository.GetByIdAsync(query.Id, ct);
        if (entity is null)
        {
            return null;
        }

        return new ClienteDto(
            entity.Id,
            entity.Nombre,
            entity.Nit,
            entity.Telefono,
            entity.Ciudad,
            entity.CreatedAt,
            entity.UpdatedAt);
    }
}
