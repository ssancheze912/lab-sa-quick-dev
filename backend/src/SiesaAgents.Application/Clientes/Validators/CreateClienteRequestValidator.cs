using FluentValidation;

namespace SiesaAgents.Application.Clientes.Validators;

public sealed record CreateClienteRequest(string Nombre, string Nit, string Telefono, string Ciudad);

public sealed class CreateClienteRequestValidator : AbstractValidator<CreateClienteRequest>
{
    public CreateClienteRequestValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre es requerido.")
            .MaximumLength(255).WithMessage("El nombre no puede superar 255 caracteres.");

        RuleFor(x => x.Nit)
            .NotEmpty().WithMessage("El NIT/RUC es requerido.")
            .MaximumLength(50).WithMessage("El NIT/RUC no puede superar 50 caracteres.");

        RuleFor(x => x.Telefono)
            .NotEmpty().WithMessage("El teléfono es requerido.")
            .MaximumLength(50).WithMessage("El teléfono no puede superar 50 caracteres.");

        RuleFor(x => x.Ciudad)
            .NotEmpty().WithMessage("La ciudad es requerida.")
            .MaximumLength(100).WithMessage("La ciudad no puede superar 100 caracteres.");
    }
}
