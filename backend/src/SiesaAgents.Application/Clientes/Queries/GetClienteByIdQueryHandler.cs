using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public sealed class GetClienteByIdQueryHandler(IClienteRepository repository)
{
    public async Task<ClienteDto?> HandleAsync(
        GetClienteByIdQuery query,
        CancellationToken cancellationToken = default)
    {
        var entity = await repository.GetByIdAsync(query.Id, cancellationToken);
        if (entity is null) return null;

        return new ClienteDto(
            entity.Id,
            entity.Nombre,
            entity.NitRuc,
            entity.Telefono,
            entity.Ciudad,
            entity.CreatedAt);
    }
}
