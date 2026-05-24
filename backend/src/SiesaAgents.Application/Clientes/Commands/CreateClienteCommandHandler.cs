using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public sealed class CreateClienteCommandHandler(IClienteRepository repository)
{
    public async Task<ClienteDto> HandleAsync(
        CreateClienteCommand command,
        CancellationToken cancellationToken = default)
    {
        var entity = ClienteEntity.Create(
            command.Nombre,
            command.Nit,
            command.Telefono,
            command.Ciudad);

        await repository.AddAsync(entity, cancellationToken);

        return new ClienteDto(
            entity.Id,
            entity.Nombre,
            entity.NitRuc,
            entity.Telefono,
            entity.Ciudad,
            entity.CreatedAt);
    }
}
