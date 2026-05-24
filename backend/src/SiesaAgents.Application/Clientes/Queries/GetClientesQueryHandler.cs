using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public class GetClientesQueryHandler(IClienteRepository repository)
{
    public async Task<IReadOnlyList<ClienteDto>> HandleAsync(CancellationToken ct = default)
    {
        var entities = await repository.GetAllAsync(ct);

        return entities
            .Select(e => new ClienteDto(
                e.Id,
                e.Nombre,
                e.NIT,
                e.Telefono,
                e.Ciudad,
                e.CreatedAt,
                e.UpdatedAt))
            .ToList()
            .AsReadOnly();
    }
}
