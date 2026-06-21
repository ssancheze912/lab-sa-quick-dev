using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public class GetClienteByIdQueryHandler(IClienteRepository repository)
{
    public async Task<ClienteDto?> Handle(
        GetClienteByIdQuery query,
        CancellationToken cancellationToken = default)
    {
        var entity = await repository.GetByIdAsync(query.Id, cancellationToken);

        if (entity is null)
            return null;

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
