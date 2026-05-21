using FluentValidation;
using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Application.Contactos.Validators;
using SiesaAgents.Domain.Contactos.Entities;
using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.Application.Contactos.Commands;

public class CreateContactoCommandHandler
{
    private readonly IContactoRepository _repository;
    private readonly CreateContactoCommandValidator _validator;

    public CreateContactoCommandHandler(IContactoRepository repository, CreateContactoCommandValidator validator)
    {
        _repository = repository;
        _validator = validator;
    }

    public async Task<ContactoDto> HandleAsync(CreateContactoCommand command, CancellationToken ct)
    {
        var result = await _validator.ValidateAsync(command, ct);
        if (!result.IsValid)
            throw new ValidationException(result.Errors);

        var entity = ContactoEntity.Create(command.Nombre, command.Cargo, command.Telefono, command.Email);
        var created = await _repository.CreateAsync(entity, ct);

        return new ContactoDto(
            created.Id,
            created.Nombre,
            created.Cargo,
            created.Telefono,
            created.Email,
            created.ClienteId,
            created.CreatedAt,
            created.UpdatedAt
        );
    }
}
