using FluentValidation;
using SiesaAgents.Application.Contactos.Commands;

namespace SiesaAgents.Application.Contactos.Validators;

public sealed class CreateContactoRequestValidator : AbstractValidator<CreateContactoCommand>
{
    public CreateContactoRequestValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty()
            .WithMessage("El campo Nombre es obligatorio.");

        RuleFor(x => x.Cargo)
            .NotEmpty()
            .WithMessage("El campo Cargo es obligatorio.");

        RuleFor(x => x.Telefono)
            .NotEmpty()
            .WithMessage("El campo Teléfono es obligatorio.");

        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("El campo Email es obligatorio.")
            .EmailAddress()
            .WithMessage("El campo Email no tiene un formato válido.");
    }
}
