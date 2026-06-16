using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public record GetClientesQuery;

public sealed class GetClientesQueryHandler(IClienteRepository repository)
{
    public async Task<IReadOnlyList<ClienteDto>> HandleAsync(GetClientesQuery query, CancellationToken ct = default)
    {
        var clientes = await repository.GetAllAsync(ct);
        return clientes
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new ClienteDto(c.Id, c.Nombre, c.NIT, c.Telefono, c.Ciudad, c.CreatedAt, c.UpdatedAt))
            .ToList()
            .AsReadOnly();
    }
}
