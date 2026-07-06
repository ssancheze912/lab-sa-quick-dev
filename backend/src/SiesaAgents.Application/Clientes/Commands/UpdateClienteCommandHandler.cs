using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public class UpdateClienteCommandHandler(IClienteRepository clienteRepository)
{
    public async Task<UpdateClienteResult> Handle(UpdateClienteCommand command, CancellationToken cancellationToken)
    {
        var existing = await clienteRepository.GetByIdAsync(command.Id, cancellationToken);

        if (existing is null)
        {
            return UpdateClienteResult.NotFound();
        }

        existing.Update(command.Nombre, command.Nit, command.Telefono, command.Ciudad);

        var updated = await clienteRepository.UpdateAsync(existing, cancellationToken);

        if (!updated)
        {
            return UpdateClienteResult.Conflict();
        }

        var dto = new ClienteDto(existing.Id, existing.Nombre, existing.Nit, existing.Telefono, existing.Ciudad, existing.CreatedAt);

        return UpdateClienteResult.Success(dto);
    }
}
