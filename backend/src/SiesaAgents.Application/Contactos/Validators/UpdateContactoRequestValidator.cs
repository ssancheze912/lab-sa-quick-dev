using FluentValidation;
using SiesaAgents.Application.Contactos.DTOs;

namespace SiesaAgents.Application.Contactos.Validators;

public class UpdateContactoRequestValidator : AbstractValidator<UpdateContactoRequest>
{
    public UpdateContactoRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Cargo).MaximumLength(100).When(x => x.Cargo is not null);
        RuleFor(x => x.Telefono).MaximumLength(50).When(x => x.Telefono is not null);
    }
}
