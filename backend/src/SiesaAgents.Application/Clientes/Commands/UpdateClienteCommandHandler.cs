using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public class UpdateClienteCommandHandler(IClienteRepository repository)
{
    public async Task<ClienteDto?> HandleAsync(UpdateClienteCommand command)
    {
        var cliente = await repository.GetByIdAsync(command.Id);
        if (cliente is null) return null;

        cliente.Update(command.Nombre, command.NitRuc, command.Telefono, command.Ciudad);
        await repository.UpdateAsync(cliente);

        return new ClienteDto(
            cliente.Id,
            cliente.Nombre,
            cliente.Nit,
            cliente.Telefono,
            cliente.Ciudad,
            cliente.CreatedAt
        );
    }
}
