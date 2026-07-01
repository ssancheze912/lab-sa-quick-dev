using SiesaAgents.Application.DTOs;
using SiesaAgents.Domain.Repositories;

namespace SiesaAgents.Application.Commands.Clientes;

public class UpdateClienteCommandHandler(IClienteRepository clienteRepository)
{
    public async Task<ClienteDto?> HandleAsync(UpdateClienteCommand command, CancellationToken ct)
    {
        var cliente = await clienteRepository.GetByIdAsync(command.Id, ct);
        if (cliente is null)
        {
            return null;
        }

        cliente.Update(command.Nombre, command.Nit, command.Telefono, command.Ciudad);

        var updated = await clienteRepository.UpdateAsync(cliente, ct);
        if (updated is null)
        {
            return null;
        }

        return new ClienteDto(updated.Id, updated.Nombre, updated.Nit, updated.Telefono, updated.Ciudad, updated.CreatedAt);
    }
}
