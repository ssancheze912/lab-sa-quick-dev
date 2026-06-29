using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Interfaces;
using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Application.Clientes.Commands;

public sealed class NitAlreadyExistsException(string nit)
    : Exception($"El NIT/RUC '{nit}' ya está registrado") { }

public sealed class CreateClienteCommandHandler(IClienteRepository repository) : ICreateClienteCommandHandler
{
    public async Task<ClienteDto> HandleAsync(CreateClienteCommand command)
    {
        var existing = await repository.GetByNitAsync(command.Nit);
        if (existing is not null)
        {
            throw new NitAlreadyExistsException(command.Nit);
        }

        var entity = ClienteEntity.Create(
            command.Nombre,
            command.Nit,
            command.Telefono,
            command.Ciudad
        );

        await repository.AddAsync(entity);
        await repository.SaveChangesAsync();

        return new ClienteDto(
            entity.Id,
            entity.Nombre,
            entity.Nit,
            entity.Telefono,
            entity.Ciudad,
            entity.CreatedAt
        );
    }
}
