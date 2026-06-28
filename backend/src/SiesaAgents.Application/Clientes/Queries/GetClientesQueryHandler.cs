using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public sealed class GetClientesQueryHandler(IClienteRepository repository) : IGetClientesQueryHandler
{
    public async Task<IReadOnlyList<ClienteDto>> HandleAsync(GetClientesQuery query, CancellationToken cancellationToken = default)
    {
        var clientes = await repository.GetAllAsync(cancellationToken);
        return clientes
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new ClienteDto(c.Id, c.Nombre, c.Nit, c.Telefono, c.Ciudad, c.CreatedAt, c.UpdatedAt))
            .ToList()
            .AsReadOnly();
    }
}
