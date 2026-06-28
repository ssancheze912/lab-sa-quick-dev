using FluentValidation;
using SiesaAgents.Application.Contactos.DTOs;

namespace SiesaAgents.Application.Contactos.Validators;

public class CreateContactoRequestValidator : AbstractValidator<CreateContactoRequest>
{
    public CreateContactoRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Cargo).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Telefono).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(255);
    }
}
