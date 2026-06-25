using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public sealed class CreateClienteCommandHandler(IClienteRepository repository)
{
    public async Task<ClienteDto> HandleAsync(CreateClienteCommand command)
    {
        var entity = ClienteEntity.Create(
            command.Nombre,
            command.Nit,
            command.Telefono,
            command.Ciudad);

        var created = await repository.CreateAsync(entity);

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
