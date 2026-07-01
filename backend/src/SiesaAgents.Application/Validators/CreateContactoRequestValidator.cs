using FluentValidation;
using SiesaAgents.Application.Commands.Contactos;

namespace SiesaAgents.Application.Validators;

public class CreateContactoRequestValidator : AbstractValidator<CreateContactoCommand>
{
    public CreateContactoRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty();
        RuleFor(x => x.Cargo).NotEmpty();
        RuleFor(x => x.Telefono).NotEmpty();
        RuleFor(x => x.Email).NotEmpty();
    }
}
