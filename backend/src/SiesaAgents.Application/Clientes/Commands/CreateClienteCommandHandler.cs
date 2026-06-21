using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Interfaces;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Application.Clientes.Commands;

public class CreateClienteCommandHandler(IClienteRepository repository)
{
    public async Task<ClienteDto> Handle(CreateClienteCommand command, CancellationToken cancellationToken = default)
    {
        var entity = ClienteEntity.Create(
            command.Request.Nombre,
            command.Request.Nit,
            command.Request.Telefono,
            command.Request.Ciudad);

        var created = await repository.AddAsync(entity, cancellationToken);

        return new ClienteDto(
            created.Id,
            created.Nombre,
            created.Nit,
            created.Telefono,
            created.Ciudad,
            created.CreatedAt,
            created.UpdatedAt);
    }
}
