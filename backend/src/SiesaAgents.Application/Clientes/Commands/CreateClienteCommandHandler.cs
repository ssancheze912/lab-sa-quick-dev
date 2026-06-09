using FluentValidation;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Validators;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public class CreateClienteCommandHandler(IClienteRepository repository)
{
    private static readonly CreateClienteCommandValidator Validator = new();

    public async Task<ClienteDto> HandleAsync(CreateClienteCommand command)
    {
        await Validator.ValidateAndThrowAsync(command);

        var cliente = ClienteEntity.Create(command.Nombre, command.Nit, command.Telefono, command.Ciudad);
        await repository.AddAsync(cliente);
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
