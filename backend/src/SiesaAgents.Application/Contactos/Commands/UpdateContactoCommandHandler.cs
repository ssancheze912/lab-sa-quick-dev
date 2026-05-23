using FluentValidation;
using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Application.Contactos.Validators;
using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.Application.Contactos.Commands;

public class UpdateContactoCommandHandler
{
    private readonly IContactoRepository _repository;
    private readonly UpdateContactoCommandValidator _validator;

    public UpdateContactoCommandHandler(IContactoRepository repository, UpdateContactoCommandValidator validator)
    {
        _repository = repository;
        _validator = validator;
    }

    public async Task<ContactoDto> HandleAsync(UpdateContactoCommand command, CancellationToken ct)
    {
        var validationResult = await _validator.ValidateAsync(command, ct);
        if (!validationResult.IsValid)
            throw new ValidationException(validationResult.Errors);

        var entity = await _repository.GetByIdAsync(command.Id, ct)
            ?? throw new KeyNotFoundException($"Contacto con id '{command.Id}' no encontrado.");

        entity.Update(command.Nombre, command.Cargo, command.Telefono, command.Email);
        await _repository.UpdateAsync(entity, ct);

        return new ContactoDto(
            entity.Id,
            entity.Nombre,
            entity.Cargo,
            entity.Telefono,
            entity.Email,
            entity.ClienteId,
            entity.CreatedAt,
            entity.UpdatedAt
        );
    }
}
