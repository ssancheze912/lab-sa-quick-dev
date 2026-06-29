using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public sealed class ClienteNotFoundException(Guid id)
    : Exception($"Cliente con id {id} no encontrado") { }

public sealed class UpdateClienteCommandHandler(IClienteRepository repository) : IUpdateClienteCommandHandler
{
    public async Task<ClienteDto> HandleAsync(UpdateClienteCommand command)
    {
        var entity = await repository.GetByIdAsync(command.Id);
        if (entity is null)
            throw new ClienteNotFoundException(command.Id);

        entity.Update(command.Nombre, command.Nit, command.Telefono, command.Ciudad);
        await repository.UpdateAsync(entity);
        await repository.SaveChangesAsync();

        return new ClienteDto(
            entity.Id,
            entity.Nombre,
            entity.Nit,
            entity.Telefono,
            entity.Ciudad,
            entity.CreatedAt,
            entity.UpdatedAt
        );
    }
}
