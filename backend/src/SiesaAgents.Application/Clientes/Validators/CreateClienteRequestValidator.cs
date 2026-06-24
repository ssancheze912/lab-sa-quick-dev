using FluentValidation;
using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Validators;

public class CreateClienteRequestValidator : AbstractValidator<CreateClienteRequest>
{
    public CreateClienteRequestValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre es requerido.")
            .MaximumLength(200).WithMessage("El nombre no puede exceder 200 caracteres.");

        RuleFor(x => x.Nit)
            .NotEmpty().WithMessage("El NIT/RUC es requerido.")
            .MaximumLength(50).WithMessage("El NIT/RUC no puede exceder 50 caracteres.");

        RuleFor(x => x.Telefono)
            .NotEmpty().WithMessage("El teléfono es requerido.")
            .MaximumLength(30).WithMessage("El teléfono no puede exceder 30 caracteres.");

        RuleFor(x => x.Ciudad)
            .NotEmpty().WithMessage("La ciudad es requerida.")
            .MaximumLength(100).WithMessage("La ciudad no puede exceder 100 caracteres.");
    }
}
