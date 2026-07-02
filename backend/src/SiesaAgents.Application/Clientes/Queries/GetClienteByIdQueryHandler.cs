using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// CQRS query handler for <see cref="GetClienteByIdQuery"/>. Returns
/// <c>null</c> when the id has no matching cliente — the endpoint maps
/// <c>null</c> to a 404 Problem Details response (NFR6).
/// </summary>
public sealed class GetClienteByIdQueryHandler
{
    private readonly IClienteRepository _repository;

    public GetClienteByIdQueryHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<ClienteDto?> HandleAsync(
        GetClienteByIdQuery query,
        CancellationToken cancellationToken = default)
    {
        var cliente = await _repository.GetByIdAsync(query.Id, cancellationToken);
        if (cliente is null)
        {
            return null;
        }

        return new ClienteDto(
            cliente.Id,
            cliente.Nombre,
            cliente.Nit,
            cliente.Telefono,
            cliente.Ciudad,
            cliente.CreatedAt,
            cliente.UpdatedAt);
    }
}
