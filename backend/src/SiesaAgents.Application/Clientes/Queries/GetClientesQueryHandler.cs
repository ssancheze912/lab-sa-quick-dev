using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public class GetClientesQueryHandler(IClienteRepository repository)
{
    public async Task<IEnumerable<ClienteDto>> Handle(GetClientesQuery query, CancellationToken ct)
        => (await repository.GetAllAsync(ct))
           .Select(c => new ClienteDto(c.Id, c.Nombre, c.Nit, c.Telefono, c.Ciudad, c.CreatedAt, c.UpdatedAt));
}
