using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// Handler for <see cref="GetClientesQuery"/>. Story 2.1 — read-only projection
/// from the domain entity into <see cref="ClienteDto"/>. No MediatR: the codebase
/// uses plain handler classes per Clean Architecture without a dispatcher.
/// </summary>
public class GetClientesQueryHandler(IClienteRepository repository)
{
    private readonly IClienteRepository _repository = repository;

    public async Task<IReadOnlyList<ClienteDto>> HandleAsync(GetClientesQuery query, CancellationToken ct = default)
    {
        _ = query; // no filter parameters in this story
        var clientes = await _repository.GetAllAsync(ct);

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
