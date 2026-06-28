using FluentValidation;
using SiesaAgents.Application.Contactos.DTOs;

namespace SiesaAgents.Application.Contactos.Validators;

public class UpdateContactoRequestValidator : AbstractValidator<UpdateContactoRequest>
{
    public UpdateContactoRequestValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty()
            .MaximumLength(255);

        RuleFor(x => x.Cargo)
            .NotEmpty()
            .MaximumLength(255);

        RuleFor(x => x.Telefono)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(x => x.Email)
            .NotEmpty()
            .MaximumLength(255)
            .EmailAddress();
    }
}
