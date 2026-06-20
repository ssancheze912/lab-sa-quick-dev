using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Common.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public class UpdateClienteCommandHandler(IClienteRepository repository)
{
    public async Task<ClienteDto> Handle(UpdateClienteCommand command, CancellationToken ct)
    {
        var cliente = await repository.GetByIdAsync(command.Id, ct)
            ?? throw new NotFoundException($"Cliente con ID '{command.Id}' no encontrado.");

        var existingNit = await repository.GetByNitAsync(command.Nit, ct);
        if (existingNit is not null && existingNit.Id != command.Id)
            throw new ConflictException($"El NIT/RUC '{command.Nit}' ya está registrado.");

        cliente.Update(command.Nombre, command.Nit, command.Telefono, command.Ciudad);
        await repository.UpdateAsync(cliente, ct);

        return new ClienteDto(
            cliente.Id,
            cliente.Nombre,
            cliente.Nit,
            cliente.Telefono,
            cliente.Ciudad,
            cliente.CreatedAt,
            cliente.UpdatedAt);
    }
}
