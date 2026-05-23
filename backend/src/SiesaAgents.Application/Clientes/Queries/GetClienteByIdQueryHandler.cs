using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public class GetClienteByIdQueryHandler(IClienteRepository repository)
{
    public async Task<ClienteDto?> HandleAsync(GetClienteByIdQuery query, CancellationToken ct)
    {
        var entity = await repository.GetByIdAsync(query.Id, ct);

        if (entity is null)
            return null;

        return new ClienteDto(
            Id: entity.Id,
            Nombre: entity.Nombre,
            Nit: entity.Nit,
            Telefono: entity.Telefono,
            Ciudad: entity.Ciudad,
            CreatedAt: entity.CreatedAt,
            UpdatedAt: entity.UpdatedAt
        );
    }
}
