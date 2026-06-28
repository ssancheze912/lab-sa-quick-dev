using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public class UpdateClienteCommandHandler(IClienteRepository repo)
{
    public async Task<ClienteDto?> Handle(UpdateClienteCommand command, CancellationToken ct)
    {
        var entity = await repo.GetByIdAsync(command.Id, ct);
        if (entity is null) return null;

        entity.Update(command.Nombre, command.Nit, command.Telefono, command.Ciudad);
        await repo.UpdateAsync(entity, ct);

        return new ClienteDto(
            entity.Id,
            entity.Nombre,
            entity.Nit,
            entity.Telefono,
            entity.Ciudad,
            entity.CreatedAt,
            entity.UpdatedAt);
    }
}
