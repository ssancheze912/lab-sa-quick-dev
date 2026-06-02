using FluentValidation;
using SiesaAgents.Application.Contactos.Commands;

namespace SiesaAgents.Application.Contactos.Validators;

public class CreateContactoCommandValidator : AbstractValidator<CreateContactoCommand>
{
    public CreateContactoCommandValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre es requerido")
            .MaximumLength(200).WithMessage("El nombre no puede superar los 200 caracteres");

        // Cargo is optional; when provided it must not be whitespace and must respect max length
        When(x => x.Cargo != null, () =>
        {
            RuleFor(x => x.Cargo)
                .NotEmpty().WithMessage("El cargo no puede estar vacío si se especifica")
                .MaximumLength(100).WithMessage("El cargo no puede superar los 100 caracteres");
        });

        // Telefono is optional; when provided it must not be whitespace and must respect max length
        When(x => x.Telefono != null, () =>
        {
            RuleFor(x => x.Telefono)
                .NotEmpty().WithMessage("El teléfono no puede estar vacío si se especifica")
                .MaximumLength(50).WithMessage("El teléfono no puede superar los 50 caracteres");
        });

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("El email es requerido")
            .EmailAddress().WithMessage("El email no tiene un formato válido")
            .MaximumLength(200).WithMessage("El email no puede superar los 200 caracteres");
    }
}
