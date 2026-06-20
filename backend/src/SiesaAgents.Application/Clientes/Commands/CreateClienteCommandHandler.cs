using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Common.Exceptions;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public class CreateClienteCommandHandler(IClienteRepository repository)
{
    public async Task<ClienteDto> Handle(CreateClienteCommand command, CancellationToken ct)
    {
        var existingNit = await repository.GetByNitAsync(command.Nit, ct);
        if (existingNit is not null)
            throw new ConflictException($"El NIT/RUC '{command.Nit}' ya está registrado.");

        var cliente = ClienteEntity.Create(command.Nombre, command.Nit, command.Telefono, command.Ciudad);
        await repository.AddAsync(cliente, ct);

        return new ClienteDto(
            cliente.Id,
            cliente.Nombre,
            cliente.Nit,
            cliente.Telefono,
            cliente.Ciudad,
            cliente.CreatedAt,
            cliente.UpdatedAt
        );
    }
}
