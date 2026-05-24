using FluentValidation;

namespace SiesaAgents.Application.Clientes.Commands;

public class CreateClienteCommandValidator : AbstractValidator<CreateClienteCommand>
{
    public CreateClienteCommandValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El Nombre es requerido.")
            .MaximumLength(200).WithMessage("El Nombre no puede superar los 200 caracteres.");

        RuleFor(x => x.Nit)
            .NotEmpty().WithMessage("El NIT/RUC es requerido.")
            .MaximumLength(50).WithMessage("El NIT/RUC no puede superar los 50 caracteres.");

        RuleFor(x => x.Telefono)
            .NotEmpty().WithMessage("El Teléfono es requerido.")
            .MaximumLength(30).WithMessage("El Teléfono no puede superar los 30 caracteres.");

        RuleFor(x => x.Ciudad)
            .NotEmpty().WithMessage("La Ciudad es requerida.")
            .MaximumLength(100).WithMessage("La Ciudad no puede superar los 100 caracteres.");
    }
}
