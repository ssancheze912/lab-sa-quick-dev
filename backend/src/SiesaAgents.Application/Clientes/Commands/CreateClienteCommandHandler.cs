using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public class CreateClienteCommandHandler(IClienteRepository repo)
{
    public async Task<ClienteDto> Handle(CreateClienteCommand command, CancellationToken ct)
    {
        var entity = ClienteEntity.Create(command.Nombre, command.Nit, command.Telefono, command.Ciudad);
        await repo.AddAsync(entity, ct);
        await repo.SaveChangesAsync(ct);
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
