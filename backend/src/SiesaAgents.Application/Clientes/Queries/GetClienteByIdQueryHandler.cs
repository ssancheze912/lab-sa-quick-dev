using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

/// <summary>
/// POCO handler for <see cref="GetClienteByIdQuery"/>. Returns <c>null</c>
/// when the aggregate does not exist — the endpoint layer maps that <c>null</c>
/// to HTTP 404 via the framework <c>UseStatusCodePages</c> middleware.
/// </summary>
public class GetClienteByIdQueryHandler(IClienteRepository repository)
{
    public async Task<ClienteDto?> HandleAsync(
        GetClienteByIdQuery query,
        CancellationToken cancellationToken = default)
    {
        var cliente = await repository.GetByIdAsync(query.Id, cancellationToken);
        if (cliente is null)
        {
            return null;
        }

        return new ClienteDto(
            cliente.Id,
            cliente.Nombre,
            cliente.NitRuc,
            cliente.Telefono,
            cliente.Ciudad,
            cliente.CreatedAt,
            cliente.UpdatedAt);
    }
}
