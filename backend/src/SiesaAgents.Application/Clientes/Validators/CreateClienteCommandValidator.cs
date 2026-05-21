using FluentValidation;
using SiesaAgents.Application.Clientes.Commands;

namespace SiesaAgents.Application.Clientes.Validators;

public class CreateClienteCommandValidator : AbstractValidator<CreateClienteCommand>
{
    public CreateClienteCommandValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre es requerido")
            .MaximumLength(200).WithMessage("El nombre no puede superar 200 caracteres");

        RuleFor(x => x.Nit)
            .NotEmpty().WithMessage("El NIT/RUC es requerido")
            .MaximumLength(50).WithMessage("El NIT/RUC no puede superar 50 caracteres");

        // Telefono is optional; when provided it must not be whitespace and must respect max length
        When(x => x.Telefono != null, () =>
        {
            RuleFor(x => x.Telefono)
                .NotEmpty().WithMessage("El teléfono no puede estar vacío si se especifica")
                .MaximumLength(50).WithMessage("El teléfono no puede superar 50 caracteres");
        });

        RuleFor(x => x.Ciudad)
            .NotEmpty().WithMessage("La ciudad es requerida")
            .MaximumLength(100).WithMessage("La ciudad no puede superar 100 caracteres");
    }
}
