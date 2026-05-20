using FluentValidation;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Validators;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public class CreateClienteCommandHandler
{
    private readonly IClienteRepository _repository;
    private readonly CreateClienteCommandValidator _validator;

    public CreateClienteCommandHandler(IClienteRepository repository)
    {
        _repository = repository;
        _validator = new CreateClienteCommandValidator();
    }

    public async Task<ClienteDto> HandleAsync(CreateClienteCommand command, CancellationToken ct)
    {
        var validationResult = await _validator.ValidateAsync(command, ct);
        if (!validationResult.IsValid)
            throw new ValidationException(validationResult.Errors);

        var cliente = ClienteEntity.Create(command.Nombre, command.Nit, command.Telefono, command.Ciudad);
        await _repository.CreateAsync(cliente, ct);
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
