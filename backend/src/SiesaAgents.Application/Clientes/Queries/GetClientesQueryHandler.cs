using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// POCO handler for <see cref="GetClientesQuery"/>. Registered directly in DI
/// (no MediatR) — company-standards mandate CQRS separation, not the library.
/// </summary>
public class GetClientesQueryHandler(IClienteRepository repository)
{
    public async Task<IReadOnlyList<ClienteDto>> HandleAsync(
        GetClientesQuery _,
        CancellationToken cancellationToken = default)
    {
        var clientes = await repository.GetAllAsync(cancellationToken);
        return clientes
            .Select(c => new ClienteDto(
                c.Id,
                c.Nombre,
                c.NitRuc,
                c.Telefono,
                c.Ciudad,
                c.CreatedAt,
                c.UpdatedAt))
            .ToList();
    }
}
