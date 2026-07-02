using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// CQRS query handler for <see cref="GetClientesQuery"/>. Projects domain
/// entities to <see cref="ClienteDto"/> so infrastructure types never leak out
/// of the Application layer.
/// </summary>
public sealed class GetClientesQueryHandler
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
