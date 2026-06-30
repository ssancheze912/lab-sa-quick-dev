using FluentValidation;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Domain.Clientes.Exceptions;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.Application.Clientes.Commands;

public class UpdateClienteCommandHandler
{
    private readonly IClienteRepository _repository;
    private readonly IValidator<UpdateClienteCommand> _validator;

    public UpdateClienteCommandHandler(IClienteRepository repository, IValidator<UpdateClienteCommand> validator)
    {
        _repository = repository;
        _validator = validator;
    }

    public async Task<ClienteDto> Handle(UpdateClienteCommand command, CancellationToken ct)
    {
        await _validator.ValidateAndThrowAsync(command, ct);

        var entity = await _repository.GetByIdAsync(command.Id, ct)
            ?? throw new NotFoundException($"Cliente con id {command.Id} no encontrado.");

        entity.Update(command.Nombre, command.Nit, command.Telefono, command.Ciudad);

        await _repository.UpdateAsync(entity, ct);

        return new ClienteDto(
            entity.Id,
            entity.Nombre,
            entity.Nit,
            entity.Telefono,
            entity.Ciudad,
            entity.CreatedAt,
            entity.UpdatedAt
        );
    }
}
