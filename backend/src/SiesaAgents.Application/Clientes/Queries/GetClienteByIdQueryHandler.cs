using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// Handler for <see cref="GetClienteByIdQuery"/> — maps the repository result
/// to a <see cref="ClienteDto"/> when the client exists, or <c>null</c> when
/// it does not. Direct-handler pattern (no MediatR), matching Story 2.1.
/// Returning <c>null</c> keeps the handler free of HTTP concerns — the endpoint
/// converts <c>null</c> into <c>Results.NotFound()</c> per Clean Architecture.
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
        return entity is null
            ? null
            : new ClienteDto(
                entity.Id,
                entity.Nombre,
                entity.Nit,
                entity.Telefono,
                entity.Ciudad,
                entity.CreatedAt,
                entity.UpdatedAt);
    }
}
