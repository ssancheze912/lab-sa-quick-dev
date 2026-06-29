using FluentValidation;
using SiesaAgents.Application.Contactos.Commands;

namespace SiesaAgents.Application.Contactos.Validators;

public sealed class AssignClienteCommandValidator : AbstractValidator<AssignClienteCommand>
{
    public AssignClienteCommandValidator()
    {
        RuleFor(x => x.ContactoId)
            .NotEqual(Guid.Empty)
            .WithMessage("El identificador del contacto no es válido.");
    }
}
