using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public sealed class UpdateClienteCommandHandler(IClienteRepository repository)
{
    public async Task<ClienteDto?> HandleAsync(UpdateClienteCommand command)
    {
        var entity = await repository.GetByIdAsync(command.Id);

        if (entity is null)
            return null;

        entity.Update(command.Nombre, command.Nit, command.Telefono, command.Ciudad);

        var updated = await repository.UpdateAsync(entity);

        return new ClienteDto(
            updated.Id,
            updated.Nombre,
            updated.Nit,
            updated.Telefono,
            updated.Ciudad,
            updated.CreatedAt,
            updated.UpdatedAt);
    }
}
