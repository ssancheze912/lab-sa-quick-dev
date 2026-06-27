using FluentValidation;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Validators;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public class UpdateClienteCommandHandler
{
    private readonly IClienteRepository _repository;
    private readonly UpdateClienteCommandValidator _validator;

    public UpdateClienteCommandHandler(IClienteRepository repository)
    {
        _repository = repository;
        _validator = new UpdateClienteCommandValidator();
    }

    public async Task<ClienteDto> HandleAsync(UpdateClienteCommand command, CancellationToken ct)
    {
        var validationResult = await _validator.ValidateAsync(command, ct);
        if (!validationResult.IsValid)
            throw new ValidationException(validationResult.Errors);

        var cliente = await _repository.GetByIdAsync(command.Id, ct)
            ?? throw new KeyNotFoundException($"No existe un cliente con id '{command.Id}'.");

        cliente.Update(command.Nombre, command.Nit, command.Telefono, command.Ciudad);
        await _repository.UpdateAsync(cliente, ct);

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
